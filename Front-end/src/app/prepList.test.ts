import { describe, expect, it } from "vitest";
import { FIXTURE_BAKERY_IDS, fixtureSnapshotFor } from "./domain/fixtures";
import type { BakeryDomainSnapshot } from "./domain/types";
import { buildPrepList, listPrepDates, prepDateForRecipe, shiftDateKey } from "./prepList";

function fixture() {
  const snapshot = fixtureSnapshotFor(FIXTURE_BAKERY_IDS.EARLS);
  if (!snapshot) throw new Error("Fixture snapshot unavailable");
  return snapshot;
}

describe("prep list", () => {
  it("derives one-day-before prep by default and supports same-day and multi-day lead times", () => {
    expect(prepDateForRecipe("2026-07-30")).toBe("2026-07-29");
    expect(prepDateForRecipe("2026-07-30", 0)).toBe("2026-07-30");
    expect(prepDateForRecipe("2026-07-30", 2)).toBe("2026-07-28");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDateKey("2026-02-31", 0)).toBeNull();
  });

  it("lists only dates that have eligible preparation work", () => {
    const dates = listPrepDates(fixture());
    expect(dates).toEqual([
      { date: "2026-07-29", productCount: 4, orderCount: 1 },
      { date: "2026-07-30", productCount: 2, orderCount: 1 },
      { date: "2026-08-01", productCount: 4, orderCount: 1 },
    ]);
  });

  it("scales persisted recipe lines, aggregates materials, and keeps order traceability", () => {
    const source = fixture();
    const snapshot: BakeryDomainSnapshot = {
      ...source,
      recipesById: {
        ...source.recipesById,
        "recipe-sourdough": {
          ...source.recipesById["recipe-sourdough"],
          ingredients: [...source.recipesById["recipe-sourdough"].ingredients, { inventoryItemId: "bag", quantity: 1, cost: 0.1 }],
        },
      },
    };

    const model = buildPrepList(snapshot, "2026-07-29");
    const sourdough = model.products.find(product => product.recipeId === "recipe-sourdough");
    const flour = model.ingredients.find(item => item.itemId === "flour");
    const bags = model.packaging.find(item => item.itemId === "bag");

    expect(sourdough).toMatchObject({ quantity: 2, prepLeadDays: 1 });
    expect(sourdough?.sources).toHaveLength(1);
    expect(flour).toMatchObject({ required: 3000, available: 800, shortage: 2200 });
    expect(bags).toMatchObject({ required: 2, available: 3, shortage: 0 });
  });

  it("excludes completed and cancelled orders and reports missing recipe mappings", () => {
    const source = fixture();
    const snapshot: BakeryDomainSnapshot = {
      ...source,
      ordersById: {
        ...source.ordersById,
        "order-missing": { id: "order-missing", customerId: "customer-sarah", itemIds: ["item-missing"], pickupDate: "2026-07-30", pickupTime: "10:00", status: "confirmed", total: 10, paid: 0, paymentStatus: "unpaid" },
        "order-cancelled": { ...source.ordersById["order-024"], id: "order-cancelled", itemIds: ["item-cancelled"], status: "cancelled" },
      },
      orderItemsById: {
        ...source.orderItemsById,
        "item-missing": { id: "item-missing", orderId: "order-missing", recipeId: "recipe-does-not-exist", product: "Unknown Product", quantity: 1, unitPrice: 10 },
        "item-cancelled": { ...source.orderItemsById["order-024-item-1"], id: "item-cancelled", orderId: "order-cancelled" },
      },
    };

    const model = buildPrepList(snapshot, "2026-07-29");
    expect(model.products.some(product => product.product === "Unknown Product")).toBe(true);
    expect(model.warnings).toHaveLength(1);
    expect(model.warnings[0]?.message).toContain("missing its recipe mapping");
    expect(model.products.some(product => product.product === "Sourdough Loaf" && product.sources.some(source => source.orderId === "order-cancelled"))).toBe(false);
  });

  it("warns instead of treating archived, invalid, or unsupported materials as usable stock", () => {
    const source = fixture();
    const snapshot: BakeryDomainSnapshot = {
      ...source,
      inventoryById: {
        ...source.inventoryById,
        flour: { ...source.inventoryById.flour, archived: true },
        water: { ...source.inventoryById.water, unit: "scoops" },
      },
      recipesById: {
        ...source.recipesById,
        "recipe-sourdough": {
          ...source.recipesById["recipe-sourdough"],
          ingredients: [...source.recipesById["recipe-sourdough"].ingredients, { inventoryItemId: "salt", quantity: 0, cost: 0 }],
        },
      },
    };

    const model = buildPrepList(snapshot, "2026-07-29");
    expect(model.ingredients.some(item => item.itemId === "flour")).toBe(false);
    expect(model.warnings.map(item => item.message).join(" ")).toMatch(/archived|unsupported unit|invalid recipe quantity/);
  });
});
