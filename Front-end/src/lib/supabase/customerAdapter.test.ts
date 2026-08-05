import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseCustomerAdapter,
  mapCustomerRow,
  type CustomerRow,
} from "./customerAdapter";

type QueryResponse<T> = { data: T | null; error: { code?: string; message: string; status?: number } | null };

function query<T>(response: QueryResponse<T>) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: <TResult1 = QueryResponse<T>, TResult2 = never>(
      onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(response).then(onfulfilled, onrejected),
  };
  return builder;
}

const row = (overrides: Partial<CustomerRow> = {}): CustomerRow => ({
  id: "customer-generated-1",
  bakery_id: "bakery-1",
  name: "Acme Cafe",
  email: "orders@acme.example",
  phone: "555-0100",
  type: "wholesale",
  address: "1 Main Street",
  notes: "Weekly delivery",
  ...overrides,
});

describe("customerAdapter", () => {
  it("maps persisted rows into the domain customer contract", () => {
    expect(mapCustomerRow(row({ phone: null, address: null, notes: null }))).toEqual({
      id: "customer-generated-1",
      name: "Acme Cafe",
      email: "orders@acme.example",
      type: "wholesale",
      phone: undefined,
      address: undefined,
      notes: undefined,
    });
  });

  it("loads only the active bakery and filters any out-of-scope response defensively", async () => {
    const customers = query({ data: [row(), row({ id: "other-customer", bakery_id: "bakery-2" })], error: null });
    const client = { from: vi.fn(() => customers) };
    const adapter = createSupabaseCustomerAdapter(client);

    const result = await adapter.loadCustomers({ bakeryId: "bakery-1" });

    expect(result).toEqual({ ok: true, data: [expect.objectContaining({ id: "customer-generated-1" })] });
    expect(customers.select).toHaveBeenCalledWith("id,bakery_id,name,email,phone,type,address,notes");
    expect(customers.eq).toHaveBeenCalledWith("bakery_id", "bakery-1");
    expect(customers.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("creates with a backend-generated UUID and returns the authoritative mutation change", async () => {
    const customers = query({ data: row({ id: "uuid-from-database" }), error: null });
    const client = { from: vi.fn(() => customers) };
    const adapter = createSupabaseCustomerAdapter(client);

    const result = await adapter.createCustomer({
      bakeryId: "bakery-1",
      operationId: "create-customer-1",
      customerId: "display-only-id",
      name: "  Acme Cafe  ",
      email: " orders@acme.example ",
      phone: "555-0100",
      type: "wholesale",
    });

    expect(customers.insert).toHaveBeenCalledWith({
      bakery_id: "bakery-1",
      name: "Acme Cafe",
      email: "orders@acme.example",
      phone: "555-0100",
      type: "wholesale",
      address: null,
      notes: null,
    });
    expect(customers.insert.mock.calls[0][0]).not.toHaveProperty("id");
    expect(result).toEqual({
      ok: true,
      data: {
        kind: "customer-mutated",
        operationId: "create-customer-1",
        changes: { customers: [expect.objectContaining({ id: "uuid-from-database", type: "wholesale" })] },
      },
    });
  });

  it("updates only the requested customer within the active bakery", async () => {
    const customers = query({ data: row({ id: "customer-1", type: "retail", notes: "Updated" }), error: null });
    const client = { from: vi.fn(() => customers) };
    const adapter = createSupabaseCustomerAdapter(client);

    const result = await adapter.updateCustomer({
      bakeryId: "bakery-1",
      operationId: "update-customer-1",
      customerId: "customer-1",
      type: "retail",
      notes: "Updated",
    });

    expect(customers.update).toHaveBeenCalledWith({ type: "retail", notes: "Updated" });
    expect(customers.eq.mock.calls).toEqual([["bakery_id", "bakery-1"], ["id", "customer-1"]]);
    expect(result).toEqual({ ok: true, data: expect.objectContaining({ changes: { customers: [expect.objectContaining({ type: "retail" })] } }) });
  });

  it("maps authorization failures and never reports a denied mutation as success", async () => {
    const customers = query({ data: null, error: { code: "42501", message: "row violates row-level security policy" } });
    const client = { from: vi.fn(() => customers) };
    const adapter = createSupabaseCustomerAdapter(client);

    const result = await adapter.updateCustomer({
      bakeryId: "bakery-2",
      operationId: "update-denied",
      customerId: "customer-1",
      name: "Cross Bakery Edit",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "authorization",
        message: "Failed to update customer: row violates row-level security policy",
        retryable: false,
      },
    });
  });

  it("maps network failures as retryable connection errors", async () => {
    const customers = query({ data: null, error: { message: "Failed to fetch" } });
    const client = { from: vi.fn(() => customers) };
    const adapter = createSupabaseCustomerAdapter(client);

    const result = await adapter.loadCustomers({ bakeryId: "bakery-1" });

    expect(result).toEqual({
      ok: false,
      error: { kind: "connection", message: "Failed to load customers: Failed to fetch", retryable: true },
    });
  });
});
