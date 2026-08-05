import { describe, expect, it } from "vitest";
import type { Order } from "../../types";
import {
  getCurrentStageCounts,
  getPickupPresentation,
  getSecondaryStatusCounts,
  parsePickupDateTime,
  selectPresentedOrders,
  sortOrdersByPickup,
} from "./orderPresentation";

const NOW = new Date(2026, 7, 3, 9, 0);

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "#100",
    customer: "Jad Baker",
    items: [{ product: "Sourdough Loaf", qty: 1, price: 14 }],
    pickup: "2026-08-03",
    pickupTime: "10:00",
    status: "confirmed",
    total: 14,
    paid: 0,
    paymentStatus: "unpaid",
    ...overrides,
  };
}

describe("order presentation selectors", () => {
  it("separates current, completed, and secondary statuses", () => {
    const orders = [
      order({ id: "confirmed", status: "confirmed" }),
      order({ id: "production", status: "in-production" }),
      order({ id: "ready", status: "ready" }),
      order({ id: "completed", status: "completed" }),
      order({ id: "draft", status: "draft" }),
      order({ id: "cancelled", status: "cancelled" }),
    ];

    expect(selectPresentedOrders(orders, { now: NOW }).map(item => item.id)).toEqual(["confirmed", "production", "ready"]);
    expect(selectPresentedOrders(orders, { primaryView: "completed", now: NOW }).map(item => item.id)).toEqual(["completed"]);
    expect(selectPresentedOrders(orders, { secondaryStatus: "draft", now: NOW }).map(item => item.id)).toEqual(["draft"]);
    expect(selectPresentedOrders(orders, { secondaryStatus: "cancelled", now: NOW }).map(item => item.id)).toEqual(["cancelled"]);
    expect(getCurrentStageCounts(orders)).toEqual({ confirmed: 1, "in-production": 1, ready: 1 });
    expect(getSecondaryStatusCounts(orders)).toEqual({ draft: 1, cancelled: 1 });
  });

  it("parses ISO/display dates and 24-hour/12-hour times deterministically", () => {
    expect(parsePickupDateTime(order({ pickup: "2026-07-31", pickupTime: "14:05" }), NOW))
      .toEqual(new Date(2026, 6, 31, 14, 5));
    expect(parsePickupDateTime(order({ pickup: "Jul 31", pickupTime: "2:05 PM" }), NOW))
      .toEqual(new Date(2026, 6, 31, 14, 5));
    expect(parsePickupDateTime(order({ pickup: "Jul 31", pickupTime: "12:05 AM" }), NOW))
      .toEqual(new Date(2026, 6, 31, 0, 5));
  });

  it("sorts overdue first and then ascending pickup datetime while keeping ties stable", () => {
    const orders = [
      order({ id: "later", pickup: "Aug 4", pickupTime: "9:00 AM" }),
      order({ id: "tie-a", pickup: "2026-08-03", pickupTime: "10:00" }),
      order({ id: "overdue", pickup: "Aug 3", pickupTime: "8:00 AM" }),
      order({ id: "tie-b", pickup: "Aug 3", pickupTime: "10:00 AM" }),
      order({ id: "invalid", pickup: "Soon", pickupTime: "morning" }),
    ];

    expect(sortOrdersByPickup(orders, NOW).map(item => item.id)).toEqual(["overdue", "tie-a", "tie-b", "later", "invalid"]);
    expect(getPickupPresentation(orders[2], NOW).label).toBe("Overdue");
    expect(getPickupPresentation(orders[1], NOW).label).toBe("Today");
  });

  it("labels upcoming pickups with the number of calendar days remaining", () => {
    expect(getPickupPresentation(order({ pickup: "2026-08-04", pickupTime: "08:00" }), NOW).label).toBe("Due tomorrow");
    expect(getPickupPresentation(order({ pickup: "2026-08-05", pickupTime: "08:00" }), NOW).label).toBe("Due in 2 days");
    expect(getPickupPresentation(order({ pickup: "Aug 6", pickupTime: "8:00 AM" }), NOW).label).toBe("Due in 3 days");
  });

  it("composes stage, search, payment, product, and pickup filters without mutation", () => {
    const orders = [
      order({ id: "#101", customer: "Amina", status: "ready", paid: 4, paymentStatus: "partially-paid", pickup: "2026-08-04" }),
      order({ id: "#102", customer: "Noah", status: "ready", items: [{ product: "Focaccia", qty: 2, price: 8 }], pickup: "Aug 4", pickupTime: "10:00 AM" }),
      order({ id: "#103", customer: "Amina", status: "confirmed", pickup: "2026-08-04" }),
    ];
    const original = structuredClone(orders);

    expect(selectPresentedOrders(orders, {
      stage: "ready",
      search: "amina",
      paymentStatus: "balance-due",
      product: "Sourdough Loaf",
      pickupDate: "2026-08-04",
      now: NOW,
    }).map(item => item.id)).toEqual(["#101"]);
    expect(orders).toEqual(original);
  });
});
