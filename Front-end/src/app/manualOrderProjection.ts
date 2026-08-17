import type { ManualOrderSnapshot } from "../lib/supabase/manualOrderAdapter";
import type { BakeryDomainSnapshot } from "./domain/types";
import type { Order } from "./types";

type OrderSnapshotShape = Pick<BakeryDomainSnapshot, "recipesById"> | null | undefined;

export function projectManualOrders(snapshot: ManualOrderSnapshot): Order[] {
  const customerNames = new Map(snapshot.customers.map(customer => [customer.id, customer.name]));

  return snapshot.orders.map(order => ({
    id: order.id,
    customer: customerNames.get(order.customerId) ?? "Customer",
    items: order.items.map(item => ({ product: item.product, qty: item.quantity, price: item.unitPrice })),
    pickup: order.pickupDate,
    pickupTime: order.pickupTime,
    status: order.status,
    total: order.total,
    paid: order.paid,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
    createdAt: order.createdAt,
  }));
}

export function selectOrderProjection({
  persistedServiceActive,
  manualOrderSnapshot,
  domainSnapshot,
  localOrders,
}: {
  persistedServiceActive: boolean;
  manualOrderSnapshot: ManualOrderSnapshot | null;
  domainSnapshot: OrderSnapshotShape;
  localOrders: Order[];
}): Order[] {
  if (persistedServiceActive && manualOrderSnapshot) {
    return projectManualOrders(manualOrderSnapshot);
  }

  // Preserve the legacy fallback for callers that provide a manual snapshot
  // without the persisted service, while keeping local mode unchanged.
  if (!domainSnapshot?.recipesById && manualOrderSnapshot) {
    return projectManualOrders(manualOrderSnapshot);
  }

  return localOrders;
}
