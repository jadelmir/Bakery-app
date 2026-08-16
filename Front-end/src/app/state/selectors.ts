import { buildStarterPlans, calculateRequirements, shoppingList } from "../planning";
import { reportFor } from "../reporting";
import { BAKERY_TIME_ZONE, dateKey } from "../constants";
import type { BakeryDomainSnapshot, DomainCustomer, DomainInventoryItem, DomainOrder, DomainOrderItem, DomainTask } from "../domain/types";
import type { BakeryDomainState } from "./domainState";

const values = <T>(records: Readonly<Record<string, T>>): T[] => Object.values(records);
const byScheduledAt = (left: DomainTask, right: DomainTask) => left.scheduledAt.localeCompare(right.scheduledAt);

export interface OrderReadModel extends DomainOrder {
  readonly customerName: string;
  readonly items: readonly DomainOrderItem[];
}

export interface HomeOrderReadModel extends OrderReadModel {
  readonly customer: DomainCustomer | undefined;
  readonly balance: number;
  readonly productSummary: string;
}

export interface HomeOrderDayGroup {
  readonly dateKey: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly isToday: boolean;
  readonly orders: readonly HomeOrderReadModel[];
}

export const selectOrders = (snapshot: BakeryDomainSnapshot): readonly OrderReadModel[] =>
  values(snapshot.ordersById).map((order) => ({
    ...order,
    customerName: snapshot.customersById[order.customerId]?.name ?? "Unknown customer",
    items: order.itemIds.map((id) => snapshot.orderItemsById[id]).filter((item): item is DomainOrderItem => Boolean(item)),
  })).sort((left, right) => left.pickupDate.localeCompare(right.pickupDate) || left.pickupTime.localeCompare(right.pickupTime));

const addCalendarDays = (value: string, amount: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const formatHomeDay = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", {
  ...options,
  timeZone: BAKERY_TIME_ZONE,
}).format(new Date(`${value}T12:00:00Z`));

const productSummaryFor = (items: readonly DomainOrderItem[]) => {
  const quantities = new Map<string, number>();
  const order: string[] = [];
  items.forEach(item => {
    if (!quantities.has(item.product)) order.push(item.product);
    quantities.set(item.product, (quantities.get(item.product) ?? 0) + item.quantity);
  });
  return order.map(product => `${quantities.get(product)} ${product}`).join(" · ");
};

export const selectHomeOrderCalendar = (snapshot: BakeryDomainSnapshot, referenceDate = new Date()): readonly HomeOrderDayGroup[] => {
  const today = dateKey(referenceDate);
  const horizonEnd = addCalendarDays(today, 6);
  const orders = selectOrders(snapshot)
    .filter(order => !["completed", "cancelled"].includes(order.status))
    .filter(order => order.pickupDate >= today && order.pickupDate <= horizonEnd)
    .map(order => ({
      ...order,
      customer: snapshot.customersById[order.customerId],
      balance: Math.max(0, order.total - order.paid),
      productSummary: productSummaryFor(order.items),
    }))
    .sort((left, right) => left.pickupDate.localeCompare(right.pickupDate) || left.pickupTime.localeCompare(right.pickupTime));

  const grouped = new Map<string, HomeOrderReadModel[]>();
  orders.forEach(order => {
    const current = grouped.get(order.pickupDate) ?? [];
    current.push(order);
    grouped.set(order.pickupDate, current);
  });

  return [...grouped.entries()].map(([key, dayOrders]) => ({
    dateKey: key,
    label: formatHomeDay(key, { weekday: "long", month: "short", day: "numeric" }),
    shortLabel: formatHomeDay(key, { weekday: "short", month: "short", day: "numeric" }),
    isToday: key === today,
    orders: dayOrders,
  }));
};

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
  flow: recipe.flowId ? snapshot.flowsById[recipe.flowId] : undefined,
}));

export const selectFinanceOrders = (snapshot: BakeryDomainSnapshot) => selectOrders(snapshot).map((order) => ({
    id: order.id,
    pickup: order.pickupDate,
    customer: order.customerName,
    status: order.status,
    items: order.items.map((item) => ({
      product: item.product,
      qty: item.quantity,
      price: item.unitPrice,
      costPerUnit: snapshot.recipesById[item.recipeId]?.batchCost,
    })),
    total: order.total,
    paid: order.paid,
  }));

export const selectFinances = (snapshot: BakeryDomainSnapshot) => reportFor(
  selectFinanceOrders(snapshot),
  { product: "all", range: "all" },
  { inventoryFinance: snapshot.inventoryFinance },
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

export const selectActiveStarterInfo = (snapshot: BakeryDomainSnapshot): { name: string; subtitle: string } | undefined => {
  const starterItem = values(snapshot.inventoryById).find((i) => (i.kind as string) === "starter" || i.name.toLowerCase().includes("starter"));
  if (!starterItem) return undefined;
  const starterName = starterItem.name;
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
