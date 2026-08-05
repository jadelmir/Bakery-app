import { DEFAULT_FLOWS, generatePlan } from "../production";
import type {
  BakeryDomainSnapshot,
  BakeryId,
  DomainCustomer,
  DomainInventoryItem,
  DomainOrder,
  DomainOrderItem,
  DomainRecipe,
  DomainTask,
} from "./types";

export const FIXTURE_BAKERY_IDS = {
  EARLS: "bakery-earls",
  MARINA: "bakery-marina",
} as const;

/** Date with generated production tasks used by deterministic browser scenarios. */
export const FIXTURE_PRODUCTION_TEST_DATE = "2026-07-30";

const indexById = <T extends { readonly id: string }>(entries: readonly T[]): Record<string, T> =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry]));

const recipes: readonly DomainRecipe[] = [
  {
    id: "recipe-sourdough", name: "Sourdough Loaf", yield: "1 loaf · 850g", batchCost: 3.2, sellingPrice: 14,
    flowId: "flow-sourdough",
    ingredients: [
      { inventoryItemId: "flour", quantity: 500, cost: 1 }, { inventoryItemId: "water", quantity: 350, cost: 0.02 },
      { inventoryItemId: "salt", quantity: 10, cost: 0.03 },
    ],
  },
  {
    id: "recipe-focaccia", name: "Focaccia", yield: "1 tray", batchCost: 2.4, sellingPrice: 8,
    flowId: "flow-focaccia",
    ingredients: [
      { inventoryItemId: "flour", quantity: 1000, cost: 2 }, { inventoryItemId: "water", quantity: 500, cost: 0.02 },
      { inventoryItemId: "salt", quantity: 20, cost: 0.06 }, { inventoryItemId: "oil", quantity: 50, cost: 0.4 },
    ],
  },
];

const inventory: readonly DomainInventoryItem[] = [
  { id: "flour", name: "Kirkland Organic Flour", unit: "g", onHand: 800, minLevel: 2000, kind: "ingredient", status: "insufficient" },
  { id: "water", name: "Water", unit: "ml", onHand: 900, minLevel: 300, kind: "ingredient", status: "low" },
  { id: "salt", name: "Salt", unit: "g", onHand: 1000, minLevel: 100, kind: "ingredient", status: "in-stock" },
  { id: "oil", name: "Olive Oil", unit: "ml", onHand: 500, minLevel: 100, kind: "ingredient", status: "in-stock" },
  { id: "bag", name: "Bakery Bags", unit: "bags", onHand: 3, minLevel: 10, kind: "packaging", status: "insufficient" },
];

const earlsCustomers: readonly DomainCustomer[] = [
  { id: "customer-sarah", name: "Sarah Mitchell", phone: "415-555-0182", email: "sarah.m@email.com", address: "14 Birch Lane, Mill Valley", notes: "Prefers sliced loaves. Picks up Wednesdays.", favoriteProducts: ["Sourdough Loaf", "Focaccia"] },
  { id: "customer-james", name: "James Okonkwo", phone: "415-555-0247", email: "james.ok@email.com", address: "22 Cedar St, Sausalito", notes: "Nut allergy — never pecans or walnuts. Very loyal.", favoriteProducts: ["Sourdough Loaf"] },
  { id: "customer-reed", name: "The Reed Family", phone: "415-555-0091", email: "reed.family@email.com", address: "7 Oak Drive, Tiburon", notes: "Monthly bulk order. Always 4+ loaves. Pay at pickup.", favoriteProducts: ["Sourdough Loaf"] },
  { id: "customer-priya", name: "Priya Nair", phone: "415-555-0364", email: "priya.n@email.com", address: "88 Elm Ave, Corte Madera", notes: "Special occasions only. Loves handwritten notes.", favoriteProducts: ["Focaccia"] },
];

const marinaCustomers: readonly DomainCustomer[] = [
  { id: "customer-marina-ana", name: "Ana Torres", phone: "415-555-0441", email: "ana@example.com", address: "1 Harbor Road, Sausalito", notes: "Saturday pickup.", favoriteProducts: ["Focaccia"] },
];

type FixtureOrder = Omit<DomainOrder, "itemIds"> & { readonly items: readonly { readonly id: string; readonly recipeId: string; readonly quantity: number; readonly unitPrice: number }[] };

const earlsOrders: readonly FixtureOrder[] = [
  { id: "order-024", customerId: "customer-sarah", pickupDate: FIXTURE_PRODUCTION_TEST_DATE, pickupTime: "14:00", status: "in-production", total: 44, paid: 44, paymentStatus: "paid", notes: "Please slice one loaf", items: [{ id: "order-024-item-1", recipeId: "recipe-sourdough", quantity: 2, unitPrice: 14 }, { id: "order-024-item-2", recipeId: "recipe-focaccia", quantity: 2, unitPrice: 8 }] },
  { id: "order-025", customerId: "customer-james", pickupDate: "2026-07-31", pickupTime: "10:00", status: "confirmed", total: 22, paid: 10, paymentStatus: "partially-paid", notes: "Nut allergy — no pecans", items: [{ id: "order-025-item-1", recipeId: "recipe-sourdough", quantity: 1, unitPrice: 14 }, { id: "order-025-item-2", recipeId: "recipe-focaccia", quantity: 1, unitPrice: 8 }] },
  { id: "order-026", customerId: "customer-reed", pickupDate: "2026-08-02", pickupTime: "13:00", status: "ready", total: 56, paid: 0, paymentStatus: "unpaid", items: [{ id: "order-026-item-1", recipeId: "recipe-sourdough", quantity: 4, unitPrice: 14 }] },
  { id: "order-027", customerId: "customer-priya", pickupDate: "2026-08-03", pickupTime: "11:00", status: "completed", total: 16, paid: 16, paymentStatus: "paid", notes: "Anniversary order — include a handwritten note", items: [{ id: "order-027-item-1", recipeId: "recipe-focaccia", quantity: 2, unitPrice: 8 }] },
];

const marinaOrders: readonly FixtureOrder[] = [
  { id: "order-marina-001", customerId: "customer-marina-ana", pickupDate: "2026-08-01", pickupTime: "09:00", status: "confirmed", total: 24, paid: 0, paymentStatus: "unpaid", items: [{ id: "order-marina-001-item-1", recipeId: "recipe-focaccia", quantity: 3, unitPrice: 8 }] },
];

const buildSnapshot = (bakeryId: BakeryId, customers: readonly DomainCustomer[], orders: readonly FixtureOrder[]): BakeryDomainSnapshot => {
  const orderEntities: DomainOrder[] = orders.map(({ items, ...order }) => ({ ...order, itemIds: items.map((item) => item.id) }));
  const orderItems: DomainOrderItem[] = orders.flatMap((order) => order.items.map((item) => {
    const recipe = recipes.find((candidate) => candidate.id === item.recipeId);
    if (!recipe) throw new Error(`Fixture references unknown recipe ${item.recipeId}.`);
    return { ...item, orderId: order.id, product: recipe.name };
  }));
  const tasks: DomainTask[] = orders.flatMap((order) => generatePlan({
    id: order.id, pickupDate: order.pickupDate, pickupTime: order.pickupTime,
    items: order.items.map((item) => ({ id: item.id, product: recipes.find((recipe) => recipe.id === item.recipeId)?.name ?? "", qty: item.quantity })),
  }).tasks.map((task) => ({ ...task, status: task.status as DomainTask["status"] })));

  return {
    bakeryId,
    customersById: indexById(customers), inventoryById: indexById(inventory), recipesById: indexById(recipes), flowsById: indexById(DEFAULT_FLOWS),
    ordersById: indexById(orderEntities), orderItemsById: indexById(orderItems), tasksById: indexById(tasks), inventoryTransactionsById: {},
  };
};

const fixtureSnapshots: Readonly<Record<string, BakeryDomainSnapshot>> = {
  [FIXTURE_BAKERY_IDS.EARLS]: buildSnapshot(FIXTURE_BAKERY_IDS.EARLS, earlsCustomers, earlsOrders),
  [FIXTURE_BAKERY_IDS.MARINA]: buildSnapshot(FIXTURE_BAKERY_IDS.MARINA, marinaCustomers, marinaOrders),
};

/** Returns a fresh snapshot so each session-local adapter starts isolated. */
export const createFixtureSnapshots = (): Record<string, BakeryDomainSnapshot> => structuredClone(fixtureSnapshots);

export const fixtureSnapshotFor = (bakeryId: BakeryId): BakeryDomainSnapshot | undefined => {
  const snapshot = fixtureSnapshots[bakeryId];
  return snapshot ? structuredClone(snapshot) : undefined;
};
