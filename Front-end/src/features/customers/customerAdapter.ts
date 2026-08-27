import { getSupabaseBrowserClient } from "./client";
import type {
  AdapterFailure,
  AdapterResult,
  BakeryScope,
  CreateCustomerInput,
  CustomerPort,
  CustomerResult,
  CustomerType,
  DomainCustomer,
  UpdateCustomerInput,
} from "../../app/domain/types";

const CUSTOMER_COLUMNS = "id,bakery_id,name,email,phone,type,address,notes";
const ORDER_COLUMNS = "customer_id,total_cents,status";

export interface CustomerRow {
  id: string | null;
  bakery_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: string | null;
  address: string | null;
  notes: string | null;
}

interface CustomerInsert {
  bakery_id: string;
  name: string;
  email: string;
  phone: string | null;
  type: CustomerType;
  address: string | null;
  notes: string | null;
}

interface CustomerQuery<T> extends PromiseLike<QueryResult<T>> {
  select<TResult = T>(columns: string): CustomerQuery<TResult>;
  insert<TResult = T>(values: CustomerInsert): CustomerQuery<TResult>;
  update<TResult = T>(values: Partial<CustomerInsert>): CustomerQuery<TResult>;
  eq(column: "bakery_id" | "id", value: string): CustomerQuery<T>;
  order(column: "name", options: { ascending: boolean }): CustomerQuery<T>;
  single(): CustomerQuery<CustomerRow>;
}

interface OrderRow {
  customer_id: string | null;
  total_cents: number | null;
  status: string | null;
}

interface OrderQuery extends PromiseLike<QueryResult<OrderRow[]>> {
  select<TResult = OrderRow[]>(columns: string): OrderQuery;
  eq(column: "bakery_id", value: string): OrderQuery;
}

interface CustomerClient {
  from(table: "customers"): CustomerQuery<unknown>;
  from(table: "orders"): OrderQuery;
}

interface QueryError {
  code?: string;
  message: string;
  status?: number;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

export interface SupabaseCustomerAdapter extends CustomerPort {
  loadCustomers(scope: BakeryScope): Promise<AdapterResult<readonly DomainCustomer[]>>;
}

function failure(error: AdapterFailure): AdapterResult<never> {
  return { ok: false, error };
}

function validation(message: string, field?: string): AdapterResult<never> {
  return failure({ kind: "validation", message, retryable: false, ...(field ? { field } : {}) });
}

function text(value: string | null, field: string): string {
  if (value == null || value.trim() === "") {
    throw new Error(`Customer row is missing ${field}.`);
  }
  return value;
}

function optionalText(value: string | null): string | undefined {
  return value == null || value.trim() === "" ? undefined : value;
}

function customerType(value: string | null): CustomerType {
  if (value === "wholesale" || value === "retail") return value;
  throw new Error("Customer row has an invalid customer type.");
}

export function mapCustomerRow(row: CustomerRow): DomainCustomer {
  return {
    id: text(row.id, "id"),
    name: text(row.name, "name"),
    email: optionalText(row.email) ?? "",
    phone: optionalText(row.phone),
    type: customerType(row.type),
    address: optionalText(row.address),
    notes: optionalText(row.notes),
  };
}

interface CustomerOrderTotals {
  totalOrders: number;
  totalSpent: number;
}

function buildCustomerOrderTotals(rows: readonly OrderRow[]): ReadonlyMap<string, CustomerOrderTotals> {
  const totals = new Map<string, CustomerOrderTotals>();

  rows.forEach(row => {
    if (!row.customer_id || row.status === "cancelled") return;

    const current = totals.get(row.customer_id) ?? { totalOrders: 0, totalSpent: 0 };
    current.totalOrders += 1;
    current.totalSpent += Number(row.total_cents ?? 0) / 100;
    totals.set(row.customer_id, current);
  });

  return totals;
}

function withOrderTotals(customer: DomainCustomer, totals: ReadonlyMap<string, CustomerOrderTotals>): DomainCustomer {
  const customerTotals = totals.get(customer.id) ?? { totalOrders: 0, totalSpent: 0 };
  return {
    ...customer,
    totalOrders: customerTotals.totalOrders,
    totalSpent: Math.round(customerTotals.totalSpent * 100) / 100,
  };
}

function mapError(error: QueryError, operation: string): AdapterFailure {
  const code = error.code?.toUpperCase();
  const status = error.status;
  const message = `${operation}: ${error.message}`;

  if (status === 401 || status === 403 || code === "42501" || code === "PGRST301") {
    return { kind: "authorization", message, retryable: false };
  }

  if (code === "PGRST116") {
    return { kind: "authorization", message, retryable: false };
  }

  if (code?.startsWith("22") || code?.startsWith("23") || status === 400) {
    return { kind: "validation", message, retryable: false };
  }

  if (code?.startsWith("08") || code === "PGRST000" || /failed to fetch|network|timeout|connection/i.test(error.message)) {
    return { kind: "connection", message, retryable: true };
  }

  return { kind: "unknown", message, retryable: false };
}

function mappedRow(row: CustomerRow | null, operation: string): AdapterResult<DomainCustomer> {
  if (!row) {
    return failure({ kind: "unknown", message: `${operation}: Supabase returned no customer row.`, retryable: false });
  }

  try {
    return { ok: true, data: mapCustomerRow(row) };
  } catch (error) {
    return failure({
      kind: "unknown",
      message: `${operation}: ${error instanceof Error ? error.message : "Supabase returned an invalid customer row."}`,
      retryable: false,
    });
  }
}

function mappedScopedRow(
  row: CustomerRow | null,
  bakeryId: string,
  operation: string,
): AdapterResult<DomainCustomer> {
  if (row?.bakery_id !== bakeryId) {
    return failure({
      kind: "authorization",
      message: `${operation}: Supabase returned a customer outside the active bakery.`,
      retryable: false,
    });
  }
  return mappedRow(row, operation);
}

function result(operationId: string, customer: DomainCustomer): AdapterResult<CustomerResult> {
  return {
    ok: true,
    data: {
      kind: "customer-mutated",
      operationId,
      changes: { customers: [customer] },
    },
  };
}

function normalizeRequired(value: string | undefined, field: "name" | "email"): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createSupabaseCustomerAdapter(
  client: CustomerClient = getSupabaseBrowserClient() as unknown as CustomerClient,
): SupabaseCustomerAdapter {
  return {
    async loadCustomers(scope) {
      if (!scope.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");

      const [customerResult, orderResult] = await Promise.all([
        client
          .from("customers")
          .select<CustomerRow[]>(CUSTOMER_COLUMNS)
          .eq("bakery_id", scope.bakeryId)
          .order("name", { ascending: true }),
        client
          .from("orders")
          .select<OrderRow[]>(ORDER_COLUMNS)
          .eq("bakery_id", scope.bakeryId),
      ]);

      if (customerResult.error) return failure(mapError(customerResult.error, "Failed to load customers"));
      if (orderResult.error) return failure(mapError(orderResult.error, "Failed to load customer order totals"));

      try {
        const customerRows = (customerResult.data ?? []).filter((row) => row.bakery_id === scope.bakeryId);
        const orderTotals = buildCustomerOrderTotals(orderResult.data ?? []);
        return {
          ok: true,
          data: customerRows.map(row => withOrderTotals(mapCustomerRow(row), orderTotals)),
        };
      } catch (mappingError) {
        return failure({
          kind: "unknown",
          message: `Failed to load customers: ${mappingError instanceof Error ? mappingError.message : "Supabase returned invalid customer data."}`,
          retryable: false,
        });
      }
    },

    async createCustomer(input: CreateCustomerInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      const name = normalizeRequired(input.name, "name");
      if (!name) return validation("Customer name is required.", "name");
      const email = input.email?.trim() ?? "";

      // Deliberately omit input.customerId: the database default owns persisted UUIDs.
      const { data, error } = await client
        .from("customers")
        .insert<CustomerRow>({
          bakery_id: input.bakeryId,
          name,
          email,
          phone: input.phone?.trim() || null,
          type: input.type,
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .select<CustomerRow>(CUSTOMER_COLUMNS)
        .single();
      if (error) return failure(mapError(error, "Failed to create customer"));

      const mapped = mappedScopedRow(data, input.bakeryId, "Failed to create customer");
      return mapped.ok ? result(input.operationId, mapped.data) : mapped;
    },

    async updateCustomer(input: UpdateCustomerInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.customerId.trim()) return validation("A customer ID is required.", "customerId");

      const patch: Partial<CustomerInsert> = {};
      if (input.name !== undefined) {
        const name = normalizeRequired(input.name, "name");
        if (!name) return validation("Customer name is required.", "name");
        patch.name = name;
      }
      if (input.email !== undefined) patch.email = input.email.trim();
      if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
      if (input.type !== undefined) patch.type = input.type;
      if (input.address !== undefined) patch.address = input.address.trim() || null;
      if (input.notes !== undefined) patch.notes = input.notes.trim() || null;
      if (Object.keys(patch).length === 0) return validation("At least one customer field is required to update.");

      const { data, error } = await client
        .from("customers")
        .update<CustomerRow>(patch)
        .eq("bakery_id", input.bakeryId)
        .eq("id", input.customerId)
        .select<CustomerRow>(CUSTOMER_COLUMNS)
        .single();
      if (error) return failure(mapError(error, "Failed to update customer"));

      const mapped = mappedScopedRow(data, input.bakeryId, "Failed to update customer");
      return mapped.ok ? result(input.operationId, mapped.data) : mapped;
    },
  };
}

export const createSupabaseCustomerPort = createSupabaseCustomerAdapter;
