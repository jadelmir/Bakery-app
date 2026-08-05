import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateTaskElapsedSeconds } from "./components/production/TaskExecutionCard";
import { calculateTaskDependencyStatus, DEFAULT_FLOWS, generatePlan, regenerateFutureTasks } from "./production";
import { ProductionScreen } from "./screens/ProductionScreen";
import type { Task } from "./types";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("production planning", () => {
  const order = { id: "o1", pickupDate: "2026-08-07", pickupTime: "14:00", items: [{ product: "Sourdough Loaf", qty: 2 }, { product: "Focaccia", qty: 1 }] };
  it("seeds distinct default flows", () => { expect(DEFAULT_FLOWS[0].steps.some(s => s.name === "Shape Dough")).toBe(true); expect(DEFAULT_FLOWS[1].steps.some(s => s.name === "Transfer to Tray")).toBe(true); });
  it("generates deterministic traceable tasks", () => { const a = generatePlan(order); const b = generatePlan(order); expect(a.tasks).toEqual(b.tasks); expect(a.tasks[0]).toMatchObject({ orderId: "o1", flowId: expect.any(String), flowStepId: expect.any(String) }); });
  it("preserves terminal task history during regeneration", () => { const task = { ...generatePlan(order).tasks[0], status: "completed" as const }; expect(regenerateFutureTasks([task], order).find(t => t.id === task.id)?.status).toBe("completed"); });
  it("flags tasks scheduled after pickup without moving them", () => {
    const earlyPickup = generatePlan({ ...order, pickupTime: "09:00" });
    expect(earlyPickup.warnings.length).toBeGreaterThan(0);
    expect(earlyPickup.tasks.some(task => task.scheduledAt.endsWith("17:00:00.000Z"))).toBe(true);
  });
  it("does not duplicate unchanged future tasks during regeneration", () => {
    const existing = generatePlan(order).tasks;
    const regenerated = regenerateFutureTasks(existing, order);
    expect(new Set(regenerated.map(task => task.id)).size).toBe(regenerated.length);
    expect(regenerated).toEqual(existing);
  });

  it("generates plan with custom flows and dynamic step dependency resolution", () => {
    const customFlow = {
      id: "flow-custom-brioche",
      name: "Custom Brioche Flow",
      recipe: "Brioche",
      steps: [
        { id: "s1", name: "Mix Dough", instructions: "Mix ingredients", dayOffset: -1, time: "10:00", duration: 20, category: "mixing", enabled: true },
        { id: "s2", name: "Proof", instructions: "Proof dough", dayOffset: -1, time: "12:00", duration: 60, category: "ferment", enabled: true, dependsOn: "s1" },
        { id: "s3", name: "Bake", instructions: "Bake brioche", dayOffset: 0, time: "08:00", duration: 30, category: "baking", enabled: true, dependsOn: "s2" },
      ],
    };

    const customOrder = {
      id: "o-brioche",
      pickupDate: "2026-08-10",
      pickupTime: "12:00",
      items: [{ product: "Brioche", qty: 5 }],
    };

    const res = generatePlan(customOrder, [customFlow]);
    expect(res.tasks).toHaveLength(3);
    const mixTask = res.tasks.find(t => t.flowStepId === "s1");
    const proofTask = res.tasks.find(t => t.flowStepId === "s2");
    const bakeTask = res.tasks.find(t => t.flowStepId === "s3");

    expect(mixTask?.dependencyIncomplete).toBe(false);
    expect(proofTask?.dependencyIncomplete).toBe(true);
    expect(bakeTask?.dependencyIncomplete).toBe(true);

    if (mixTask) {
      const existingWithCompletedMix = [{ ...mixTask, status: "completed" as const }];
      const res2 = generatePlan(customOrder, [customFlow], existingWithCompletedMix);
      const proofTask2 = res2.tasks.find(t => t.flowStepId === "s2");
      expect(proofTask2?.dependencyIncomplete).toBe(false);
    }
  });

  it("calculates prerequisite dependency status accurately", () => {
    const plan = generatePlan(order);
    const mixTask = plan.tasks.find(t => t.flowStepId === "mix" && t.product === "Sourdough Loaf")!;
    const shapeTask = plan.tasks.find(t => t.flowStepId === "shape" && t.product === "Sourdough Loaf")!;

    // When mixTask is pending, shapeTask is blocked
    const statusBlocked = calculateTaskDependencyStatus(shapeTask, plan.tasks, DEFAULT_FLOWS);
    expect(statusBlocked.isBlocked).toBe(true);
    expect(statusBlocked.pendingPrerequisiteName).toBe("Mix Dough");

    // When mixTask is completed, shapeTask is unblocked
    const updatedTasks = plan.tasks.map(t => t.id === mixTask.id ? { ...t, status: "completed" as const } : t);
    const statusUnblocked = calculateTaskDependencyStatus(shapeTask, updatedTasks, DEFAULT_FLOWS);
    expect(statusUnblocked.isBlocked).toBe(false);
  });

  it("derives running elapsed time from persisted timestamps", () => {
    expect(calculateTaskElapsedSeconds({
      id: "timer-1",
      time: "09:00",
      title: "Mix dough",
      product: "Sourdough Loaf",
      instructions: "Mix",
      status: "in-progress",
      category: "mixing",
      duration: 15,
      elapsedSeconds: 12,
      timerRunning: true,
      timerStartedAt: "2026-08-03T12:00:00.000Z",
    }, Date.parse("2026-08-03T12:01:30.000Z"))).toBe(102);
  });

  it("uses one shared screen ticker for multiple active task timers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T12:00:00.000Z"));
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    const activeTasks: Task[] = ["timer-1", "timer-2"].map((id, index) => ({
      id,
      time: `0${9 + index}:00`,
      title: `Active task ${index + 1}`,
      product: "Sourdough Loaf",
      instructions: "Work the dough",
      status: "in-progress",
      category: "mixing",
      duration: 15,
      scheduledAt: "2026-08-03T09:00:00.000Z",
      timerRunning: true,
      timerStartedAt: "2026-08-03T12:00:00.000Z",
    } as Task));

    render(createElement(ProductionScreen, {
      tasks: activeTasks,
      setTasks: vi.fn(),
      onTaskUpdate: vi.fn(),
      starterBuilds: [],
    }));

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });
});
