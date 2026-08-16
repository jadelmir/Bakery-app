import type { Order, OrderStatus, PaymentStatus } from "../../types";

export type OrdersPrimaryView = "current" | "completed";
export type CurrentOrderStatus = Extract<OrderStatus, "confirmed" | "in-production" | "ready">;
export type SecondaryOrderStatus = Extract<OrderStatus, "draft" | "cancelled">;
export type PickupUrgency = "overdue" | "today" | "upcoming" | "unknown";

export interface OrderPresentationFilters {
  primaryView?: OrdersPrimaryView;
  stage?: CurrentOrderStatus | null;
  secondaryStatus?: SecondaryOrderStatus | null;
  search?: string;
  paymentStatus?: PaymentStatus | "balance-due" | null;
  product?: string | null;
  pickupDate?: string | null;
  now?: Date;
}

export interface PickupPresentation {
  date: Date | null;
  urgency: PickupUrgency;
  label: string;
}

export const CURRENT_ORDER_STATUSES: readonly CurrentOrderStatus[] = [
  "confirmed",
  "in-production",
  "ready",
];

const DISPLAY_DATE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function validLocalDate(year: number, month: number, day: number, hours: number, minutes: number) {
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return date.getFullYear() === year
    && date.getMonth() === month
    && date.getDate() === day
    && date.getHours() === hours
    && date.getMinutes() === minutes
    ? date
    : null;
}

/** Parses the two date/time shapes produced by persisted and fixture orders. */
export function parsePickupDateTime(order: Pick<Order, "pickup" | "pickupTime">, now = new Date()): Date | null {
  const timeMatch = order.pickupTime.trim().match(TIME);
  if (!timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (minutes > 59 || (meridiem ? hours < 1 || hours > 12 : hours > 23)) return null;
  if (meridiem) hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);

  const isoMatch = order.pickup.trim().match(ISO_DATE);
  if (isoMatch) {
    return validLocalDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), hours, minutes);
  }

  const displayMatch = order.pickup.trim().match(DISPLAY_DATE);
  if (!displayMatch) return null;
  const month = MONTHS.indexOf(displayMatch[1].toLowerCase());
  return validLocalDate(now.getFullYear(), month, Number(displayMatch[2]), hours, minutes);
}

function sameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function calendarDaysBetween(from: Date, to: Date) {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toDay - fromDay) / 86_400_000);
}

export function getPickupPresentation(order: Pick<Order, "pickup" | "pickupTime">, now = new Date()): PickupPresentation {
  const date = parsePickupDateTime(order, now);
  if (!date) return { date: null, urgency: "unknown", label: "Pickup time unavailable" };
  if (date.getTime() < now.getTime()) return { date, urgency: "overdue", label: "Overdue" };
  if (sameLocalDay(date, now)) return { date, urgency: "today", label: "Today" };
  const daysUntilPickup = calendarDaysBetween(now, date);
  return {
    date,
    urgency: "upcoming",
    label: daysUntilPickup === 1 ? "Due tomorrow" : `Due in ${daysUntilPickup} days`,
  };
}

export const isCurrentOrder = (order: Pick<Order, "status">) =>
  CURRENT_ORDER_STATUSES.includes(order.status as CurrentOrderStatus);

export const isCompletedOrder = (order: Pick<Order, "status">) => order.status === "completed";

/** Count the current order queue shown as upcoming work in workspace navigation. */
export function getUpcomingOrderCount(orders: readonly Order[]): number {
  return orders.filter(isCurrentOrder).length;
}

export function getCurrentStageCounts(orders: readonly Order[]): Record<CurrentOrderStatus, number> {
  return orders.reduce<Record<CurrentOrderStatus, number>>((counts, order) => {
    if (isCurrentOrder(order)) counts[order.status as CurrentOrderStatus] += 1;
    return counts;
  }, { confirmed: 0, "in-production": 0, ready: 0 });
}

export function getSecondaryStatusCounts(orders: readonly Order[]): Record<SecondaryOrderStatus, number> {
  return orders.reduce<Record<SecondaryOrderStatus, number>>((counts, order) => {
    if (order.status === "draft" || order.status === "cancelled") counts[order.status] += 1;
    return counts;
  }, { draft: 0, cancelled: 0 });
}

export function sortOrdersByPickup(orders: readonly Order[], now = new Date()): Order[] {
  return orders
    .map((order, index) => ({ order, index, pickup: parsePickupDateTime(order, now)?.getTime() ?? Number.POSITIVE_INFINITY }))
    .sort((left, right) => left.pickup - right.pickup || left.index - right.index)
    .map(({ order }) => order);
}

function createdAtTimestamp(order: Pick<Order, "createdAt">): number | null {
  if (!order.createdAt) return null;
  const timestamp = Date.parse(order.createdAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/** Default queue ordering: most recently created orders first. Missing timestamps keep their input order. */
export function sortOrdersByNewest(orders: readonly Order[]): Order[] {
  return orders
    .map((order, index) => ({ order, index, createdAt: createdAtTimestamp(order) }))
    .sort((left, right) => {
      if (left.createdAt !== null && right.createdAt !== null) return right.createdAt - left.createdAt || left.index - right.index;
      if (left.createdAt !== null) return -1;
      if (right.createdAt !== null) return 1;
      return left.index - right.index;
    })
    .map(({ order }) => order);
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function selectPresentedOrders(orders: readonly Order[], filters: OrderPresentationFilters = {}): Order[] {
  const {
    primaryView = "current",
    stage = null,
    secondaryStatus = null,
    search = "",
    paymentStatus = null,
    product = null,
    pickupDate = null,
    now = new Date(),
  } = filters;
  const query = normalized(search);
  const productQuery = product ? normalized(product) : "";

  const filtered = orders.filter(order => {
    const inPrimaryView = secondaryStatus
      ? order.status === secondaryStatus
      : primaryView === "current" ? isCurrentOrder(order) : isCompletedOrder(order);
    if (!inPrimaryView) return false;
    if (!secondaryStatus && stage && order.status !== stage) return false;
    if (query && ![order.id, order.customer, ...order.items.map(item => item.product)].some(value => normalized(value).includes(query))) return false;
    if (paymentStatus === "balance-due" && order.total <= order.paid) return false;
    if (paymentStatus && paymentStatus !== "balance-due" && order.paymentStatus !== paymentStatus) return false;
    if (productQuery && !order.items.some(item => normalized(item.product) === productQuery)) return false;
    if (pickupDate) {
      const pickup = parsePickupDateTime(order, now);
      if (!pickup || localDateKey(pickup) !== pickupDate) return false;
    }
    return true;
  });

  return sortOrdersByNewest(filtered);
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
