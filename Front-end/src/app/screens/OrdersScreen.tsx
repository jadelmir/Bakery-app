import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import type { Order, PaymentStatus, Task } from "../types";
import { ORDERS, ORDER_STATUS } from "../constants";
import {
  getCurrentStageCounts,
  getUpcomingOrderCount,
  isCompletedOrder,
  selectPresentedOrders,
  type CurrentOrderStatus,
  type OrdersPrimaryView,
  type SecondaryOrderStatus,
} from "../components/orders/orderPresentation";
import {
  CurrentWorkflowSummary,
  OrderSecondaryFilters,
  OrdersViewTabs,
  WorkflowOrderCard,
} from "../components/orders/workflow/OrdersOverview";
import {
  NextActionArea,
  OrderLifecycle,
  PaymentSummary,
  PickupSummary,
  ProductionProgress,
  ProductionTaskHistory,
} from "../components/orders/workflow/OrderDetail";

const statusTransitions = {
  confirmed: {
    label: "Start Production",
    description: "Move this confirmed order into active production.",
    targetStatus: "in-production",
  },
  "in-production": {
    label: "Mark Ready",
    description: "Confirm production is finished and the order is ready for pickup.",
    targetStatus: "ready",
  },
  ready: {
    label: "Mark Completed",
    description: "Confirm the customer picked up this order.",
    targetStatus: "completed",
  },
} as const;

export type OrderStatusTransition = {
  readonly expectedStatus: keyof typeof statusTransitions;
  readonly targetStatus: (typeof statusTransitions)[keyof typeof statusTransitions]["targetStatus"];
};

export function OrdersScreen({ onAddOrder, onTransitionOrder, onMarkOrderPaid, tasks, orders = ORDERS, now = new Date() }: {
  onAddOrder: () => void;
  onTransitionOrder?: (order: Order, transition: OrderStatusTransition) => Promise<Order>;
  onMarkOrderPaid?: (order: Order) => Promise<Order>;
  tasks: Task[];
  orders?: Order[];
  now?: Date;
}) {
  const [primaryView, setPrimaryView] = useState<OrdersPrimaryView>("current");
  const [stage, setStage] = useState<CurrentOrderStatus | null>(null);
  const [secondaryStatus, setSecondaryStatus] = useState<SecondaryOrderStatus | null>(null);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "balance-due" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [transitionPending, setTransitionPending] = useState(false);
  const [transitionError, setTransitionError] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const selected = selectedOrderId ? orders.find(order => order.id === selectedOrderId) ?? null : null;
  const currentCounts = useMemo(() => getCurrentStageCounts(orders), [orders]);
  const viewCounts = useMemo(() => ({
    current: getUpcomingOrderCount(orders),
    completed: orders.filter(isCompletedOrder).length,
  }), [orders]);
  const products = useMemo(() => Array.from(new Set(
    orders.flatMap(order => order.items.map(item => item.product)),
  )).sort((left, right) => left.localeCompare(right)), [orders]);
  const presentedOrders = useMemo(() => selectPresentedOrders(orders, {
    primaryView,
    stage,
    secondaryStatus,
    search,
    paymentStatus,
    product: selectedProduct,
    now,
  }), [now, orders, paymentStatus, primaryView, search, secondaryStatus, selectedProduct, stage]);

  const selectPrimaryView = (view: OrdersPrimaryView) => {
    setPrimaryView(view);
    setSecondaryStatus(null);
    setStage(null);
    setSelectedOrderId(null);
    setTransitionError("");
  };

  const selectSecondaryStatus = (status: SecondaryOrderStatus | null) => {
    setSecondaryStatus(status);
    setStage(null);
    setSelectedOrderId(null);
    setTransitionError("");
  };

  const openOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setTransitionError("");
    setPaymentError("");
  };

  const closeDetail = () => {
    setSelectedOrderId(null);
    setTransitionError("");
    setPaymentError("");
  };

  const selectedTasks = useMemo(() => tasks
    .filter(task => task.orderId === selected?.id)
    .sort((left, right) => (left.scheduledAt || left.time).localeCompare(right.scheduledAt || right.time)),
  [selected?.id, tasks]);

  const transition = selected
    ? statusTransitions[selected.status as keyof typeof statusTransitions]
    : undefined;

  const handleTransition = async () => {
    if (!selected || !transition || !onTransitionOrder || transitionPending) return;
    setTransitionPending(true);
    setTransitionError("");
    try {
      await onTransitionOrder(selected, {
        expectedStatus: selected.status as keyof typeof statusTransitions,
        targetStatus: transition.targetStatus,
      });
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : "Could not update this order.");
    } finally {
      setTransitionPending(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selected || !onMarkOrderPaid || paymentPending || selected.paid >= selected.total) return;
    setPaymentPending(true);
    setPaymentError("");
    try {
      await onMarkOrderPaid(selected);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Could not update this payment.");
    } finally {
      setPaymentPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 lg:pb-10">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#2F2925]">Orders</h1>
          <p className="mt-0.5 text-xs font-semibold text-[#6F655E]">{viewCounts.current} current orders</p>
        </div>
        <button type="button" onClick={onAddOrder} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#7A3E24] px-3.5 text-sm font-bold text-white transition-colors hover:bg-[#934E2E]">
          <Plus aria-hidden="true" size={14} /> New Order
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-start lg:gap-5">
        <section aria-label="Orders queue" className={selected ? "hidden lg:block" : "block"}>
          <div className="space-y-4">
            <OrdersViewTabs value={primaryView} counts={viewCounts} onChange={selectPrimaryView} />
            {primaryView === "current" && !secondaryStatus && (
              <CurrentWorkflowSummary counts={currentCounts} selected={stage} onSelect={setStage} />
            )}
            <OrderSecondaryFilters
              search={search}
              paymentStatus={paymentStatus}
              secondaryStatus={secondaryStatus}
              products={products}
              selectedProduct={selectedProduct}
              onSearchChange={setSearch}
              onPaymentChange={setPaymentStatus}
              onStatusChange={selectSecondaryStatus}
              onProductChange={setSelectedProduct}
            />
          </div>

          <div aria-live="polite" className="mt-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#988D84]">
              {secondaryStatus
                ? `${secondaryStatus} orders (${presentedOrders.length})`
                : `${primaryView} orders (${presentedOrders.length})`}
            </p>
            {presentedOrders.map(order => (
              <WorkflowOrderCard
                key={order.id}
                order={order}
                now={now}
                quiet={primaryView === "completed" && !secondaryStatus}
                onOpen={() => openOrder(order)}
              />
            ))}
            {presentedOrders.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-[#D8CEC3] bg-white py-10 text-center text-sm text-[#988D84]">
                No orders match these filters.
              </p>
            )}
          </div>
        </section>

        <aside aria-label="Order detail" className={selected ? "block lg:sticky lg:top-6" : "hidden lg:block lg:sticky lg:top-6"}>
          {selected ? (
            <OrderDetail
              order={selected}
              tasks={selectedTasks}
              now={now}
              transition={transition}
              transitionPending={transitionPending}
              transitionError={transitionError}
              transitionDisabled={!onTransitionOrder}
              paymentPending={paymentPending}
              paymentError={paymentError}
              paymentDisabled={!onMarkOrderPaid}
              onBack={closeDetail}
              onTransition={handleTransition}
              onMarkPaid={handleMarkPaid}
            />
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#D8CEC3] bg-white p-8 text-center">
              <p className="text-sm font-bold text-[#2F2925]">Select an order</p>
              <p className="mt-1 text-xs text-[#6F655E]">Its pickup, payment, production, and next action will appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function OrderDetail({ order, tasks, now, transition, transitionPending, transitionError, transitionDisabled, paymentPending, paymentError, paymentDisabled, onBack, onTransition, onMarkPaid }: {
  order: Order;
  tasks: readonly Task[];
  now: Date;
  transition: (typeof statusTransitions)[keyof typeof statusTransitions] | undefined;
  transitionPending: boolean;
  transitionError: string;
  transitionDisabled: boolean;
  paymentPending: boolean;
  paymentError: string;
  paymentDisabled: boolean;
  onBack: () => void;
  onTransition: () => void;
  onMarkPaid: () => void;
}) {
  const hasLifecycle = order.status !== "draft" && order.status !== "cancelled";

  return (
    <div className="rounded-[16px] border border-[#E5DDD3] bg-[#FBF8F4] p-4 shadow-sm sm:p-5">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#7A3E24] hover:underline lg:hidden">
        <ArrowLeft aria-hidden="true" size={16} /> Back to orders
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-['DM_Mono',monospace] text-[11px] text-[#988D84]">{order.id}</p>
          <h2 className="mt-0.5 truncate text-xl font-extrabold text-[#2F2925]">{order.customer}</h2>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS[order.status].textCls} ${ORDER_STATUS[order.status].bgCls}`}>
          {ORDER_STATUS[order.status].label}
        </span>
      </div>

      {hasLifecycle ? (
        <div className="mt-5 rounded-[12px] border border-[#E5DDD3] bg-white p-4">
          <OrderLifecycle status={order.status} />
        </div>
      ) : (
        <p className="mt-4 rounded-[12px] border border-[#E5DDD3] bg-white p-3 text-sm font-semibold text-[#6F655E]">
          {order.status === "draft" ? "This draft has not entered the order lifecycle." : "This order was cancelled and has no next lifecycle action."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PickupSummary order={order} now={now} />
        <PaymentSummary order={order} pending={paymentPending} error={paymentError} disabled={paymentDisabled} onMarkPaid={onMarkPaid} />
      </div>

      <section aria-labelledby="order-items-heading" className="mt-4 rounded-[12px] border border-[#E5DDD3] bg-white p-4">
        <h3 id="order-items-heading" className="text-xs font-bold uppercase tracking-wide text-[#988D84]">Order items</h3>
        <ul className="mt-2 divide-y divide-[#F0E9E0]">
          {order.items.map((item, index) => (
            <li key={`${item.product}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-[#2F2925]">{item.qty}× {item.product}</span>
              <span className="font-bold text-[#2F2925]">${(item.qty * item.price).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        {order.notes && <p className="mt-3 border-t border-[#F0E9E0] pt-3 text-xs italic text-[#6F655E]">Notes: {order.notes}</p>}
      </section>

      <div className="mt-4 space-y-3">
        <ProductionProgress tasks={tasks} />
        {tasks.length > 0 && <ProductionTaskHistory tasks={tasks} />}
      </div>

      <div className="mt-4">
        <NextActionArea
          label={transition?.label}
          description={transition?.description}
          pending={transitionPending}
          error={transitionError}
          disabled={transitionDisabled}
          onAction={onTransition}
        />
      </div>
    </div>
  );
}
