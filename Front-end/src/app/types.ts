// ─── App-level Types ────────────────────────────────────────────────────────
// Local UI types used by screen components. These are distinct from domain
// types in ./domain/types.ts which model persisted bakery records.
import type { WorkspaceRouteId } from "./navigation/routeRegistry";

export type Screen = WorkspaceRouteId;

export type TaskStatus = "pending" | "in-progress" | "completed" | "skipped" | "cancelled";
export type TaskUrgency = "due-now" | "overdue";
export type OrderStatus = "draft" | "confirmed" | "in-production" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partially-paid" | "paid" | "refunded";
export type InventoryStatus = "in-stock" | "low" | "insufficient" | "out-of-stock";

export interface Task {
  id: string; time: string; title: string; product: string;
  orderId?: string; quantity?: number; instructions: string;
  status: TaskStatus; urgency?: TaskUrgency; category: string; duration: number;
  scheduledAt?: string; orderItemId?: string; flowId?: string; flowStepId?: string;
  dependencyIncomplete?: boolean; note?: string; skipReason?: string; warning?: string;
}
export interface Order {
  id: string; customer: string;
  items: { product: string; qty: number; price: number }[];
  pickup: string; pickupTime: string; status: OrderStatus;
  total: number; paid: number; paymentStatus: PaymentStatus; notes?: string;
  createdAt?: string;
}
export interface Recipe {
  id: string; name: string; yield: string;
  batchCost: number; sellingPrice: number; profit: number; flow: string;
  ingredients: { name: string; qty: string; cost: number }[];
}
export interface InventoryItem {
  id: string; name: string; current: number; unit: string;
  minLevel: number; upcoming: number; status: InventoryStatus;
}
export interface Customer {
  id: string; name: string; phone: string; email: string;
  address: string; notes: string; orders: number;
  totalSpent: number; balance: number; favorites: string[];
}
