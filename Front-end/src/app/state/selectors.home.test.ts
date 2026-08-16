import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "../domain/fixtures";
import type { BakeryDomainSnapshot } from "../domain/types";
import { selectHomeOrderCalendar } from "./selectors";

const referenceDate = new Date("2026-08-15T16:00:00.000Z");

function homeSnapshot(): BakeryDomainSnapshot {
  const source = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
  if (!source) throw new Error("Expected fixture snapshot.");

  return {
    ...source,
    ordersById: {
      ...source.ordersById,
      "home-today": {
        ...source.ordersById["order-024"],
        id: "home-today",
        pickupDate: "2026-08-15",
        pickupTime: "09:30",
        itemIds: ["home-today-focaccia-1", "home-today-focaccia-2", "home-today-loaf"],
      },
      "home-tomorrow": {
        ...source.ordersById["order-025"],
        id: "home-tomorrow",
        pickupDate: "2026-08-16",
        pickupTime: "11:00",
        itemIds: ["home-tomorrow-loaf"],
      },
      "home-completed": {
        ...source.ordersById["order-026"],
        id: "home-completed",
        pickupDate: "2026-08-17",
        status: "completed",
        itemIds: ["home-tomorrow-loaf"],
      },
      "home-cancelled": {
        ...source.ordersById["order-026"],
        id: "home-cancelled",
        pickupDate: "2026-08-18",
        status: "cancelled",
        itemIds: ["home-tomorrow-loaf"],
      },
    },
    orderItemsById: {
      ...source.orderItemsById,
      "home-today-focaccia-1": { id: "home-today-focaccia-1", orderId: "home-today", recipeId: "recipe-focaccia", product: "Focaccia", quantity: 5, unitPrice: 8 },
      "home-today-focaccia-2": { id: "home-today-focaccia-2", orderId: "home-today", recipeId: "recipe-focaccia", product: "Focaccia", quantity: 2, unitPrice: 8 },
      "home-today-loaf": { id: "home-today-loaf", orderId: "home-today", recipeId: "recipe-sourdough", product: "Sourdough Loaf", quantity: 3, unitPrice: 14 },
      "home-tomorrow-loaf": { id: "home-tomorrow-loaf", orderId: "home-tomorrow", recipeId: "recipe-sourdough", product: "Sourdough Loaf", quantity: 1, unitPrice: 14 },
    },
  };
}

describe("selectHomeOrderCalendar", () => {
  it("groups active persisted orders through the next six days and aggregates products", () => {
    const days = selectHomeOrderCalendar(homeSnapshot(), referenceDate);

    expect(days.map(day => day.dateKey)).toEqual(["2026-08-15", "2026-08-16"]);
    expect(days[0]).toMatchObject({ isToday: true, label: "Saturday, Aug 15", orders: [{ id: "home-today", productSummary: "7 Focaccia · 3 Sourdough Loaf" }] });
    expect(days[1]).toMatchObject({ isToday: false, orders: [{ id: "home-tomorrow" }] });
  });

  it("keeps customer context and balance on the Home read model", () => {
    const order = selectHomeOrderCalendar(homeSnapshot(), referenceDate)[0]?.orders[0];

    expect(order).toMatchObject({
      customerName: "Sarah Mitchell",
      customer: { email: "sarah.m@email.com", phone: "415-555-0182", address: "14 Birch Lane, Mill Valley" },
      balance: 0,
      pickupDate: "2026-08-15",
      pickupTime: "09:30",
    });
  });

  it("does not include orders outside the today-first horizon or completed/cancelled orders", () => {
    const days = selectHomeOrderCalendar(homeSnapshot(), referenceDate);
    const ids = days.flatMap(day => day.orders.map(order => order.id));

    expect(ids).not.toContain("order-024");
    expect(ids).not.toContain("home-completed");
    expect(ids).not.toContain("home-cancelled");
  });

  it("reprojects a newly committed snapshot without falling back to fixture data", () => {
    const before = homeSnapshot();
    const after: BakeryDomainSnapshot = {
      ...before,
      ordersById: {
        ...before.ordersById,
        "home-new": { ...before.ordersById["home-tomorrow"], id: "home-new", pickupDate: "2026-08-19" },
      },
    };

    expect(selectHomeOrderCalendar(before, referenceDate).flatMap(day => day.orders.map(order => order.id))).not.toContain("home-new");
    expect(selectHomeOrderCalendar(after, referenceDate).flatMap(day => day.orders.map(order => order.id))).toContain("home-new");
  });
});
