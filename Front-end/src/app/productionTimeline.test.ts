import { describe, expect, it } from "vitest";
import type { StarterBuild } from "./planning";
import type { ProductionTask } from "./production";
import { deriveProductionTimeline } from "./productionTimeline";

const task = (overrides: Partial<ProductionTask> = {}): ProductionTask => ({
  id: "task-1",
  orderId: "order-1",
  orderItemId: "item-1",
  flowId: "flow-sourdough",
  flowStepId: "build-starter",
  title: "Build Starter",
  product: "Sourdough Loaf",
  quantity: 10,
  scheduledAt: "2026-08-03T08:00:00.000Z",
  status: "pending",
  instructions: "Build starter.",
  category: "starter",
  duration: 15,
  ...overrides,
});

const starterBuild: StarterBuild = {
  id: "earl:2026-08-03T08",
  profileId: "earl",
  peakWindow: "2026-08-03T08",
  contributors: [
    { orderId: "order-1", orderItemId: "item-1", product: "Sourdough Loaf", usableAmount: 1000 },
    { orderId: "order-2", orderItemId: "item-2", product: "Focaccia", usableAmount: 1000 },
  ],
  recommended: { seedAmount: 100, flourAmount: 300, waterAmount: 300, retainedAmount: 40 },
  seedAmount: 100,
  flourAmount: 300,
  waterAmount: 300,
  retainedAmount: 40,
  usableAmount: 660,
  totalAmount: 700,
  insufficientSeed: false,
};

describe("deriveProductionTimeline", () => {
  it("groups matching day, minute, and flow step while aggregating product quantities", () => {
    const timeline = deriveProductionTimeline([
      task(),
      task({ id: "task-2", orderId: "order-2", orderItemId: "item-2", product: "Focaccia", quantity: 5 }),
      task({ id: "task-3", orderId: "order-3", orderItemId: "item-3", product: "Sourdough Loaf", quantity: 2 }),
    ], "2026-08-03");

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ taskIds: ["task-1", "task-2", "task-3"], progress: { total: 3, active: 3 } });
    expect(timeline[0].productLines).toEqual([
      { product: "Sourdough Loaf", quantity: 12, taskIds: ["task-1", "task-3"], taskCount: 2 },
      { product: "Focaccia", quantity: 5, taskIds: ["task-2"], taskCount: 1 },
    ]);
  });

  it("keeps distinct flow steps separate at the same scheduled minute", () => {
    const timeline = deriveProductionTimeline([
      task(),
      task({ id: "task-mix", flowStepId: "mix", title: "Mix Dough", category: "mixing" }),
    ], "2026-08-03");

    expect(timeline).toHaveLength(2);
    expect(timeline.map(block => block.flowStepIdentity)).toEqual(["build-starter", "mix"]);
  });

  it("derives mixed progress and leaves only active task ids actionable", () => {
    const timeline = deriveProductionTimeline([
      task({ status: "completed" }),
      task({ id: "task-in-progress", status: "in-progress" }),
      task({ id: "task-skipped", status: "skipped" }),
      task({ id: "task-cancelled", status: "cancelled" }),
    ], "2026-08-03");

    expect(timeline[0]).toMatchObject({
      status: "mixed",
      progress: { total: 4, completed: 1, skipped: 1, cancelled: 1, active: 1 },
      activeTaskIds: ["task-in-progress"],
    });
  });

  it("attaches the compatible starter build and retains its contributors", () => {
    const timeline = deriveProductionTimeline([
      task(),
      task({ id: "tomorrow", scheduledAt: "2026-08-04T08:00:00.000Z" }),
    ], "2026-08-03", [starterBuild]);

    expect(timeline[0].starterBuild).toBe(starterBuild);
    expect(timeline[0].starterBuild?.contributors).toEqual(starterBuild.contributors);
    expect(timeline[0].starterBuild?.usableAmount).toBe(660);
  });

  it("filters to the selected day and returns blocks in stable chronological order", () => {
    const timeline = deriveProductionTimeline([
      task({ id: "late", flowStepId: "bake", title: "Bake", category: "baking", scheduledAt: "2026-08-03T14:00:00.000Z" }),
      task({ id: "other-day", scheduledAt: "2026-08-04T07:00:00.000Z" }),
      task({ id: "early", flowStepId: "mix", title: "Mix", category: "mixing", scheduledAt: "2026-08-03T07:00:00.000Z" }),
      task({ id: "same-time-later-step", flowStepId: "shape", title: "Shape", category: "shaping", scheduledAt: "2026-08-03T07:00:00.000Z" }),
    ], "2026-08-03");

    expect(timeline.map(block => block.taskIds[0])).toEqual(["early", "same-time-later-step", "late"]);
  });

  it("uses the bakery timezone for selected-day filtering and minute grouping", () => {
    const timeline = deriveProductionTimeline([
      task({ id: "new-york-late", scheduledAt: "2026-08-04T03:30:00.000Z" }),
      task({ id: "new-york-same-minute", scheduledAt: "2026-08-04T03:30:45.000Z", quantity: 5 }),
      task({ id: "new-york-next-day", scheduledAt: "2026-08-04T04:00:00.000Z" }),
    ], "2026-08-03");

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({ taskIds: ["new-york-late", "new-york-same-minute"] });
    expect(timeline[0].id).toContain("2026-08-03T23:30:build-starter");
  });
});
