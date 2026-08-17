import { describe, expect, it } from "vitest";
import { selectOrderProjection } from "./manualOrderProjection";
import type { ManualOrderSnapshot } from "../lib/supabase/manualOrderAdapter";
import type { Order } from "./types";

const persistedOrder: ManualOrderSnapshot["orders"][number] = {
  id: "order-persisted",
  customerId: "customer-1",
  pickupDate: "2026-08-17",
  pickupTime: "10:00",
  status: "confirmed",
  total: 24,
  paid: 0,
  paymentStatus: "unpaid",
  createdAt: "2026-08-16T12:00:00.000Z",
  items: [{
    id: "item-1",
    orderId: "order-persisted",
    recipeId: "recipe-1",
    product: "Sourdough Loaf",
    quantity: 2,
    unitPrice: 12,
  }],
};

const manualOrderSnapshot: ManualOrderSnapshot = {
  customers: [{
    id: "customer-1",
    name: "Persisted Customer",
    email: "customer@example.com",
    phone: "",
    address: "",
    notes: "",
  }],
  recipes: [],
  orders: [persistedOrder],
  tasks: [],
};

const localOrder: Order = {
  id: "local-order",
  customer: "Local Customer",
  items: [],
  pickup: "2026-08-17",
  pickupTime: "11:00",
  status: "confirmed",
  total: 10,
  paid: 0,
  paymentStatus: "unpaid",
};

describe("selectOrderProjection", () => {
  it("uses persisted orders when the domain snapshot has an empty recipes collection", () => {
    const orders = selectOrderProjection({
      persistedServiceActive: true,
      manualOrderSnapshot,
      domainSnapshot: { recipesById: {} },
      localOrders: [],
    });

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ id: "order-persisted", customer: "Persisted Customer" });
  });

  it("keeps local orders when the persisted service is not active", () => {
    expect(selectOrderProjection({
      persistedServiceActive: false,
      manualOrderSnapshot: null,
      domainSnapshot: { recipesById: {} },
      localOrders: [localOrder],
    })).toEqual([localOrder]);
  });
});
