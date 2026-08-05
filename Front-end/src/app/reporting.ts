export type ReportOrder = { id: string; pickup: string; items: { product: string; qty: number; price: number }[]; total: number; paid: number };
export type ReportFilter = { product: string; range: "all" | "july" | "empty" };
export const reportFor = (orders: ReportOrder[], filter: ReportFilter) => {
  const matching = filter.range === "empty" ? [] : orders.filter(order => filter.product === "all" || order.items.some(item => item.product === filter.product));
  const revenue = matching.reduce((sum, order) => sum + order.total, 0);
  const costs = Math.round(revenue * 0.27 * 100) / 100;
  const units = matching.flatMap(order => order.items).filter(item => filter.product === "all" || item.product === filter.product).reduce((sum, item) => sum + item.qty, 0);
  const unpaid = matching.reduce((sum, order) => sum + Math.max(0, order.total - order.paid), 0);
  return { orders: matching, revenue, costs, profit: revenue - costs, unpaid, units, averagePrice: units ? revenue / units : 0 };
};
export const reportCsv = (report: ReturnType<typeof reportFor>) => ["order,revenue,unpaid", ...report.orders.map(order => `${order.id},${order.total},${Math.max(0, order.total - order.paid)}`)].join("\n");
export type AppNotification = { id: string; kind: "task" | "shortage" | "starter" | "pickup"; title: string; detail: string };
export const notificationsFor = (unpaid: number): AppNotification[] => [
  { id: "short-flour", kind: "shortage", title: "Flour shortage", detail: "Buy flour before the next production run." },
  { id: "starter-seed", kind: "starter", title: "Starter needs attention", detail: "The planned build needs more seed starter." },
  { id: "pickup-next", kind: "pickup", title: "Upcoming pickup", detail: "Review the next confirmed order before pickup." },
  ...(unpaid > 0 ? [{ id: "unpaid", kind: "task" as const, title: "Unpaid balance", detail: `$${unpaid} remains unpaid.` }] : []),
];
