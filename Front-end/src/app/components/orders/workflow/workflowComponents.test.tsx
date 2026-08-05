import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order, Task } from "../../../types";
import { CurrentWorkflowSummary, OrdersViewTabs, WorkflowOrderCard } from "./OrdersOverview";
import { NextActionArea, OrderLifecycle, PaymentSummary, PickupSummary, ProductionProgress, ProductionTaskHistory } from "./OrderDetail";

afterEach(cleanup);

const order: Order = {
  id: "#024",
  customer: "Sarah Mitchell",
  items: [{ product: "Focaccia", qty: 2, price: 8 }],
  pickup: "2026-08-03",
  pickupTime: "08:00",
  status: "in-production",
  total: 16,
  paid: 4,
  paymentStatus: "partially-paid",
};

const tasks: Task[] = [
  { id: "t1", time: "8:00 AM", title: "Mix dough", product: "Focaccia", instructions: "Mix", status: "completed", category: "mixing", duration: 10 },
  { id: "t2", time: "9:00 AM", title: "Bake", product: "Focaccia", instructions: "Bake", status: "pending", category: "baking", duration: 30 },
];

describe("orders workflow components", () => {
  it("exposes named primary tabs and selected state", () => {
    const onChange = vi.fn();
    render(<OrdersViewTabs value="current" counts={{ current: 3, completed: 8 }} onChange={onChange} />);
    expect(screen.getByRole("tab", { name: /Current/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Completed/ })).toHaveAttribute("aria-selected", "false");
    fireEvent.click(screen.getByRole("tab", { name: /Completed/ }));
    expect(onChange).toHaveBeenCalledWith("completed");
  });

  it("exposes stage names, counts, and pressed state", () => {
    render(<CurrentWorkflowSummary counts={{ confirmed: 2, "in-production": 1, ready: 4 }} selected="ready" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Ready for Pickup/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Confirmed/ })).toHaveTextContent("2");
  });

  it("labels urgency, status, payment, balance, and card action in text", () => {
    render(<WorkflowOrderCard order={order} now={new Date(2026, 7, 3, 9, 0)} onOpen={vi.fn()} />);
    expect(screen.getByText(/Overdue:/)).toBeVisible();
    expect(screen.getByText("Status: In Production")).toBeVisible();
    expect(screen.getByText("Payment: Partially Paid")).toBeVisible();
    expect(screen.getByText("$12.00 due")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open order #024 for Sarah Mitchell" })).toBeVisible();
  });

  it("shows completed orders as fulfilled without overdue treatment", () => {
    const completedOrder: Order = { ...order, status: "completed" };
    render(<><WorkflowOrderCard order={completedOrder} now={new Date(2026, 7, 4, 9, 0)} onOpen={vi.fn()} /><PickupSummary order={completedOrder} now={new Date(2026, 7, 4, 9, 0)} /></>);
    expect(screen.getByRole("button", { name: "Open order #024 for Sarah Mitchell" })).toHaveTextContent("Fulfilled at 2026-08-03 at 08:00");
    expect(screen.getByRole("region", { name: "Fulfillment summary" })).toHaveTextContent("Fulfilled at 2026-08-03");
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it("communicates lifecycle, summaries, production progress, and task history accessibly", () => {
    render(<><OrderLifecycle status="in-production" /><div><PickupSummary order={order} now={new Date(2026, 7, 3, 9, 0)} /><PaymentSummary order={order} /></div><ProductionProgress tasks={tasks} /><ProductionTaskHistory tasks={tasks} /></>);
    expect(screen.getByRole("list", { name: "Order lifecycle. Current status: In Production" })).toBeVisible();
    expect(screen.getByText("In Production").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("region", { name: "Pickup summary" })).toHaveTextContent("Overdue");
    expect(screen.getByRole("region", { name: "Payment summary" })).toHaveTextContent("$12.00 due");
    expect(screen.getByRole("progressbar", { name: "Production tasks completed" })).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("Next: Bake")).toBeVisible();
    expect(screen.getByText("View task history")).toBeVisible();
  });

  it("offers a full-balance payment action only while money is due", () => {
    const onMarkPaid = vi.fn();
    const { rerender } = render(<PaymentSummary order={order} onMarkPaid={onMarkPaid} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark as Paid" }));
    expect(onMarkPaid).toHaveBeenCalledOnce();

    rerender(<PaymentSummary order={order} pending onMarkPaid={onMarkPaid} />);
    expect(screen.getByRole("button", { name: "Saving payment…" })).toBeDisabled();

    rerender(<PaymentSummary order={{ ...order, paid: order.total, paymentStatus: "paid" }} onMarkPaid={onMarkPaid} />);
    expect(screen.getByText("Paid in full")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mark as Paid" })).not.toBeInTheDocument();
  });

  it("provides a named next action, pending state, and retry message", () => {
    const onAction = vi.fn();
    const { rerender } = render(<NextActionArea label="Mark Ready" description="Production is finished." onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Ready" }));
    expect(onAction).toHaveBeenCalledOnce();
    rerender(<NextActionArea label="Mark Ready" pending error="Could not update the order." onAction={onAction} />);
    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not update the order. Try again.");
  });
});
