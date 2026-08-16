import { describe, expect, it } from "vitest";
import { notificationsFor, reportCsv, reportFor } from "./reporting";

const orders = [{ id: "o1", pickup: "Jul 31", total: 20, paid: 5, items: [{ product: "Sourdough Loaf", qty: 1, price: 20 }] }];

describe("reporting", () => {
  it("filters metrics and supports empty results", () => {
    expect(reportFor(orders, { product: "Sourdough Loaf", range: "all" }).revenue).toBe(20);
    expect(reportFor(orders, { product: "all", range: "empty" }).orders).toHaveLength(0);
  });

  it("applies inclusive date filters using the local reference date", () => {
    const datedOrders = [
      { ...orders[0], id: "before", pickup: "2026-08-09" },
      { ...orders[0], id: "inside", pickup: "2026-08-12" },
      { ...orders[0], id: "after", pickup: "2026-08-18" },
    ];
    const report = reportFor(datedOrders, { product: "all", range: "week", referenceDate: "2026-08-12" });
    expect(report.orders.map(order => order.id)).toEqual(["inside"]);
  });

  it("attributes mixed-order revenue and unpaid balance to the selected line", () => {
    const mixed = [{
      id: "mixed",
      pickup: "2026-08-12",
      total: 30,
      paid: 10,
      items: [
        { product: "Sourdough Loaf", qty: 1, price: 20, costPerUnit: 4 },
        { product: "Focaccia", qty: 1, price: 10, costPerUnit: 2 },
      ],
    }];
    const report = reportFor(mixed, { product: "Sourdough Loaf", range: "all" });
    expect(report.revenue).toBe(20);
    expect(report.costs).toBe(4);
    expect(report.unpaid).toBeCloseTo(13.33, 2);
    expect(report.products[0]).toMatchObject({ product: "Sourdough Loaf", units: 1, revenue: 20, cost: 4, profit: 16 });
  });

  it("exports summary, product, and order rows from the same report", () => {
    const csv = reportCsv(reportFor(orders, { product: "Sourdough Loaf", range: "all" }));
    expect(csv).toContain("summary,Revenue");
    expect(csv).toContain("product,Sourdough Loaf");
    expect(csv).toContain("order,o1");
  });

  it("creates actionable notification records", () => {
    expect(notificationsFor(15).map(item => item.kind)).toContain("shortage");
  });
});
