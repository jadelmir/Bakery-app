import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type {
  AdapterFailure,
  AdapterResult,
  BakeryDomainSnapshot,
  CancelInvoiceInput,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  DomainInvoice,
  DomainInvoiceEvent,
  DomainInvoiceItem,
  DomainPayment,
  DomainPaymentMethod,
  InvoiceResult,
  InvoiceStatus,
  InvoicingPort,
  RecordPaymentInput,
  UpdateInvoiceInput,
  UpdatePaymentMethodInput,
} from "../../app/domain/types";

const INVOICE_COLUMNS = "id,bakery_id,invoice_number,order_id,customer_id,status,subtotal_cents,tax_cents,discount_cents,total_cents,amount_paid_cents,balance_cents,public_token,due_date,notes,customer_snapshot_json,bakery_snapshot_json,created_at,updated_at";
const ITEM_COLUMNS = "id,invoice_id,description,quantity,unit_price_cents,total_price_cents,created_at";
const PAYMENT_COLUMNS = "id,bakery_id,invoice_id,order_id,amount_cents,payment_method,reference_number,notes,created_at";
const EVENT_COLUMNS = "id,invoice_id,event_type,description,created_at";
const METHOD_COLUMNS = "id,bakery_id,method_type,is_enabled,instructions,account_details_json,created_at,updated_at";

type QueryError = { code?: string; message: string; status?: number };
type QueryResult<T> = { data: T | null; error: QueryError | null };

interface InvoiceQuery<T> extends PromiseLike<QueryResult<T>> {
  select<TResult = T>(columns: string): InvoiceQuery<TResult>;
  insert<TResult = T>(values: unknown): InvoiceQuery<TResult>;
  update<TResult = T>(values: unknown): InvoiceQuery<TResult>;
  delete<TResult = T>(): InvoiceQuery<TResult>;
  eq(column: string, value: string): InvoiceQuery<T>;
  in(column: string, values: readonly string[]): InvoiceQuery<T>;
  order(column: string, options: { ascending: boolean }): InvoiceQuery<T>;
  single<TResult = T>(): InvoiceQuery<TResult>;
}

interface InvoiceClient {
  from(table: "invoices" | "invoice_items" | "invoice_events" | "payments" | "bakery_payment_methods" | "invoice_payment_methods" | "customers"): InvoiceQuery<unknown>;
}

interface InvoiceRow {
  id: string | null;
  bakery_id: string | null;
  invoice_number: string | null;
  order_id: string | null;
  customer_id: string | null;
  status: string | null;
  subtotal_cents: number | string | null;
  tax_cents: number | string | null;
  discount_cents: number | string | null;
  total_cents: number | string | null;
  amount_paid_cents: number | string | null;
  balance_cents: number | string | null;
  public_token: string | null;
  due_date: string | null;
  notes: string | null;
  customer_snapshot_json: unknown;
  bakery_snapshot_json: unknown;
  created_at: string | null;
  updated_at: string | null;
}

interface ItemRow {
  id: string | null;
  invoice_id: string | null;
  description: string | null;
  quantity: number | string | null;
  unit_price_cents: number | string | null;
  total_price_cents: number | string | null;
}

interface PaymentRow {
  id: string | null;
  bakery_id: string | null;
  invoice_id: string | null;
  order_id: string | null;
  amount_cents: number | string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string | null;
}

interface EventRow {
  id: string | null;
  invoice_id: string | null;
  event_type: string | null;
  description: string | null;
  created_at: string | null;
}

interface MethodRow {
  id: string | null;
  bakery_id: string | null;
  method_type: string | null;
  is_enabled: boolean | null;
  instructions: string | null;
  account_details_json: unknown;
  created_at: string | null;
  updated_at: string | null;
}

interface CustomerRow {
  id: string | null;
  bakery_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

const failure = (error: AdapterFailure): AdapterResult<never> => ({ ok: false, error });
const validation = (message: string, field?: string): AdapterResult<never> => failure({ kind: "validation", message, retryable: false, ...(field ? { field } : {}) });
const numberValue = (value: number | string | null, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invoice row has an invalid ${field}.`);
  return parsed;
};
const requiredText = (value: string | null, field: string): string => {
  if (!value || !value.trim()) throw new Error(`Invoice row is missing ${field}.`);
  return value;
};
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateOnly = (value: string | null | undefined) => value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);

const statusFromDb = (value: string | null): InvoiceStatus => {
  switch (value) {
    case "sent": return "Sent";
    case "viewed": return "Viewed";
    case "partially_paid": return "Partially paid";
    case "paid": return "Paid";
    case "overdue": return "Overdue";
    case "cancelled": return "Cancelled";
    default: return "Draft";
  }
};
const statusToDb = (value: InvoiceStatus): string => value === "Partially paid" ? "partially_paid" : value.toLowerCase();
const paymentType = (value: string | null): DomainPayment["paymentMethodType"] => {
  if (value === "zelle" || value === "paypal" || value === "cash" || value === "check" || value === "custom") return value;
  throw new Error(`Invoice payment has an invalid payment method: ${value ?? "missing"}.`);
};
const methodName = (type: DomainPaymentMethod["methodType"]) => ({ zelle: "Zelle", paypal: "PayPal", cash: "Cash", check: "Check", custom: "Custom" })[type];
const manualConfirmation = (type: DomainPaymentMethod["methodType"]) => type === "zelle" || type === "custom";

function mapError(error: QueryError, operation: string): AdapterFailure {
  const code = error.code?.toUpperCase();
  const message = `${operation}: ${error.message}`;
  if (error.status === 401 || error.status === 403 || code === "42501" || code === "PGRST301") return { kind: "authorization", message, retryable: false };
  if (code?.startsWith("22") || code?.startsWith("23") || error.status === 400) return { kind: "validation", message, retryable: false };
  if (code?.startsWith("08") || code === "PGRST000" || /failed to fetch|network|timeout|connection/i.test(error.message)) return { kind: "connection", message, retryable: true };
  return { kind: "unknown", message, retryable: false };
}

function mappedError(operation: string, cause: unknown): AdapterResult<never> {
  return failure({ kind: "unknown", message: `${operation}: ${cause instanceof Error ? cause.message : "Supabase returned invalid invoice data."}`, retryable: false });
}

function jsonRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function mapItem(row: ItemRow, invoiceId: string): DomainInvoiceItem {
  if (row.invoice_id !== invoiceId) throw new Error("Supabase returned an invoice item outside the requested invoice.");
  return {
    id: requiredText(row.id, "item id"),
    invoiceId,
    description: requiredText(row.description, "item description"),
    quantity: numberValue(row.quantity, "item quantity"),
    unitPriceCents: numberValue(row.unit_price_cents, "unit_price_cents"),
    totalCents: numberValue(row.total_price_cents, "total_price_cents"),
  };
}

function mapInvoice(row: InvoiceRow, items: readonly ItemRow[], expectedBakeryId?: string): DomainInvoice {
  const bakeryId = requiredText(row.bakery_id, "bakery id");
  if (expectedBakeryId && bakeryId !== expectedBakeryId) throw new Error("Supabase returned an invoice outside the active bakery.");
  const id = requiredText(row.id, "id");
  const customerSnapshot = jsonRecord(row.customer_snapshot_json);
  const bakerySnapshot = jsonRecord(row.bakery_snapshot_json);
  return {
    id,
    bakeryId,
    invoiceNumber: requiredText(row.invoice_number, "invoice number"),
    publicToken: requiredText(row.public_token, "public token"),
    orderId: row.order_id ?? undefined,
    customerId: requiredText(row.customer_id, "customer id"),
    customerName: typeof customerSnapshot?.name === "string" ? customerSnapshot.name : undefined,
    customerEmail: typeof customerSnapshot?.email === "string" ? customerSnapshot.email : undefined,
    status: statusFromDb(row.status),
    issueDate: dateOnly(row.created_at),
    dueDate: dateOnly(row.due_date),
    subtotalCents: numberValue(row.subtotal_cents, "subtotal_cents"),
    taxCents: numberValue(row.tax_cents, "tax_cents"),
    discountCents: numberValue(row.discount_cents, "discount_cents"),
    totalCents: numberValue(row.total_cents, "total_cents"),
    amountPaidCents: numberValue(row.amount_paid_cents, "amount_paid_cents"),
    balanceCents: numberValue(row.balance_cents, "balance_cents"),
    items: items.filter(item => item.invoice_id === id).map(item => mapItem(item, id)),
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    customerSnapshotJson: customerSnapshot,
    bakerySnapshotJson: bakerySnapshot,
  };
}

function mapPayment(row: PaymentRow, bakeryId: string): DomainPayment {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned a payment outside the active bakery.");
  return {
    id: requiredText(row.id, "payment id"),
    invoiceId: requiredText(row.invoice_id, "invoice id"),
    bakeryId,
    paymentMethodType: paymentType(row.payment_method),
    amountCents: numberValue(row.amount_cents, "amount_cents"),
    paymentDate: row.created_at ?? new Date().toISOString(),
    referenceNumber: row.reference_number ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapEvent(row: EventRow, invoiceId?: string): DomainInvoiceEvent {
  const eventInvoiceId = requiredText(row.invoice_id, "event invoice id");
  if (invoiceId && eventInvoiceId !== invoiceId) throw new Error("Supabase returned an invoice event outside the requested invoice.");
  const eventType = row.event_type === "payment_received" ? "payment_recorded" : row.event_type;
  if (eventType !== "created" && eventType !== "sent" && eventType !== "viewed" && eventType !== "payment_recorded" && eventType !== "cancelled" && eventType !== "status_changed") throw new Error("Invoice event has an invalid event type.");
  return { id: requiredText(row.id, "event id"), invoiceId: eventInvoiceId, eventType, notes: row.description ?? undefined, createdAt: row.created_at ?? new Date().toISOString() };
}

function mapMethod(row: MethodRow, bakeryId: string): DomainPaymentMethod {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned a payment method outside the active bakery.");
  const methodType = paymentType(row.method_type);
  const details = jsonRecord(row.account_details_json);
  return {
    id: requiredText(row.id, "payment method id"),
    bakeryId,
    methodType,
    name: typeof details?.name === "string" && details.name.trim() ? details.name : methodName(methodType),
    instructions: row.instructions ?? undefined,
    isEnabled: row.is_enabled ?? false,
    requiresManualConfirmation: manualConfirmation(methodType),
  };
}

export interface SupabasePublicInvoice {
  readonly invoice?: DomainInvoice;
  readonly paymentMethods: readonly DomainPaymentMethod[];
}

export interface SupabaseInvoiceAdapter extends InvoicingPort {
  loadInvoicing(bakeryId: string): Promise<AdapterResult<Pick<BakeryDomainSnapshot, "invoicesById" | "paymentsById" | "invoiceEventsById" | "paymentMethodsById">>>;
  loadPublicInvoice(publicToken: string): Promise<AdapterResult<SupabasePublicInvoice>>;
}

export function createSupabaseInvoiceAdapter(client: InvoiceClient = getSupabaseBrowserClient() as unknown as InvoiceClient): SupabaseInvoiceAdapter {
  const loadInvoicing = async (bakeryId: string): Promise<AdapterResult<Pick<BakeryDomainSnapshot, "invoicesById" | "paymentsById" | "invoiceEventsById" | "paymentMethodsById">>> => {
    if (!bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
    const [invoicesResult, paymentsResult, methodsResult] = await Promise.all([
      client.from("invoices").select<InvoiceRow[]>(INVOICE_COLUMNS).eq("bakery_id", bakeryId).order("created_at", { ascending: false }),
      client.from("payments").select<PaymentRow[]>(PAYMENT_COLUMNS).eq("bakery_id", bakeryId).order("created_at", { ascending: false }),
      client.from("bakery_payment_methods").select<MethodRow[]>(METHOD_COLUMNS).eq("bakery_id", bakeryId).order("created_at", { ascending: true }),
    ]);
    if (invoicesResult.error) return failure(mapError(invoicesResult.error, "Failed to load invoices"));
    if (paymentsResult.error) return failure(mapError(paymentsResult.error, "Failed to load invoice payments"));
    if (methodsResult.error) return failure(mapError(methodsResult.error, "Failed to load payment methods"));

    const invoiceRows = invoicesResult.data ?? [];
    const invoiceIds = invoiceRows.map(row => row.id).filter((id): id is string => Boolean(id));
    const [itemsResult, eventsResult] = await Promise.all([
      invoiceIds.length ? client.from("invoice_items").select<ItemRow[]>(ITEM_COLUMNS).in("invoice_id", invoiceIds) : Promise.resolve({ data: [], error: null } as QueryResult<ItemRow[]>),
      invoiceIds.length ? client.from("invoice_events").select<EventRow[]>(EVENT_COLUMNS).in("invoice_id", invoiceIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null } as QueryResult<EventRow[]>),
    ]);
    if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to load invoice items"));
    if (eventsResult.error) return failure(mapError(eventsResult.error, "Failed to load invoice events"));

    try {
      const items = itemsResult.data ?? [];
      const invoices = invoiceRows.map(row => mapInvoice(row, items, bakeryId));
      const payments = (paymentsResult.data ?? []).map(row => mapPayment(row, bakeryId));
      const events = (eventsResult.data ?? []).map(row => mapEvent(row));
      const methods = (methodsResult.data ?? []).map(row => mapMethod(row, bakeryId));
      return {
        ok: true,
        data: {
          invoicesById: Object.fromEntries(invoices.map(invoice => [invoice.id, invoice])),
          paymentsById: Object.fromEntries(payments.map(payment => [payment.id, payment])),
          invoiceEventsById: Object.fromEntries(events.map(event => [event.id, event])),
          paymentMethodsById: Object.fromEntries(methods.map(method => [method.id, method])),
        },
      };
    } catch (cause) {
      return mappedError("Failed to load invoicing data", cause);
    }
  };

  const mutation = (operationId: string, changes: InvoiceResult["changes"]): AdapterResult<InvoiceResult> => ({ ok: true, data: { kind: "invoice-mutated", operationId, changes } });

  return {
    loadInvoicing,

    async loadPublicInvoice(publicToken) {
      if (!publicToken.trim()) return validation("A public invoice token is required.", "publicToken");
      const invoiceResult = await client.from("invoices").select<InvoiceRow[]>(INVOICE_COLUMNS).eq("public_token", publicToken);
      if (invoiceResult.error) return failure(mapError(invoiceResult.error, "Failed to load public invoice"));
      const row = invoiceResult.data?.[0];
      if (!row) return { ok: true, data: { invoice: undefined, paymentMethods: [] } };
      const invoiceId = requiredText(row.id, "invoice id");
      const bakeryId = requiredText(row.bakery_id, "bakery id");
      const [itemsResult, methodsResult] = await Promise.all([
        client.from("invoice_items").select<ItemRow[]>(ITEM_COLUMNS).eq("invoice_id", invoiceId),
        client.from("bakery_payment_methods").select<MethodRow[]>(METHOD_COLUMNS).eq("bakery_id", bakeryId).eq("is_enabled", "true"),
      ]);
      if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to load public invoice items"));
      if (methodsResult.error) return failure(mapError(methodsResult.error, "Failed to load public payment methods"));
      try {
        return { ok: true, data: { invoice: mapInvoice(row, itemsResult.data ?? []), paymentMethods: (methodsResult.data ?? []).map(method => mapMethod(method, bakeryId)) } };
      } catch (cause) {
        return mappedError("Failed to load public invoice", cause);
      }
    },

    async createInvoice(input: CreateInvoiceInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.invoiceId.trim()) return validation("An invoice ID is required.", "invoiceId");
      if (!input.customerId.trim()) return validation("A customer is required.", "customerId");
      const items = input.items ?? [];
      if (!items.length) return validation("Invoice must contain at least one line item.", "items");
      const customerResult = await client.from("customers").select<CustomerRow[]>("id,bakery_id,name,email,phone,address").eq("bakery_id", input.bakeryId).eq("id", input.customerId);
      if (customerResult.error) return failure(mapError(customerResult.error, "Failed to load invoice customer"));
      const customer = customerResult.data?.[0];
      if (!customer) return validation("The selected customer does not exist in this bakery.", "customerId");
      const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0);
      const taxCents = input.taxCents ?? 0;
      const discountCents = input.discountCents ?? 0;
      const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
      const invoiceResult = await client.from("invoices").insert({
        id: input.invoiceId,
        bakery_id: input.bakeryId,
        invoice_number: "",
        order_id: input.orderId ?? null,
        customer_id: input.customerId,
        status: "draft",
        subtotal_cents: subtotalCents,
        tax_cents: taxCents,
        discount_cents: discountCents,
        total_cents: totalCents,
        amount_paid_cents: 0,
        balance_cents: totalCents,
        due_date: input.dueDate ? `${input.dueDate}T00:00:00Z` : null,
        notes: input.notes ?? null,
        customer_snapshot_json: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address },
        bakery_snapshot_json: {},
      }).select<InvoiceRow>(INVOICE_COLUMNS).single();
      if (invoiceResult.error) return failure(mapError(invoiceResult.error, "Failed to create invoice"));
      if (!invoiceResult.data) return failure({ kind: "unknown", message: "Failed to create invoice: Supabase returned no invoice.", retryable: false });
      const itemRows = items.map((item: CreateInvoiceItemInput) => ({ invoice_id: input.invoiceId, description: item.description.trim(), quantity: item.quantity, unit_price_cents: item.unitPriceCents, total_price_cents: Math.round(item.quantity * item.unitPriceCents) }));
      const itemsResult = await client.from("invoice_items").insert(itemRows).select<ItemRow[]>(ITEM_COLUMNS);
      if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to create invoice items"));
      const eventResult = await client.from("invoice_events").insert({ invoice_id: input.invoiceId, event_type: "created", description: "Invoice created" });
      if (eventResult.error) return failure(mapError(eventResult.error, "Failed to record invoice event"));
      try {
        const invoice = mapInvoice(invoiceResult.data, itemsResult.data ?? []);
        const event: DomainInvoiceEvent = { id: uuid(), invoiceId: invoice.id, eventType: "created", notes: "Invoice created", createdAt: new Date().toISOString() };
        return mutation(input.operationId, { invoices: [invoice], invoiceEvents: [event] });
      } catch (cause) {
        return mappedError("Failed to create invoice", cause);
      }
    },

    async updateInvoice(input: UpdateInvoiceInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      const current = await client.from("invoices").select<InvoiceRow[]>(INVOICE_COLUMNS).eq("bakery_id", input.bakeryId).eq("id", input.invoiceId);
      if (current.error) return failure(mapError(current.error, "Failed to load invoice"));
      const existing = current.data?.[0];
      if (!existing) return validation("Invoice not found.", "invoiceId");
      let subtotalCents = numberValue(existing.subtotal_cents, "subtotal_cents");
      let itemRows: ItemRow[] = [];
      if (input.items) {
        subtotalCents = input.items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0);
        const deleted = await client.from("invoice_items").delete().eq("invoice_id", input.invoiceId);
        if (deleted.error) return failure(mapError(deleted.error, "Failed to replace invoice items"));
        const inserted = await client.from("invoice_items").insert(input.items.map(item => ({ invoice_id: input.invoiceId, description: item.description.trim(), quantity: item.quantity, unit_price_cents: item.unitPriceCents, total_price_cents: Math.round(item.quantity * item.unitPriceCents) }))).select<ItemRow[]>(ITEM_COLUMNS);
        if (inserted.error) return failure(mapError(inserted.error, "Failed to update invoice items"));
        itemRows = inserted.data ?? [];
      } else {
        const loadedItems = await client.from("invoice_items").select<ItemRow[]>(ITEM_COLUMNS).eq("invoice_id", input.invoiceId);
        if (loadedItems.error) return failure(mapError(loadedItems.error, "Failed to load invoice items"));
        itemRows = loadedItems.data ?? [];
      }
      const taxCents = input.taxCents ?? numberValue(existing.tax_cents, "tax_cents");
      const discountCents = input.discountCents ?? numberValue(existing.discount_cents, "discount_cents");
      const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
      const paidCents = numberValue(existing.amount_paid_cents, "amount_paid_cents");
      const updateResult = await client.from("invoices").update({ status: input.status ? statusToDb(input.status) : existing.status, subtotal_cents: subtotalCents, tax_cents: taxCents, discount_cents: discountCents, total_cents: totalCents, balance_cents: Math.max(0, totalCents - paidCents), due_date: input.dueDate ? `${input.dueDate}T00:00:00Z` : existing.due_date, notes: input.notes ?? existing.notes }).eq("bakery_id", input.bakeryId).eq("id", input.invoiceId).select<InvoiceRow>(INVOICE_COLUMNS).single();
      if (updateResult.error) return failure(mapError(updateResult.error, "Failed to update invoice"));
      if (!updateResult.data) return failure({ kind: "unknown", message: "Failed to update invoice: Supabase returned no invoice.", retryable: false });
      try {
        return mutation(input.operationId, { invoices: [mapInvoice(updateResult.data, itemRows)] });
      } catch (cause) {
        return mappedError("Failed to update invoice", cause);
      }
    },

    async recordPayment(input: RecordPaymentInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (input.amountCents <= 0) return validation("Payment amount must be greater than zero.", "amountCents");
      const result = await client.from("payments").insert({ id: input.paymentId, bakery_id: input.bakeryId, invoice_id: input.invoiceId, amount_cents: input.amountCents, payment_method: input.paymentMethodType, reference_number: input.referenceNumber ?? null, notes: input.notes ?? null, created_at: input.paymentDate }).select<PaymentRow>(PAYMENT_COLUMNS).single();
      if (result.error) return failure(mapError(result.error, "Failed to record invoice payment"));
      if (!result.data) return failure({ kind: "unknown", message: "Failed to record invoice payment: Supabase returned no payment.", retryable: false });
      const invoiceResult = await client.from("invoices").select<InvoiceRow[]>(INVOICE_COLUMNS).eq("bakery_id", input.bakeryId).eq("id", input.invoiceId);
      if (invoiceResult.error) return failure(mapError(invoiceResult.error, "Failed to reload invoice after payment"));
      const invoiceRow = invoiceResult.data?.[0];
      if (!invoiceRow) return validation("Invoice not found after recording payment.", "invoiceId");
      const itemsResult = await client.from("invoice_items").select<ItemRow[]>(ITEM_COLUMNS).eq("invoice_id", input.invoiceId);
      if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to reload invoice items"));
      try {
        return mutation(input.operationId, { invoices: [mapInvoice(invoiceRow, itemsResult.data ?? [])], payments: [mapPayment(result.data, input.bakeryId)] });
      } catch (cause) {
        return mappedError("Failed to record invoice payment", cause);
      }
    },

    async cancelInvoice(input: CancelInvoiceInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      const result = await client.from("invoices").update({ status: "cancelled", notes: input.reason ?? undefined }).eq("bakery_id", input.bakeryId).eq("id", input.invoiceId).select<InvoiceRow>(INVOICE_COLUMNS).single();
      if (result.error) return failure(mapError(result.error, "Failed to cancel invoice"));
      if (!result.data) return validation("Invoice not found.", "invoiceId");
      const eventResult = await client.from("invoice_events").insert({ invoice_id: input.invoiceId, event_type: "cancelled", description: input.reason ?? "Invoice cancelled" });
      if (eventResult.error) return failure(mapError(eventResult.error, "Failed to record invoice cancellation"));
      const itemsResult = await client.from("invoice_items").select<ItemRow[]>(ITEM_COLUMNS).eq("invoice_id", input.invoiceId);
      if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to reload cancelled invoice items"));
      try {
        return mutation(input.operationId, { invoices: [mapInvoice(result.data, itemsResult.data ?? [])] });
      } catch (cause) {
        return mappedError("Failed to cancel invoice", cause);
      }
    },

    async updatePaymentMethods(input: UpdatePaymentMethodInput) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      const current = await client.from("bakery_payment_methods").select<MethodRow[]>(METHOD_COLUMNS).eq("bakery_id", input.bakeryId);
      if (current.error) return failure(mapError(current.error, "Failed to load payment methods"));
      const existing = current.data ?? [];
      const saved: DomainPaymentMethod[] = [];
      for (const method of input.paymentMethods) {
        const currentMethod = existing.find(row => row.id === method.id || row.method_type === method.methodType);
        const payload = { bakery_id: input.bakeryId, method_type: method.methodType, is_enabled: method.isEnabled, instructions: method.instructions ?? null, account_details_json: { name: method.name } };
        const result = currentMethod
          ? await client.from("bakery_payment_methods").update(payload).eq("bakery_id", input.bakeryId).eq("id", requiredText(currentMethod.id, "payment method id")).select<MethodRow>(METHOD_COLUMNS).single()
          : await client.from("bakery_payment_methods").insert(payload).select<MethodRow>(METHOD_COLUMNS).single();
        if (result.error) return failure(mapError(result.error, "Failed to save payment methods"));
        if (!result.data) return failure({ kind: "unknown", message: "Failed to save payment methods: Supabase returned no row.", retryable: false });
        try { saved.push(mapMethod(result.data, input.bakeryId)); } catch (cause) { return mappedError("Failed to save payment methods", cause); }
      }
      return mutation(input.operationId, { paymentMethods: saved });
    },
  };
}

export const createSupabaseInvoicingPort = createSupabaseInvoiceAdapter;
