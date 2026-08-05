import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductionTimelineBlock } from "../../productionTimeline";
import type { Task } from "../../types";
import { ProductionTimeBlock } from "./ProductionTimeBlock";

const tasks: Task[] = [
  { id: "loaves", time: "8:00 AM", title: "Feed starter", product: "Sourdough Loaf", quantity: 10, instructions: "Feed the starter.", status: "pending", category: "starter", duration: 10, scheduledAt: "2026-08-03T12:00:00.000Z", flowStepId: "build-starter" },
  { id: "focaccia", time: "8:00 AM", title: "Feed starter", product: "Focaccia", quantity: 5, instructions: "Feed the focaccia starter.", status: "completed", category: "starter", duration: 10, scheduledAt: "2026-08-03T12:00:00.000Z", flowStepId: "build-starter" },
];

function block(overrides: Partial<ProductionTimelineBlock> = {}): ProductionTimelineBlock {
  return {
    id: "starter-block",
    selectedDay: "2026-08-03",
    scheduledAt: "2026-08-03T12:00:00.000Z",
    scheduledMinute: 0,
    flowStepIdentity: "build-starter",
    title: "Feed starter",
    category: "starter",
    tasks,
    taskIds: tasks.map(task => task.id),
    productLines: [
      { product: "Sourdough Loaf", quantity: 10, taskIds: ["loaves"], taskCount: 1 },
      { product: "Focaccia", quantity: 5, taskIds: ["focaccia"], taskCount: 1 },
    ],
    progress: { total: 2, completed: 1, skipped: 0, cancelled: 0, active: 1 },
    status: "mixed",
    activeTaskIds: ["loaves"],
    starterBuild: {
      id: "starter", profileId: "earl", peakWindow: "2026-08-03T12", contributors: [],
      recommended: { seedAmount: 100, flourAmount: 300, waterAmount: 300, retainedAmount: 40 },
      seedAmount: 100, flourAmount: 300, waterAmount: 300, retainedAmount: 40,
      usableAmount: 660, totalAmount: 700, insufficientSeed: false,
    },
    ...overrides,
  };
}

function renderBlock(overrides: Partial<React.ComponentProps<typeof ProductionTimeBlock>> = {}) {
  const callbacks = {
    onCompleteBlock: vi.fn(),
    onTaskComplete: vi.fn(),
    onTaskStartTimer: vi.fn(),
    onTaskPauseTimer: vi.fn(),
    onTaskDelay: vi.fn(),
    onTaskSkip: vi.fn(),
    onTaskUpdate: vi.fn(),
  };
  render(<ProductionTimeBlock block={block()} allTasks={tasks} {...callbacks} {...overrides} />);
  return callbacks;
}

afterEach(cleanup);

describe("ProductionTimeBlock", () => {
  it("shows grouped product quantities, progress, and starter preparation", () => {
    renderBlock();

    expect(screen.getByText("10")).toBeVisible();
    expect(screen.getByText("Sourdough Loaf")).toBeVisible();
    expect(screen.getByText("5")).toBeVisible();
    expect(screen.getByText("Focaccia")).toBeVisible();
    expect(screen.getByText("Partially complete")).toBeVisible();
    expect(screen.getByLabelText("Progress: 1 of 2 completed")).toBeVisible();
    expect(screen.getByText(/100g seed \+ 300g flour \+ 300g water/)).toBeVisible();
  });

  it("passes only active task ids to grouped completion", () => {
    const { onCompleteBlock } = renderBlock();

    fireEvent.click(screen.getByRole("button", { name: "Complete task" }));
    expect(onCompleteBlock).toHaveBeenCalledWith(["loaves"]);
  });

  it("does not offer grouped completion after all work is inactive", () => {
    renderBlock({ block: block({ activeTaskIds: [], progress: { total: 2, completed: 2, skipped: 0, cancelled: 0, active: 0 }, status: "completed" }) });

    expect(screen.queryByRole("button", { name: /Complete/ })).not.toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeVisible();
  });

  it("reveals existing task-level exception controls and starter details", () => {
    const { onTaskStartTimer, onTaskSkip } = renderBlock();

    fireEvent.click(screen.getByRole("button", { name: "Show task details" }));
    expect(screen.getByText("Retain 40g · total build 700g")).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: /Start Timer/ })[0]);
    expect(onTaskStartTimer).toHaveBeenCalledWith("loaves");
    fireEvent.click(screen.getAllByRole("button", { name: "Skip" })[0]);
    expect(screen.getByText("Record Skip Reason")).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText("Reason required"), { target: { value: "Out of flour" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Skip" }));
    expect(onTaskSkip).toHaveBeenCalledWith("loaves", "Out of flour");
  });
});
