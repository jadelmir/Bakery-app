import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrdersScreen, type OrderStatusTransition } from "./OrdersScreen";
import type { Order, Task } from "../types";

afterEach(cleanup);

const NOW = new Date(2026, 7, 3, 9, 0);

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-confirmed",
    customer: "Confirmed Customer",
    items: [{ product: "Sourdough Loaf", qty: 1, price: 14 }],
    pickup: "2026-08-03",
    pickupTime: "10:00",
    status: "confirmed",
    total: 14,
    paid: 0,
    paymentStatus: "unpaid",
    ...overrides,
  };
}

const orders: Order[] = [
  order(),
  order({ id: "order-production", customer: "Production Customer", status: "in-production", pickupTime: "11:00" }),
  order({ id: "order-ready", customer: "Ready Customer", status: "ready", pickupTime: "12:00", paid: 14, paymentStatus: "paid" }),
  order({ id: "order-completed", customer: "Completed Customer", status: "completed", pickup: "2026-08-02", pickupTime: "09:00", paid: 14, paymentStatus: "paid" }),
  order({ id: "order-draft", customer: "Draft Customer", status: "draft", pickup: "2026-08-05" }),
  order({ id: "order-cancelled", customer: "Cancelled Customer", status: "cancelled", pickup: "2026-08-06" }),
];

function renderOrders(overrides: Partial<React.ComponentProps<typeof OrdersScreen>> = {}) {
  const props: React.ComponentProps<typeof OrdersScreen> = {
    onAddOrder: vi.fn(),
    onTransitionOrder: vi.fn(async (current: Order, next: OrderStatusTransition) => ({ ...current, status: next.targetStatus })),
    onMarkOrderPaid: vi.fn(async (current: Order) => ({ ...current, paid: current.total, paymentStatus: "paid" })),
    tasks: [],
    orders,
    now: NOW,
    ...overrides,
  };
  render(<OrdersScreen {...props} />);
  return props;
}

function openOrder(id: string, customer: string) {
  fireEvent.click(screen.getByRole("button", { name: `Open order ${id} for ${customer}` }));
}

describe("OrdersScreen workflow queue", () => {
  it("defaults to Current and excludes completed and secondary records", () => {
    renderOrders();

    expect(screen.getByRole("tab", { name: /Current/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Completed/ })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("button", { name: /Open order order-confirmed/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Open order order-production/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Open order order-ready/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order order-completed/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Draft Customer")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled Customer")).not.toBeInTheDocument();
  });

  it("shows completed orders only in the Completed view", () => {
    renderOrders();
    fireEvent.click(screen.getByRole("tab", { name: /Completed/ }));

    expect(screen.getByRole("tab", { name: /Completed/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Open order order-completed/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order order-confirmed/ })).not.toBeInTheDocument();
  });

  it("shows current stage counts and filters the queue by the pressed stage", () => {
    renderOrders();
    const stages = screen.getByLabelText("Current order stages");

    expect(within(stages).getByRole("button", { name: /Confirmed/ })).toHaveTextContent("1");
    expect(within(stages).getByRole("button", { name: /In Production/ })).toHaveTextContent("1");
    const ready = within(stages).getByRole("button", { name: /Ready for Pickup/ });
    expect(ready).toHaveTextContent("1");

    fireEvent.click(ready);
    expect(ready).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Open order order-ready/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order order-confirmed/ })).not.toBeInTheDocument();
  });

  it("sorts the current queue newest-first by creation timestamp", () => {
    renderOrders({
      orders: [
        order({ id: "later", customer: "Later", pickup: "2026-08-04", pickupTime: "09:00", createdAt: "2026-08-03T15:00:00.000Z" }),
        order({ id: "overdue", customer: "Overdue", pickup: "2026-08-03", pickupTime: "08:00", createdAt: "2026-08-03T14:00:00.000Z" }),
        order({ id: "next", customer: "Next", pickup: "2026-08-03", pickupTime: "10:00", createdAt: "2026-08-03T13:00:00.000Z" }),
      ],
    });

    expect(screen.getAllByRole("button", { name: /^Open order/ }).map(button => button.getAttribute("aria-label"))).toEqual([
      "Open order later for Later",
      "Open order overdue for Overdue",
      "Open order next for Next",
    ]);
  });

  it("combines search, payment, and product filters", () => {
    renderOrders({
      orders: [
        order({ id: "bread-unpaid", customer: "Amina", items: [{ product: "Sourdough Loaf", qty: 1, price: 14 }] }),
        order({ id: "cake-paid", customer: "Noah", items: [{ product: "Chocolate Cake", qty: 1, price: 30 }], total: 30, paid: 30, paymentStatus: "paid" }),
      ],
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Search orders" }), { target: { value: "Amina" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Payment" }), { target: { value: "balance-due" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Product" }), { target: { value: "Sourdough Loaf" } });

    expect(screen.getByRole("button", { name: /Open order bread-unpaid/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order cake-paid/ })).not.toBeInTheDocument();
  });

  it("keeps draft and cancelled records accessible through the secondary status filter", () => {
    renderOrders();
    const recordStatus = screen.getByRole("combobox", { name: "Record status" });

    fireEvent.change(recordStatus, { target: { value: "draft" } });
    expect(screen.getByRole("button", { name: /Open order order-draft/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order order-confirmed/ })).not.toBeInTheDocument();

    fireEvent.change(recordStatus, { target: { value: "cancelled" } });
    expect(screen.getByRole("button", { name: /Open order order-cancelled/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Open order order-draft/ })).not.toBeInTheDocument();
  });

  it("shows lifecycle, summaries, items, notes, compact progress, and task history in detail", () => {
    const task: Task = {
      id: "task-1",
      orderId: "order-production",
      time: "9:00 AM",
      title: "Shape dough",
      product: "Sourdough Loaf",
      instructions: "Shape",
      status: "pending",
      category: "shaping",
      duration: 15,
    };
    renderOrders({ tasks: [task], orders: orders.map(item => item.id === "order-production" ? { ...item, notes: "Use seeded loaf." } : item) });
    openOrder("order-production", "Production Customer");

    expect(screen.getByRole("complementary", { name: "Order detail" })).toBeVisible();
    expect(screen.getByRole("list", { name: /Order lifecycle. Current status: In Production/ })).toBeVisible();
    expect(screen.getByRole("region", { name: "Pickup summary" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Payment summary" })).toBeVisible();
    expect(screen.getByText("Notes: Use seeded loaf.")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Production tasks completed" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("View task history")).toBeVisible();
    expect(screen.getByRole("button", { name: "Back to orders" })).toBeVisible();
  });

  it.each([
    ["confirmed", "Start Production", "in-production"],
    ["in-production", "Mark Ready", "ready"],
    ["ready", "Mark Completed", "completed"],
  ] as const)("offers %s exactly the %s lifecycle action", (status, label, targetStatus) => {
    const transition = vi.fn(async (current: Order, next: OrderStatusTransition) => ({ ...current, status: next.targetStatus }));
    const current = order({ id: `order-${status}`, customer: `${status} customer`, status });
    renderOrders({ orders: [current], onTransitionOrder: transition });
    openOrder(current.id, current.customer);

    const lifecycleActions = screen.getAllByRole("button", { name: /Start Production|Mark Ready|Mark Completed/ });
    expect(lifecycleActions).toHaveLength(1);
    expect(lifecycleActions[0]).toHaveAccessibleName(label);
    fireEvent.click(lifecycleActions[0]);
    expect(transition).toHaveBeenCalledWith(current, { expectedStatus: status, targetStatus });
  });

  it.each(["completed", "cancelled", "draft"] as const)("does not offer a lifecycle action for %s orders", status => {
    const current = order({ id: `order-${status}`, customer: `${status} customer`, status });
    renderOrders({ orders: [current] });
    if (status === "completed") {
      fireEvent.click(screen.getByRole("tab", { name: /Completed/ }));
    } else {
      fireEvent.change(screen.getByRole("combobox", { name: "Record status" }), { target: { value: status } });
    }
    openOrder(current.id, current.customer);

    expect(screen.queryByRole("button", { name: /Start Production|Mark Ready|Mark Completed/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Order action")).toHaveTextContent("No further lifecycle action is needed.");
  });

  it("shows a pending state and prevents duplicate transitions", () => {
    let resolveTransition: ((updated: Order) => void) | undefined;
    const transition = vi.fn(() => new Promise<Order>(resolve => { resolveTransition = resolve; }));
    const current = order();
    renderOrders({ orders: [current], onTransitionOrder: transition });
    openOrder(current.id, current.customer);

    fireEvent.click(screen.getByRole("button", { name: "Start Production" }));
    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Updating…" }));
    expect(transition).toHaveBeenCalledOnce();
    resolveTransition?.({ ...current, status: "in-production" });
  });

  it("retains the previous status and supports retry after a failed transition", async () => {
    const transition = vi.fn()
      .mockRejectedValueOnce(new Error("Status update failed"))
      .mockResolvedValueOnce({ ...order(), status: "in-production" });
    renderOrders({ orders: [order()], onTransitionOrder: transition });
    openOrder("order-confirmed", "Confirmed Customer");

    fireEvent.click(screen.getByRole("button", { name: "Start Production" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Status update failed");
    expect(screen.getByRole("list", { name: /Current status: Confirmed/ })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Start Production" }));
    await waitFor(() => expect(transition).toHaveBeenCalledTimes(2));
  });

  it("waits for the authoritative parent refresh before showing the next action", async () => {
    function AuthoritativeOrders() {
      const [currentOrders, setCurrentOrders] = useState<Order[]>([order()]);
      return <OrdersScreen now={NOW} onAddOrder={vi.fn()} tasks={[]} orders={currentOrders} onTransitionOrder={async (current, next) => {
        const updated = { ...current, status: next.targetStatus } as Order;
        setCurrentOrders([updated]);
        return updated;
      }} />;
    }

    render(<AuthoritativeOrders />);
    openOrder("order-confirmed", "Confirmed Customer");
    fireEvent.click(screen.getByRole("button", { name: "Start Production" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Mark Ready" })).toBeVisible());
    expect(screen.getByRole("list", { name: /Current status: In Production/ })).toBeVisible();
  });

  it("marks the full balance paid after the authoritative parent refresh", async () => {
    function PayableOrders() {
      const [currentOrders, setCurrentOrders] = useState<Order[]>([order({ paid: 4, paymentStatus: "partially-paid" })]);
      return <OrdersScreen now={NOW} onAddOrder={vi.fn()} tasks={[]} orders={currentOrders} onMarkOrderPaid={async current => {
        const updated = { ...current, paid: current.total, paymentStatus: "paid" } as Order;
        setCurrentOrders([updated]);
        return updated;
      }} />;
    }

    render(<PayableOrders />);
    openOrder("order-confirmed", "Confirmed Customer");
    expect(screen.getByRole("region", { name: "Payment summary" })).toHaveTextContent("$10.00 due");
    fireEvent.click(screen.getByRole("button", { name: "Mark as Paid" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Payment summary" })).toHaveTextContent("Paid in full"));
    expect(screen.queryByRole("button", { name: "Mark as Paid" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: /Current status: Confirmed/ })).toBeVisible();
  });

  it("keeps the balance and supports retry when payment persistence fails", async () => {
    const markPaid = vi.fn().mockRejectedValueOnce(new Error("Payment update failed"));
    renderOrders({ orders: [order({ paid: 4, paymentStatus: "partially-paid" })], onMarkOrderPaid: markPaid });
    openOrder("order-confirmed", "Confirmed Customer");

    fireEvent.click(screen.getByRole("button", { name: "Mark as Paid" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Payment update failed");
    expect(screen.getByRole("region", { name: "Payment summary" })).toHaveTextContent("$10.00 due");
  });

  it("requires confirmation and closes detail after an authoritative delete", async () => {
    function DeletableOrders() {
      const [currentOrders, setCurrentOrders] = useState<Order[]>([order()]);
      return <OrdersScreen now={NOW} onAddOrder={vi.fn()} tasks={[]} orders={currentOrders} onDeleteOrder={async current => {
        setCurrentOrders(existing => existing.filter(item => item.id !== current.id));
      }} />;
    }

    render(<DeletableOrders />);
    openOrder("order-confirmed", "Confirmed Customer");
    fireEvent.click(screen.getByRole("button", { name: "Delete order" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete this order?" });
    expect(dialog).toHaveTextContent("permanently remove Confirmed Customer's order");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("complementary", { name: "Order detail" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Delete order" }));
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Delete this order?" })).getByRole("button", { name: "Delete order" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Open order order-confirmed/ })).not.toBeInTheDocument());
    expect(screen.getByText("No orders match these filters.")).toBeVisible();
  });

  it("keeps order detail open and supports retry when deletion fails", async () => {
    const onDeleteOrder = vi.fn()
      .mockRejectedValueOnce(new Error("Delete failed"))
      .mockResolvedValueOnce(undefined);
    renderOrders({ onDeleteOrder });
    openOrder("order-confirmed", "Confirmed Customer");

    fireEvent.click(screen.getByRole("button", { name: "Delete order" }));
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Delete this order?" })).getByRole("button", { name: "Delete order" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Delete failed");
    expect(screen.getByRole("complementary", { name: "Order detail" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Delete order" }));
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Delete this order?" })).getByRole("button", { name: "Delete order" }));
    await waitFor(() => expect(onDeleteOrder).toHaveBeenCalledTimes(2));
  });

  it("moves an authoritatively completed order from Current to Completed", async () => {
    function CompletingOrders() {
      const [currentOrders, setCurrentOrders] = useState<Order[]>([
        order({ id: "ready-to-complete", customer: "Pickup Customer", status: "ready" }),
        order({ id: "still-current", customer: "Still Current" }),
      ]);
      return <OrdersScreen now={NOW} onAddOrder={vi.fn()} tasks={[]} orders={currentOrders} onTransitionOrder={async (current, next) => {
        const updated = { ...current, status: next.targetStatus } as Order;
        setCurrentOrders(existing => existing.map(item => item.id === updated.id ? updated : item));
        return updated;
      }} />;
    }

    render(<CompletingOrders />);
    openOrder("ready-to-complete", "Pickup Customer");
    fireEvent.click(screen.getByRole("button", { name: "Mark Completed" }));
    await waitFor(() => expect(screen.getByRole("list", { name: /Current status: Completed/ })).toBeVisible());
    expect(screen.queryByRole("button", { name: /Start Production|Mark Ready|Mark Completed/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to orders" }));
    expect(screen.queryByRole("button", { name: /Open order ready-to-complete/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Current/ })).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("tab", { name: /Completed/ }));
    expect(screen.getByRole("button", { name: /Open order ready-to-complete/ })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Completed/ })).toHaveTextContent("1");
  });

  it("keeps New Order behavior and mobile back navigation available", () => {
    const onAddOrder = vi.fn();
    renderOrders({ onAddOrder });
    fireEvent.click(screen.getByRole("button", { name: "New Order" }));
    expect(onAddOrder).toHaveBeenCalledOnce();

    openOrder("order-confirmed", "Confirmed Customer");
    fireEvent.click(screen.getByRole("button", { name: "Back to orders" }));
    expect(screen.queryByText("Order lifecycle. Current status: Confirmed")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Orders queue" })).toBeVisible();
  });
});
