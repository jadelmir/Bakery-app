// ─── App-level Constants, Mock Data, Style Maps, and Date Helpers ────────────
// Synthetic records are available only to tests and explicit browser mock mode.
// Normal Supabase-backed runtime starts from authoritative persisted data or an
// empty state instead of silently displaying prototype customers/orders.

import { generatePlan, type ProductionTask } from "./production";
import type { Task, Order, Recipe, InventoryItem, Customer, TaskStatus, TaskUrgency, OrderStatus, PaymentStatus, InventoryStatus } from "./types";

const USE_SYNTHETIC_FIXTURES =
  import.meta.env.MODE === "test" || import.meta.env.VITE_USE_MOCK_BACKEND === "true";

const MOCK_TASKS: Task[] = [
  { id: "t1", time: "06:00", title: "Feed Starter", product: "Starter — Earl", instructions: "Discard to 50g. Add 100g water at 75°F + 100g bread flour. Mix until smooth. Target 100% hydration. Mark feed time.", status: "completed", category: "starter", duration: 10 },
  { id: "t2", time: "07:30", title: "Build Starter", product: "Sourdough Loaf", orderId: "#024", quantity: 2, instructions: "Combine 40g retained starter, 120g water, and 120g flour. Cover and ferment until active for the loaf mix.", status: "in-progress", urgency: "due-now", category: "starter", duration: 15 },
  { id: "t3", time: "10:00", title: "Mix Focaccia Dough", product: "Focaccia", orderId: "#024", quantity: 2, instructions: "Combine flour, water, salt, active starter, and olive oil. Mix until incorporated, oil the container, and cover.", status: "pending", urgency: "overdue", category: "mixing", duration: 20 },
  { id: "t4", time: "12:00", title: "Stretch & Fold", product: "Sourdough Loaf", instructions: "Complete a stretch-and-fold set, then leave the dough to continue bulk fermentation.", status: "pending", category: "ferment", duration: 5 },
  { id: "t5", time: "14:00", title: "Shape Loaves", product: "Sourdough Loaf", orderId: "#024", quantity: 2, instructions: "Pre-shape, rest, final-shape, then place the loaves seam-up in bannetons for cold fermentation.", status: "pending", category: "shaping", duration: 25 },
  { id: "t6", time: "14:30", title: "Transfer Focaccia to Tray", product: "Focaccia", instructions: "Transfer the dough to an oiled tray, dimple gently, and begin cold fermentation.", status: "pending", category: "shaping", duration: 15 },
  { id: "t7", time: "15:30", title: "Bake Focaccia", product: "Focaccia", orderId: "#024", quantity: 2, instructions: "Preheat the oven, bake until golden, then cool before packaging.", status: "pending", category: "baking", duration: 30 },
  { id: "t8", time: "16:30", title: "Package Orders", product: "Focaccia", orderId: "#024", quantity: 2, instructions: "Package the cooled focaccia and attach the pickup label.", status: "pending", category: "packaging", duration: 10 },
];

const MOCK_ORDERS: Order[] = [
  { id: "#024", customer: "Sarah Mitchell", items: [{ product: "Sourdough Loaf", qty: 2, price: 14 }, { product: "Focaccia", qty: 2, price: 8 }], pickup: "Jul 30", pickupTime: "2:00 PM", status: "in-production", total: 44, paid: 44, paymentStatus: "paid", notes: "Please slice one loaf" },
  { id: "#025", customer: "James Okonkwo", items: [{ product: "Sourdough Loaf", qty: 1, price: 14 }, { product: "Focaccia", qty: 1, price: 8 }], pickup: "Jul 31", pickupTime: "10:00 AM", status: "confirmed", total: 22, paid: 10, paymentStatus: "partially-paid", notes: "Nut allergy — no pecans" },
  { id: "#026", customer: "The Reed Family", items: [{ product: "Sourdough Loaf", qty: 4, price: 14 }], pickup: "Aug 2", pickupTime: "1:00 PM", status: "ready", total: 56, paid: 0, paymentStatus: "unpaid" },
  { id: "#027", customer: "Priya Nair", items: [{ product: "Focaccia", qty: 2, price: 8 }], pickup: "Aug 3", pickupTime: "11:00 AM", status: "completed", total: 16, paid: 16, paymentStatus: "paid", notes: "Anniversary order — include a handwritten note" },
];

const MOCK_RECIPES: Recipe[] = [
  { id: "r1", name: "Sourdough Loaf", yield: "1 loaf · 850g", batchCost: 3.20, sellingPrice: 14, profit: 10.80, flow: "Standard Sourdough Loaf", ingredients: [{ name: "Kirkland Organic Flour", qty: "500g", cost: 1.00 }, { name: "Water", qty: "350ml", cost: 0.02 }, { name: "Active Starter", qty: "100g", cost: 0.20 }, { name: "Salt", qty: "10g", cost: 0.03 }] },
  { id: "r2", name: "Focaccia", yield: "1 tray", batchCost: 2.40, sellingPrice: 8, profit: 5.60, flow: "Standard Focaccia", ingredients: [{ name: "Kirkland Organic Flour", qty: "1000g", cost: 2.00 }, { name: "Water", qty: "500ml", cost: 0.02 }, { name: "Active Starter", qty: "200g", cost: 0.40 }, { name: "Olive Oil", qty: "50ml", cost: 0.40 }, { name: "Salt", qty: "20g", cost: 0.06 }] },
];

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "Kirkland Organic Flour", current: 800, unit: "g", minLevel: 2000, upcoming: 0, status: "insufficient" },
  { id: "i2", name: "Water", current: 900, unit: "ml", minLevel: 300, upcoming: 0, status: "low" },
  { id: "i4", name: "Salt", current: 1000, unit: "g", minLevel: 100, upcoming: 0, status: "in-stock" },
  { id: "i6", name: "Olive Oil", current: 500, unit: "ml", minLevel: 100, upcoming: 0, status: "in-stock" },
  { id: "i8", name: "Bakery Bags", current: 3, unit: "bags", minLevel: 10, upcoming: 0, status: "insufficient" },
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Sarah Mitchell", phone: "415-555-0182", email: "sarah.m@email.com", address: "14 Birch Lane, Mill Valley", notes: "Prefers sliced loaves. Picks up Wednesdays.", orders: 12, totalSpent: 368, balance: 0, favorites: ["Sourdough Loaf", "Focaccia"] },
  { id: "c2", name: "James Okonkwo", phone: "415-555-0247", email: "james.ok@email.com", address: "22 Cedar St, Sausalito", notes: "Nut allergy — never pecans or walnuts. Very loyal.", orders: 6, totalSpent: 182, balance: 12, favorites: ["Sourdough Loaf"] },
  { id: "c3", name: "The Reed Family", phone: "415-555-0091", email: "reed.family@email.com", address: "7 Oak Drive, Tiburon", notes: "Monthly bulk order. Always 4+ loaves. Pay at pickup.", orders: 8, totalSpent: 448, balance: 56, favorites: ["Sourdough Loaf"] },
  { id: "c4", name: "Priya Nair", phone: "415-555-0364", email: "priya.n@email.com", address: "88 Elm Ave, Corte Madera", notes: "Special occasions only. Loves handwritten notes.", orders: 3, totalSpent: 98, balance: 0, favorites: ["Focaccia"] },
];

export const TASKS: Task[] = USE_SYNTHETIC_FIXTURES ? MOCK_TASKS : [];
export const ORDERS: Order[] = USE_SYNTHETIC_FIXTURES ? MOCK_ORDERS : [];
export const RECIPES: Recipe[] = USE_SYNTHETIC_FIXTURES ? MOCK_RECIPES : [];
export const INVENTORY: InventoryItem[] = USE_SYNTHETIC_FIXTURES ? MOCK_INVENTORY : [];
export const CUSTOMERS: Customer[] = USE_SYNTHETIC_FIXTURES ? MOCK_CUSTOMERS : [];

export const TASK_STATUS: Record<TaskStatus, { label: string; textCls: string; bgCls: string }> = {
  "pending":     { label: "Not started", textCls: "text-[#6F655E]", bgCls: "bg-[#F6F0E8]" },
  "in-progress": { label: "In Progress", textCls: "text-[#4B6F8C]", bgCls: "bg-[#E8F0FB]" },
  "completed":   { label: "Completed",   textCls: "text-[#3F7A55]", bgCls: "bg-[#E8F3EB]" },
  "skipped":     { label: "Skipped",     textCls: "text-[#988D84]", bgCls: "bg-[#F6F0E8]" },
  "cancelled":   { label: "Cancelled",   textCls: "text-[#988D84]", bgCls: "bg-[#F6F0E8]" },
};

export const TASK_URGENCY: Record<TaskUrgency, { label: string; textCls: string; bgCls: string }> = {
  "due-now": { label: "Due Now", textCls: "text-[#B7791F]", bgCls: "bg-[#FFF4D8]" },
  "overdue": { label: "Overdue", textCls: "text-[#B8443C]", bgCls: "bg-[#FCE9E7]" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; textCls: string; bgCls: string }> = {
  "draft":         { label: "Draft",         textCls: "text-[#6F655E]", bgCls: "bg-[#F6F0E8]" },
  "confirmed":     { label: "Confirmed",     textCls: "text-[#B7791F]", bgCls: "bg-[#FFF4D8]" },
  "in-production": { label: "In Production", textCls: "text-[#4B6F8C]", bgCls: "bg-[#E8F0FB]" },
  "ready":         { label: "Ready",         textCls: "text-[#3F7A55]", bgCls: "bg-[#E8F3EB]" },
  "completed":     { label: "Completed",     textCls: "text-[#988D84]", bgCls: "bg-[#F6F0E8]" },
  "cancelled":     { label: "Cancelled",     textCls: "text-[#988D84]", bgCls: "bg-[#F6F0E8]" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; textCls: string; bgCls: string }> = {
  "unpaid":         { label: "Unpaid",         textCls: "text-[#B8443C]", bgCls: "bg-[#FCE9E7]" },
  "partially-paid": { label: "Partially Paid", textCls: "text-[#B7791F]", bgCls: "bg-[#FFF4D8]" },
  "paid":           { label: "Paid",           textCls: "text-[#3F7A55]", bgCls: "bg-[#E8F3EB]" },
  "refunded":       { label: "Refunded",       textCls: "text-[#988D84]", bgCls: "bg-[#F6F0E8]" },
};

export const INV_STATUS: Record<InventoryStatus, { label: string; textCls: string; bgCls: string }> = {
  "in-stock":    { label: "In Stock",    textCls: "text-[#3F7A55]", bgCls: "bg-[#E8F3EB]" },
  "low":         { label: "Low", textCls: "text-[#B7791F]", bgCls: "bg-[#FFF4D8]" },
  "insufficient":{ label: "Insufficient",textCls: "text-[#B8443C]", bgCls: "bg-[#FCE9E7]" },
  "out-of-stock":{ label: "Out of Stock",textCls: "text-[#B8443C]", bgCls: "bg-[#FCE9E7]" },
};

export const CAT_COLORS: Record<string, string> = {
  starter: "#4B6F8C", mixing: "#7A3E24", ferment: "#B4643B",
  shaping: "#934E2E", baking: "#B8443C", packaging: "#3F7A55", prep: "#6F655E",
};

export const BAKERY_TIME_ZONE = "America/New_York";

export const localDateKey = (value = new Date()) => [
  value.getFullYear(),
  String(value.getMonth() + 1).padStart(2, "0"),
  String(value.getDate()).padStart(2, "0"),
].join("-");

export const dateKey = (value: Date | string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: BAKERY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
}).format(typeof value === "string" ? new Date(value) : value);

export const displayTime = (value: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: BAKERY_TIME_ZONE, hour: "numeric", minute: "2-digit",
}).format(new Date(value));

export const displayDate = (value: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: BAKERY_TIME_ZONE, weekday: "short", month: "short", day: "numeric",
}).format(new Date(value));

export const addDays = (value: Date, amount: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
};

export const pickupDateKey = (order: Order) => {
  const parsed = new Date(`${order.pickup}, ${new Date().getFullYear()} ${order.pickupTime}`);
  return Number.isNaN(parsed.getTime()) ? "" : dateKey(parsed);
};

export const toTask = (task: ProductionTask, warning?: string): Task => ({
  ...task,
  time: displayTime(task.scheduledAt),
  status: task.status === "overdue" ? "pending" : task.status,
  urgency: task.status === "overdue" ? "overdue" : undefined,
  warning,
});

export const planTasks = (order: Parameters<typeof generatePlan>[0]) => {
  const plan = generatePlan(order);
  return plan.tasks.map(task => toTask(task, plan.warnings.find(warning => warning.taskId === task.id)?.message));
};
