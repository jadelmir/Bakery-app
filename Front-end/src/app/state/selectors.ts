import { buildStarterPlans, calculateRequirements, shoppingList } from "../planning";
import { reportFor } from "../reporting";
import type { BakeryDomainSnapshot, DomainInventoryItem, DomainOrder, DomainOrderItem, DomainTask } from "../domain/types";
import type { BakeryDomainState } from "./domainState";

const values = <T>(records: Readonly<Record<string, T>>): T[] => Object.values(records);
const byScheduledAt = (left: DomainTask, right: DomainTask) => left.scheduledAt.localeCompare(right.scheduledAt);

export interface OrderReadModel extends DomainOrder {
  readonly customerName: string;
  readonly items: readonly DomainOrderItem[];
}

export const selectOrders = (snapshot: BakeryDomainSnapshot): readonly OrderReadModel[] =>
  values(snapshot.ordersById).map((order) => ({
    ...order,
    customerName: snapshot.customersById[order.customerId]?.name ?? "Unknown customer",
    items: order.itemIds.map((id) => snapshot.orderItemsById[id]).filter((item): item is DomainOrderItem => Boolean(item)),
  })).sort((left, right) => left.pickupDate.localeCompare(right.pickupDate) || left.pickupTime.localeCompare(right.pickupTime));

export const selectProduction = (snapshot: BakeryDomainSnapshot) => ({
  tasks: values(snapshot.tasksById).sort(byScheduledAt),
  flows: values(snapshot.flowsById),
});

export const selectInventory = (snapshot: BakeryDomainSnapshot) => {
  const tasks = values(snapshot.tasksById);
  const inventory = values(snapshot.inventoryById);
  const planningInventory = inventory.map((item) => ({ id: item.id, name: item.name, unit: item.unit, onHand: item.onHand, kind: item.kind }));
  const builds = buildStarterPlans(tasks);
  const requirements = calculateRequirements(tasks, builds, planningInventory);
  const transactions = values(snapshot.inventoryTransactionsById);
  const deductedByItem = transactions.reduce<Record<string, number>>((totals, transaction) => ({ ...totals, [transaction.itemId]: (totals[transaction.itemId] ?? 0) + transaction.quantityChange }), {});
  const items = inventory.map((item) => ({ ...item, available: item.onHand + (deductedByItem[item.id] ?? 0) }));
  return { items, builds, requirements, shortages: shoppingList(requirements), transactions };
};

export const selectCustomers = (snapshot: BakeryDomainSnapshot) => {
  const orders = selectOrders(snapshot);
  return values(snapshot.customersById).map((customer) => {
    const customerOrders = orders.filter((order) => order.customerId === customer.id);
    return {
      ...customer,
      orders: customerOrders,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((total, order) => total + order.total, 0),
      balance: customerOrders.reduce((total, order) => total + Math.max(0, order.total - order.paid), 0),
    };
  });
};

export const selectRecipes = (snapshot: BakeryDomainSnapshot) => values(snapshot.recipesById).map((recipe) => ({
  ...recipe,
  flow: snapshot.flowsById[recipe.flowId],
}));

export const selectFinances = (snapshot: BakeryDomainSnapshot) => reportFor(
  selectOrders(snapshot).map((order) => ({ id: order.id, pickup: order.pickupDate, items: order.items.map((item) => ({ product: item.product, qty: item.quantity, price: item.unitPrice })), total: order.total, paid: order.paid })),
  { product: "all", range: "all" },
);

export const selectDashboard = (snapshot: BakeryDomainSnapshot) => {
  const orders = selectOrders(snapshot);
  const tasks = selectProduction(snapshot).tasks;
  const finances = selectFinances(snapshot);
  return {
    orders,
    activeOrders: orders.filter((order) => !["completed", "cancelled"].includes(order.status)),
    tasks,
    completedTaskCount: tasks.filter((task) => task.status === "completed").length,
    finances,
    shortages: selectInventory(snapshot).shortages,
  };
};

export const selectSnapshot = (state: BakeryDomainState): BakeryDomainSnapshot | undefined =>
  state.resource.status === "ready" || state.resource.status === "empty" ? state.resource.data : undefined;

export const selectInventoryItem = (snapshot: BakeryDomainSnapshot, itemId: string): DomainInventoryItem | undefined => snapshot.inventoryById[itemId];

export const selectLowStockCount = (snapshot: BakeryDomainSnapshot): number => {
  const { items, shortages } = selectInventory(snapshot);
  const lowItems = items.filter((item) => item.available <= 500); // 500g threshold or shortage
  return Math.max(shortages.length, lowItems.length);
};

export const selectActiveCustomerCount = (snapshot: BakeryDomainSnapshot): number => {
  return values(snapshot.customersById).length;
};

export const selectUnpaidCustomerSummary = (snapshot: BakeryDomainSnapshot): { unpaidTotal: number; summary: string } => {
  const customersWithBalance = selectCustomers(snapshot).filter((c) => c.balance > 0);
  const unpaidTotal = customersWithBalance.reduce((sum, c) => sum + c.balance, 0);
  if (customersWithBalance.length === 0) {
    return { unpaidTotal: 0, summary: "All customer accounts fully paid" };
  }
  const summary = customersWithBalance
    .map((c) => `${c.name} $${c.balance}`)
    .join(" · ");
  return { unpaidTotal, summary };
};

export const selectActiveStarterInfo = (snapshot: BakeryDomainSnapshot): { name: string; subtitle: string } => {
  const starterItem = values(snapshot.inventoryById).find((i) => (i.kind as string) === "starter" || i.name.toLowerCase().includes("starter"));
  const starterName = starterItem ? starterItem.name : "Earl (Sourdough Starter)";
  return {
    name: starterName,
    subtitle: `${starterName.split(" ")[0]} · feed by 8 PM tonight`,
  };
};

export const getFormattedCurrentDate = (): { weekday: string; dateString: string } => {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateString = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return { weekday, dateString };
};
