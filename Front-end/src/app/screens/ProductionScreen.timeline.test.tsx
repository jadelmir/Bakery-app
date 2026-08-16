import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types";
import { ProductionScreen } from "./ProductionScreen";

const todayTasks: Task[] = [
  {
    id: "starter-loaves",
    time: "8:00 AM",
    title: "Build Starter",
    product: "Sourdough Loaf",
    quantity: 10,
    instructions: "Build starter for the loaves.",
    status: "pending",
    category: "starter",
    duration: 15,
    scheduledAt: "2026-08-03T12:00:00.000Z",
    flowId: "flow-sourdough",
    flowStepId: "build-starter",
  },
  {
    id: "starter-focaccia",
    time: "8:00 AM",
    title: "Build Starter",
    product: "Focaccia",
    quantity: 5,
    instructions: "Build starter for the focaccia.",
    status: "pending",
    category: "starter",
    duration: 15,
    scheduledAt: "2026-08-03T12:00:00.000Z",
    flowId: "flow-focaccia",
    flowStepId: "build-starter",
  },
  {
    id: "mix-loaves",
    time: "10:00 AM",
    title: "Mix Dough",
    product: "Sourdough Loaf",
    quantity: 10,
    instructions: "Mix the dough.",
    status: "pending",
    category: "mixing",
    duration: 20,
    scheduledAt: "2026-08-03T14:00:00.000Z",
    flowId: "flow-sourdough",
    flowStepId: "mix",
  },
];

function renderScreen(tasks = todayTasks) {
  const onTaskUpdate = vi.fn();
  render(
    <ProductionScreen
      tasks={tasks}
      setTasks={vi.fn()}
      onTaskUpdate={onTaskUpdate}
      starterBuilds={[]}
    />,
  );
  return onTaskUpdate;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ProductionScreen time-block timeline", () => {
  it("opens on Today with grouped chronological blocks and the pickup context", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T16:00:00.000Z"));
    renderScreen();

    expect(screen.getByRole("button", { name: "today" })).toHaveClass("bg-[#7A3E24]");
    const starterBlock = screen.getByRole("article", { name: /Build Starter production block/ });
    expect(within(starterBlock).getByText("10")).toBeVisible();
    expect(within(starterBlock).getByText("Sourdough Loaf")).toBeVisible();
    expect(within(starterBlock).getByText("5")).toBeVisible();
    expect(within(starterBlock).getByText("Focaccia")).toBeVisible();
    expect(screen.getByText("Pickup event")).toBeVisible();

    const timelineItems = screen.getAllByRole("article").map(item => item.textContent);
    expect(timelineItems).toEqual(expect.arrayContaining([
      expect.stringContaining("Build Starter"),
      expect.stringContaining("Mix Dough"),
      expect.stringContaining("Priya Nair"),
    ]));
    expect(timelineItems.findIndex(item => item?.includes("Build Starter"))).toBeLessThan(
      timelineItems.findIndex(item => item?.includes("Mix Dough")),
    );

    fireEvent.click(within(starterBlock).getByRole("button", { name: "Actions & notes" }));
    fireEvent.click(within(starterBlock).getAllByRole("button", { name: "Toggle details" })[0]);
    expect(within(starterBlock).getByText("Build starter for the loaves.")).toBeVisible();
  });

  it("keeps full block traceability for a category filter and completes every active task through the existing callback", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T16:00:00.000Z"));
    const onTaskUpdate = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "starter" }));
    expect(screen.getByText("Sourdough Loaf")).toBeVisible();
    expect(screen.getByText("Focaccia")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Complete 2 tasks" }));
    expect(onTaskUpdate).toHaveBeenCalledTimes(2);
    expect(onTaskUpdate).toHaveBeenNthCalledWith(1, "starter-loaves", { status: "completed", timerRunning: false });
    expect(onTaskUpdate).toHaveBeenNthCalledWith(2, "starter-focaccia", { status: "completed", timerRunning: false });
  });

  it("uses the same grouped timeline for Tomorrow and a selected Calendar day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T16:00:00.000Z"));
    renderScreen([
      ...todayTasks,
      {
        ...todayTasks[2],
        id: "tomorrow-mix",
        title: "Tomorrow Mix",
        scheduledAt: "2026-08-04T14:00:00.000Z",
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "tomorrow" }));
    expect(screen.getByText("Tomorrow Mix")).toBeVisible();
    expect(screen.queryByText("Build Starter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "calendar" }));
    fireEvent.change(screen.getByLabelText("Select production day"), { target: { value: "2026-08-03" } });
    expect(screen.getByText("Build Starter")).toBeVisible();
  });
});
