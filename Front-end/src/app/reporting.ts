export type ReportRange = "all" | "today" | "week" | "month" | "custom" | "empty";

export type ReportFilter = {
  product: string;
  range: ReportRange;
  startDate?: string;
  endDate?: string;
  referenceDate?: string;
};

export type ReportOrderItem = {
  product: string;
  qty: number;
  price: number;
  costPerUnit?: number;
};

export type ReportOrder = {
  id: string;
  pickup: string;
  customer?: string;
  items: ReportOrderItem[];
  total: number;
  paid: number;
  status?: string;
};

export type InventoryFinanceInput = {
  purchaseSpendCents?: number;
  inventoryValueCents?: number;
  consumedProductCostCents?: number;
};

export type ReportOrderResult = ReportOrder & {
  selectedItems: ReportOrderItem[];
  revenue: number;
  cost: number;
  unpaid: number;
  units: number;
  costsAvailable: boolean;
};

export type ProductPerformance = {
  product: string;
  units: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  orderIds: string[];
  costsAvailable: boolean;
};

export type ReportTrendPoint = {
  date: string;
  revenue: number;
  profit: number;
};

export type FinanceReport = {
  orders: ReportOrderResult[];
  revenue: number;
  costs: number;
  profit: number;
  marginPercent: number;
  unpaid: number;
  units: number;
  averagePrice: number;
  averageOrderValue: number;
  costsAvailable: boolean;
  products: ProductPerformance[];
  trend: ReportTrendPoint[];
  inventoryFinance?: {
    purchaseSpend?: number;
    inventoryValue?: number;
    consumedProductCost?: number;
  };
};

export type ReportOptions = {
  inventoryFinance?: InventoryFinanceInput;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string, referenceDate: Date): string | undefined => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(`${value} ${referenceDate.getFullYear()}`);
  return Number.isNaN(parsed.getTime()) ? undefined : dateKey(parsed);
};

const startOfWeek = (value: Date) => {
  const result = new Date(value);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

const dateBoundsFor = (filter: ReportFilter, referenceDate: Date): [string | undefined, string | undefined] => {
  if (filter.range === "all") return [undefined, undefined];
  if (filter.range === "empty") return ["9999-01-01", "9999-01-01"];
  if (filter.range === "custom") {
    return [filter.startDate, filter.endDate ?? filter.startDate];
  }
  if (filter.range === "today") {
    const today = dateKey(referenceDate);
    return [today, today];
  }
  if (filter.range === "month") {
    const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const last = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    return [dateKey(first), dateKey(last)];
  }
  const first = startOfWeek(referenceDate);
  const last = new Date(first);
  last.setDate(first.getDate() + 6);
  return [dateKey(first), dateKey(last)];
};

const inBounds = (value: string, bounds: [string | undefined, string | undefined]) => {
  const [start, end] = bounds;
  return (!start || value >= start) && (!end || value <= end);
};

const lineRevenue = (item: ReportOrderItem) => item.qty * item.price;

const itemCost = (item: ReportOrderItem) => item.costPerUnit === undefined ? 0 : item.qty * item.costPerUnit;

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const reportFor = (
  orders: ReportOrder[],
  filter: ReportFilter,
  options: ReportOptions = {},
): FinanceReport => {
  const referenceDate = filter.referenceDate ? new Date(`${filter.referenceDate}T12:00:00`) : new Date();
  const bounds = dateBoundsFor(filter, referenceDate);
  const matching = orders.flatMap((order): ReportOrderResult[] => {
    const orderDate = parseDateKey(order.pickup, referenceDate);
    if (!orderDate || !inBounds(orderDate, bounds)) return [];
    const selectedItems = order.items.filter(item => filter.product === "all" || item.product === filter.product);
    if (selectedItems.length === 0) return [];

    const orderRevenue = order.items.reduce((sum, item) => sum + lineRevenue(item), 0);
    const revenue = roundMoney(selectedItems.reduce((sum, item) => sum + lineRevenue(item), 0));
    const cost = roundMoney(selectedItems.reduce((sum, item) => sum + itemCost(item), 0));
    const unpaidBalance = Math.max(0, order.total - order.paid);
    const unpaid = roundMoney(orderRevenue > 0 ? unpaidBalance * Math.min(1, revenue / orderRevenue) : unpaidBalance);

    return [{
      ...order,
      selectedItems,
      revenue,
      cost,
      unpaid,
      units: selectedItems.reduce((sum, item) => sum + item.qty, 0),
      costsAvailable: selectedItems.every(item => item.costPerUnit !== undefined),
    }];
  });

  const productsByName = new Map<string, ProductPerformance>();
  matching.forEach(order => {
    order.selectedItems.forEach(item => {
      const current = productsByName.get(item.product) ?? {
        product: item.product,
        units: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        marginPercent: 0,
        orderIds: [],
        costsAvailable: true,
      };
      current.units += item.qty;
      current.revenue += lineRevenue(item);
      current.cost += itemCost(item);
      current.costsAvailable = current.costsAvailable && item.costPerUnit !== undefined;
      if (!current.orderIds.includes(order.id)) current.orderIds.push(order.id);
      current.profit = current.revenue - current.cost;
      current.marginPercent = current.revenue > 0 ? (current.profit / current.revenue) * 100 : 0;
      productsByName.set(item.product, current);
    });
  });

  const revenue = roundMoney(matching.reduce((sum, order) => sum + order.revenue, 0));
  const costs = roundMoney(matching.reduce((sum, order) => sum + order.cost, 0));
  const profit = roundMoney(revenue - costs);
  const units = matching.reduce((sum, order) => sum + order.units, 0);
  const costsAvailable = matching.length === 0 || matching.every(order => order.costsAvailable);
  const products = [...productsByName.values()].map(product => ({
    ...product,
    revenue: roundMoney(product.revenue),
    cost: roundMoney(product.cost),
    profit: roundMoney(product.profit),
    marginPercent: product.revenue > 0 ? roundMoney((product.profit / product.revenue) * 100) : 0,
  })).sort((left, right) => right.revenue - left.revenue);

  const trendByDate = new Map<string, ReportTrendPoint>();
  matching.forEach(order => {
    const date = parseDateKey(order.pickup, referenceDate) ?? "Unknown date";
    const current = trendByDate.get(date) ?? { date, revenue: 0, profit: 0 };
    current.revenue += order.revenue;
    current.profit += order.revenue - order.cost;
    trendByDate.set(date, current);
  });

  const inventoryFinance = options.inventoryFinance && {
    ...(options.inventoryFinance.purchaseSpendCents === undefined ? {} : { purchaseSpend: roundMoney(options.inventoryFinance.purchaseSpendCents / 100) }),
    ...(options.inventoryFinance.inventoryValueCents === undefined ? {} : { inventoryValue: roundMoney(options.inventoryFinance.inventoryValueCents / 100) }),
    ...(options.inventoryFinance.consumedProductCostCents === undefined ? {} : { consumedProductCost: roundMoney(options.inventoryFinance.consumedProductCostCents / 100) }),
  };

  return {
    orders: matching,
    revenue,
    costs,
    profit,
    marginPercent: revenue > 0 ? roundMoney((profit / revenue) * 100) : 0,
    unpaid: roundMoney(matching.reduce((sum, order) => sum + order.unpaid, 0)),
    units,
    averagePrice: units ? roundMoney(revenue / units) : 0,
    averageOrderValue: matching.length ? roundMoney(revenue / matching.length) : 0,
    costsAvailable,
    products,
    trend: [...trendByDate.values()].map(point => ({ ...point, revenue: roundMoney(point.revenue), profit: roundMoney(point.profit) })),
    ...(inventoryFinance && Object.keys(inventoryFinance).length > 0 ? { inventoryFinance } : {}),
  };
};

export const reportCsv = (report: FinanceReport) => {
  const rows = [
    ["section", "name", "units", "revenue", "cost", "profit", "margin", "unpaid"],
    ["summary", "Revenue", "", report.revenue, "", "", "", ""],
    ["summary", "Product cost", "", "", report.costs, "", "", ""],
    ["summary", "Gross profit", "", "", "", report.profit, report.marginPercent, ""],
    ["summary", "Average order value", "", report.averageOrderValue, "", "", "", ""],
    ["summary", "Unpaid balance", "", "", "", "", "", report.unpaid],
    ...report.products.map(product => ["product", product.product, product.units, product.revenue, product.cost, product.profit, product.marginPercent, ""]),
    ...report.orders.map(order => ["order", order.id, order.units, order.revenue, order.cost, order.revenue - order.cost, "", order.unpaid]),
  ];
  return rows.map(row => row.map(value => csvCell(value)).join(",")).join("\n");
};

export type AppNotification = { id: string; kind: "task" | "shortage" | "starter" | "pickup"; title: string; detail: string };

export const notificationsFor = (unpaid: number): AppNotification[] => [
  { id: "short-flour", kind: "shortage", title: "Flour shortage", detail: "Buy flour before the next production run." },
  { id: "starter-seed", kind: "starter", title: "Starter needs attention", detail: "The planned build needs more seed starter." },
  { id: "pickup-next", kind: "pickup", title: "Upcoming pickup", detail: "Review the next confirmed order before pickup." },
  ...(unpaid > 0 ? [{ id: "unpaid", kind: "task" as const, title: "Unpaid balance", detail: `$${unpaid} remains unpaid.` }] : []),
];
