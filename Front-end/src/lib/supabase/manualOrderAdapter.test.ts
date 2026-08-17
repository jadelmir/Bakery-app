import { describe, expect, it, vi } from "vitest";
import { createManualOrderService } from "./manualOrderAdapter";

type QueryResponse = { data: Record<string, unknown>[] | null; error: { message: string } | null };

function query(response: QueryResponse) {
  const builder = {
    select: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: <TResult1 = QueryResponse, TResult2 = never>(
      onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(response).then(onfulfilled, onrejected),
  };
  return builder;
}

const refreshedOrder = {
  id: "order-1",
  customer_id: "customer-1",
  pickup_date: "2026-08-05",
  pickup_time: "10:00",
  status: "in-production",
  total_cents: 2400,
  amount_paid_cents: 1200,
  payment_status: "partially-paid",
  notes: "Counter pickup",
};

describe("manualOrderAdapter persisted status transitions", () => {
  it("uses bakery and expected-status compare-and-set filters, then returns the refreshed snapshot", async () => {
    const updateQuery = query({ data: [{ id: "order-1", status: "in-production" }], error: null });
    const snapshotOrderQuery = query({ data: [refreshedOrder], error: null });
    const emptyQuery = () => query({ data: [], error: null });
    let orderCalls = 0;
    const client = {
      from: vi.fn((table: string) => {
        if (table === "orders") return orderCalls++ === 0 ? updateQuery : snapshotOrderQuery;
        return emptyQuery();
      }),
      rpc: vi.fn(),
    };

    const service = createManualOrderService(client as never);
    const snapshot = await service.transitionOrder({
      bakeryId: "bakery-1",
      operationId: "transition-1",
      orderId: "order-1",
      expectedStatus: "confirmed",
      targetStatus: "in-production",
    });

    expect(updateQuery.update).toHaveBeenCalledWith({ status: "in-production" });
    expect(updateQuery.eq.mock.calls).toEqual([
      ["bakery_id", "bakery-1"],
      ["id", "order-1"],
      ["status", "confirmed"],
    ]);
    expect(snapshot.orders).toEqual([
      expect.objectContaining({ id: "order-1", status: "in-production", total: 24, paid: 12 }),
    ]);
    expect(client.from).toHaveBeenCalledWith("customers");
    expect(client.from).toHaveBeenCalledWith("recipes");
    expect(client.from).toHaveBeenCalledWith("production_tasks");
  });

  it("rejects a skipped transition before issuing a database update", async () => {
    const client = { from: vi.fn(), rpc: vi.fn() };
    const service = createManualOrderService(client as never);

    await expect(service.transitionOrder({
      bakeryId: "bakery-1",
      operationId: "transition-2",
      orderId: "order-1",
      expectedStatus: "confirmed",
      targetStatus: "ready",
    })).rejects.toThrow("Orders can only advance to the next status");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects a stale or out-of-tenant compare-and-set without refreshing", async () => {
    const updateQuery = query({ data: [], error: null });
    const client = { from: vi.fn(() => updateQuery), rpc: vi.fn() };
    const service = createManualOrderService(client as never);

    await expect(service.transitionOrder({
      bakeryId: "bakery-1",
      operationId: "transition-3",
      orderId: "order-1",
      expectedStatus: "confirmed",
      targetStatus: "in-production",
    })).rejects.toThrow("not available in the active bakery");
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("surfaces database transition failures and keeps the prior projection authoritative", async () => {
    const updateQuery = query({ data: null, error: { message: "transition rejected" } });
    const client = { from: vi.fn(() => updateQuery), rpc: vi.fn() };
    const service = createManualOrderService(client as never);

    await expect(service.transitionOrder({
      bakeryId: "bakery-1",
      operationId: "transition-4",
      orderId: "order-1",
      expectedStatus: "confirmed",
      targetStatus: "in-production",
    })).rejects.toThrow("Failed to transition order: transition rejected");
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("marks an order paid through the RPC and confirms the refreshed snapshot", async () => {
    const paidOrder = { ...refreshedOrder, amount_paid_cents: 2400, payment_status: "paid" };
    const snapshotOrderQuery = query({ data: [paidOrder], error: null });
    const emptyQuery = () => query({ data: [], error: null });
    const client = {
      from: vi.fn((table: string) => table === "orders" ? snapshotOrderQuery : emptyQuery()),
      rpc: vi.fn().mockResolvedValue({ data: { order_id: "order-1", amount_paid_cents: 2400, payment_status: "paid" }, error: null }),
    };

    const snapshot = await createManualOrderService(client as never).markOrderPaid({
      bakeryId: "bakery-1",
      operationId: "pay-order-1",
      orderId: "order-1",
    });

    expect(client.rpc).toHaveBeenCalledWith("mark_order_paid", { p_bakery_id: "bakery-1", p_order_id: "order-1" });
    expect(snapshot.orders[0]).toMatchObject({ id: "order-1", total: 24, paid: 24, paymentStatus: "paid", status: "in-production" });
  });

  it("keeps the prior projection authoritative when marking paid fails", async () => {
    const client = { from: vi.fn(), rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "payment rejected" } }) };
    const service = createManualOrderService(client as never);

    await expect(service.markOrderPaid({ bakeryId: "bakery-1", operationId: "pay-order-2", orderId: "order-1" }))
      .rejects.toThrow("Failed to mark order paid: payment rejected");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("deletes only the requested bakery order and confirms dependent task absence", async () => {
    const deleteQuery = query({ data: [{ id: "order-1" }], error: null });
    const emptyQuery = () => query({ data: [], error: null });
    const client = {
      from: vi.fn((table: string) => table === "orders" ? (client.from.mock.calls.length === 1 ? deleteQuery : emptyQuery()) : emptyQuery()),
      rpc: vi.fn(),
    };

    const snapshot = await createManualOrderService(client as never).deleteOrder({
      bakeryId: "bakery-1",
      operationId: "delete-order-1",
      orderId: "order-1",
    });

    expect(deleteQuery.delete).toHaveBeenCalledOnce();
    expect(deleteQuery.eq.mock.calls).toEqual([["bakery_id", "bakery-1"], ["id", "order-1"]]);
    expect(snapshot.orders).toEqual([]);
    expect(snapshot.tasks).toEqual([]);
  });
});
