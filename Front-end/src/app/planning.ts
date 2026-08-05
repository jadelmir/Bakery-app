import type { ProductionTask } from "./production";

export type FeedingRatio = { seed: number; flour: number; water: number };
export type StarterProfile = { id: string; name: string; currentRetained: number; lastFedAt: string; hydrationPercent: number; defaultRatio: FeedingRatio; retainedTarget: number };
export type StarterContributor = { orderId: string; orderItemId: string; product: string; usableAmount: number };
export type StarterBuildOverride = Partial<Pick<StarterBuild, "seedAmount" | "flourAmount" | "waterAmount" | "retainedAmount">>;
export type StarterBuild = { id: string; profileId: string; peakWindow: string; contributors: StarterContributor[]; recommended: { seedAmount: number; flourAmount: number; waterAmount: number; retainedAmount: number }; seedAmount: number; flourAmount: number; waterAmount: number; retainedAmount: number; usableAmount: number; totalAmount: number; insufficientSeed: boolean; override?: StarterBuildOverride };
export type InventoryItem = { id: string; name: string; unit: string; onHand: number; kind: "ingredient" | "packaging" };
export type RequirementLine = { itemId: string; name: string; unit: string; required: number; available: number; shortage: number; orderId?: string; source: "recipe" | "starter-build" | "packaging" };
export type InventoryTransaction = { id: string; sourceKey: string; itemId: string; quantityChange: number; reason: "task-completed" | "order-completed" | "restock" | "adjustment" };
export type DeductionTrigger = "task-completion" | "order-completion";

export const DEFAULT_STARTER_PROFILE: StarterProfile = { id: "earl", name: "Earl", currentRetained: 80, lastFedAt: "2026-07-28T18:00:00.000Z", hydrationPercent: 100, defaultRatio: { seed: 1, flour: 3, water: 3 }, retainedTarget: 40 };
export const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "flour", name: "Kirkland Organic Flour", unit: "g", onHand: 800, kind: "ingredient" },
  { id: "water", name: "Water", unit: "ml", onHand: 900, kind: "ingredient" },
  { id: "salt", name: "Salt", unit: "g", onHand: 1000, kind: "ingredient" },
  { id: "oil", name: "Olive Oil", unit: "ml", onHand: 500, kind: "ingredient" },
  { id: "bag", name: "Bakery Bags", unit: "bags", onHand: 3, kind: "packaging" },
];

const recipeInputs: Record<string, { itemId: string; amount: number; source: RequirementLine["source"] }[]> = {
  "Sourdough Loaf": [{ itemId: "flour", amount: 500, source: "recipe" }, { itemId: "water", amount: 350, source: "recipe" }, { itemId: "salt", amount: 10, source: "recipe" }, { itemId: "bag", amount: 1, source: "packaging" }],
  Focaccia: [{ itemId: "flour", amount: 1000, source: "recipe" }, { itemId: "water", amount: 500, source: "recipe" }, { itemId: "salt", amount: 20, source: "recipe" }, { itemId: "oil", amount: 50, source: "recipe" }, { itemId: "bag", amount: 1, source: "packaging" }],
};
const starterPerUnit: Record<string, number> = { "Sourdough Loaf": 100, Focaccia: 200 };
const round = (value: number) => Math.round(value * 100) / 100;

export function buildStarterPlans(tasks: ProductionTask[], profile = DEFAULT_STARTER_PROFILE, ratio = profile.defaultRatio, overrides: Record<string, StarterBuildOverride> = {}): StarterBuild[] {
  const candidates = tasks.filter(task => task.category === "starter" && task.flowStepId === "build-starter").map(task => ({
    task, peakWindow: task.scheduledAt.slice(0, 13), usableAmount: (starterPerUnit[task.product] || 0) * task.quantity,
  }));
  const groups = new Map<string, typeof candidates>();
  candidates.forEach(candidate => { const key = `${profile.id}:${candidate.peakWindow}`; groups.set(key, [...(groups.get(key) || []), candidate]); });
  return [...groups.entries()].map(([key, group]) => {
    const usableAmount = group.reduce((total, candidate) => total + candidate.usableAmount, 0);
    const target = usableAmount + profile.retainedTarget;
    const ratioTotal = ratio.seed + ratio.flour + ratio.water;
    const recommended = { seedAmount: round(target * ratio.seed / ratioTotal), flourAmount: round(target * ratio.flour / ratioTotal), waterAmount: round(target * ratio.water / ratioTotal), retainedAmount: profile.retainedTarget };
    const override = overrides[key];
    const seedAmount = override?.seedAmount ?? recommended.seedAmount;
    const flourAmount = override?.flourAmount ?? recommended.flourAmount;
    const waterAmount = override?.waterAmount ?? recommended.waterAmount;
    const retainedAmount = override?.retainedAmount ?? recommended.retainedAmount;
    const totalAmount = round(seedAmount + flourAmount + waterAmount);
    return { id: key, profileId: profile.id, peakWindow: group[0].peakWindow, contributors: group.map(({ task, usableAmount: amount }) => ({ orderId: task.orderId, orderItemId: task.orderItemId, product: task.product, usableAmount: amount })), recommended, seedAmount, flourAmount, waterAmount, retainedAmount, usableAmount: round(Math.max(0, totalAmount - retainedAmount)), totalAmount, insufficientSeed: seedAmount > profile.currentRetained, override };
  });
}

export function calculateRequirements(tasks: ProductionTask[], builds: StarterBuild[], inventory = DEFAULT_INVENTORY, day?: string, orderId?: string): RequirementLine[] {
  const matching = tasks.filter(task => (task.flowStepId === "mix" || task.flowStepId.startsWith("mix:")) && (!day || task.scheduledAt.slice(0, 10) === day) && (!orderId || task.orderId === orderId));
  const byKey = new Map<string, RequirementLine>();
  const add = (itemId: string, amount: number, source: RequirementLine["source"], sourceOrder?: string) => {
    const item = inventory.find(entry => entry.id === itemId); if (!item) return;
    const key = `${itemId}:${sourceOrder || "all"}:${source}`;
    const line = byKey.get(key) || { itemId, name: item.name, unit: item.unit, required: 0, available: item.onHand, shortage: 0, orderId: sourceOrder, source };
    line.required = round(line.required + amount); line.shortage = round(Math.max(0, line.required - line.available)); byKey.set(key, line);
  };
  matching.forEach(task => (recipeInputs[task.product] || []).forEach(input => add(input.itemId, input.amount * task.quantity, input.source, orderId ? task.orderId : undefined)));
  builds.filter(build => !day || build.peakWindow.slice(0, 10) === day).forEach(build => {
    const included = orderId ? build.contributors.filter(contributor => contributor.orderId === orderId) : build.contributors;
    if (!included.length) return;
    const allUsable = build.contributors.reduce((total, contributor) => total + contributor.usableAmount, 0) || 1;
    const selectedUsable = included.reduce((total, contributor) => total + contributor.usableAmount, 0);
    const share = selectedUsable / allUsable;
    add("flour", build.flourAmount * share, "starter-build", orderId);
    add("water", build.waterAmount * share, "starter-build", orderId);
  });
  return [...byKey.values()];
}

export function shoppingList(lines: RequirementLine[]) { return lines.filter(line => line.shortage > 0); }

export function recordDeductions(existing: InventoryTransaction[], trigger: DeductionTrigger, sourceId: string, lines: RequirementLine[]) {
  const sourceKey = `${trigger}:${sourceId}`;
  if (existing.some(transaction => transaction.sourceKey === sourceKey)) return existing;
  const reason: InventoryTransaction["reason"] = trigger === "task-completion" ? "task-completed" : "order-completed";
  return [...existing, ...lines.map(line => ({ id: `${sourceKey}:${line.itemId}`, sourceKey, itemId: line.itemId, quantityChange: -line.required, reason }))];
}

export function formatShoppingListCsv(lines: RequirementLine[]): string {
  const headers = ["Item", "Unit", "Required", "Available", "Shortage", "Source"];
  const rows = lines.map((line) => [
    `"${(line.name || "").replace(/"/g, '""')}"`,
    `"${(line.unit || "").replace(/"/g, '""')}"`,
    line.required,
    line.available,
    line.shortage,
    `"${(line.source || "").replace(/"/g, '""')}"`,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
