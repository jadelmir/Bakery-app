import { describe, expect, it } from "vitest";
import { buildStarterPlans, calculateRequirements, DEFAULT_INVENTORY, DEFAULT_STARTER_PROFILE, formatShoppingListCsv, recordDeductions, shoppingList } from "./planning";
import { generatePlan } from "./production";

const tasks = generatePlan({ id: "o1", pickupDate: "2026-08-07", pickupTime: "14:00", items: [{ id: "loaf", product: "Sourdough Loaf", qty: 2 }, { id: "foc", product: "Focaccia", qty: 1 }] }).tasks;

describe("starter and inventory planning", () => {
  it("calculates a combined compatible starter build and warns when seed is unavailable", () => {
    const builds = buildStarterPlans(tasks, { ...DEFAULT_STARTER_PROFILE, currentRetained: 10 });
    expect(builds).toHaveLength(1); expect(builds[0]).toMatchObject({ usableAmount: 400, retainedAmount: 40, insufficientSeed: true });
    expect(builds[0].contributors).toHaveLength(2);
  });
  it("keeps incompatible peak windows separate and applies overrides", () => {
    const shifted = tasks.map(task => task.product === "Focaccia" && task.flowStepId === "build-starter" ? { ...task, scheduledAt: "2026-08-06T09:00:00.000Z" } : task);
    const plans = buildStarterPlans(shifted); expect(plans).toHaveLength(2);
    const base = buildStarterPlans(tasks);
    const overridden = buildStarterPlans(tasks, DEFAULT_STARTER_PROFILE, DEFAULT_STARTER_PROFILE.defaultRatio, { [base[0].id]: { flourAmount: 250 } });
    expect(overridden[0].flourAmount).toBe(250);
  });
  it("includes dough and starter flour and water in requirements with shortages", () => {
    const lines = calculateRequirements(tasks, buildStarterPlans(tasks), DEFAULT_INVENTORY);
    expect(lines.find(line => line.itemId === "flour" && line.source === "starter-build")?.required).toBeGreaterThan(0);
    expect(shoppingList(lines).some(line => line.itemId === "flour")).toBe(true);
  });
  it("scales recipe requirements for an aggregated persisted production task", () => {
    const mixTask = tasks.find(task => task.product === "Sourdough Loaf" && task.flowStepId === "mix");
    expect(mixTask).toBeDefined();
    const lines = calculateRequirements(
      [{ ...mixTask!, flowStepId: "mix:recipe-sourdough", quantity: 5 }],
      [],
      DEFAULT_INVENTORY,
    );
    expect(lines.find(line => line.itemId === "flour" && line.source === "recipe")?.required).toBe(2500);
    expect(lines.find(line => line.itemId === "water" && line.source === "recipe")?.required).toBe(1750);
    expect(lines.find(line => line.itemId === "bag" && line.source === "packaging")?.required).toBe(5);
  });
  it("records a deduction once per configured source", () => {
    const lines = calculateRequirements(tasks, buildStarterPlans(tasks));
    const once = recordDeductions([], "task-completion", "task-1", lines);
    expect(recordDeductions(once, "task-completion", "task-1", lines)).toEqual(once);
  });
  it("formats shopping list requirement lines as CSV string", () => {
    const lines = calculateRequirements(tasks, buildStarterPlans(tasks), DEFAULT_INVENTORY);
    const shortages = shoppingList(lines);
    const csv = formatShoppingListCsv(shortages);
    expect(csv).toContain("Item,Unit,Required,Available,Shortage,Source");
    expect(csv).toContain('"Kirkland Organic Flour"');
  });
});
