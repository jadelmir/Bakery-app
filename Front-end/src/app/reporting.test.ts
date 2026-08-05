import { describe, expect, it } from "vitest";
import { notificationsFor, reportFor } from "./reporting";

const orders = [{ id: "o1", pickup: "Jul 31", total: 20, paid: 5, items: [{ product: "Sourdough Loaf", qty: 1, price: 20 }] }];

describe("reporting", () => {
  it("filters metrics and supports empty results", () => {
    expect(reportFor(orders, { product: "Sourdough Loaf", range: "all" }).revenue).toBe(20);
    expect(reportFor(orders, { product: "all", range: "empty" }).orders).toHaveLength(0);
  });
  it("creates actionable notification records", () => {
    expect(notificationsFor(15).map(item => item.kind)).toContain("shortage");
  });
});
