import { describe, expect, it } from "vitest";
import { DEFAULT_FLOWS } from "../../production";
import {
  formatFlowStepSchedule,
  hasFlowBuilderErrors,
  validateFlowDraft,
} from "./productionFlowBuilderModel";

describe("production flow builder model", () => {
  it("turns pickup-relative values into a baker-facing schedule summary", () => {
    expect(formatFlowStepSchedule({ dayOffset: -1, time: "14:00", duration: 20 })).toBe(
      "1 day before pickup at 2:00 PM · about 20 min",
    );
    expect(formatFlowStepSchedule({ dayOffset: 0, time: "09:30", duration: 35 })).toBe(
      "pickup day at 9:30 AM · about 35 min",
    );
  });

  it("accepts a valid default flow", () => {
    const flow = DEFAULT_FLOWS[0];
    expect(hasFlowBuilderErrors(validateFlowDraft(flow.name, flow.steps))).toBe(false);
  });

  it("finds missing, disabled, self, and circular dependencies", () => {
    const steps = [
      { id: "a", name: "A", instructions: "Do A", dayOffset: -1, time: "09:00", duration: 15, category: "prep", enabled: true, dependsOn: "b" },
      { id: "b", name: "B", instructions: "Do B", dayOffset: -1, time: "10:00", duration: 15, category: "mixing", enabled: true, dependsOn: "a" },
      { id: "c", name: "C", instructions: "Do C", dayOffset: 0, time: "11:00", duration: 15, category: "baking", enabled: true, dependsOn: "missing" },
      { id: "d", name: "D", instructions: "Do D", dayOffset: 0, time: "12:00", duration: 15, category: "packaging", enabled: true, dependsOn: "d" },
      { id: "e", name: "E", instructions: "Do E", dayOffset: 0, time: "13:00", duration: 15, category: "packaging", enabled: false },
      { id: "f", name: "F", instructions: "Do F", dayOffset: 0, time: "13:30", duration: 15, category: "packaging", enabled: true, dependsOn: "e" },
    ];

    const validation = validateFlowDraft("Test Flow", steps);
    expect(validation.steps.a).toContain("Remove the circular dependency before saving.");
    expect(validation.steps.b).toContain("Remove the circular dependency before saving.");
    expect(validation.steps.c).toContain("Choose an existing prerequisite step.");
    expect(validation.steps.d).toContain("A step cannot depend on itself.");
    expect(validation.steps.f).toContain("Choose an enabled prerequisite or enable the prerequisite first.");
  });

  it("requires instructions and at least one enabled step", () => {
    const validation = validateFlowDraft("", [
      { id: "step", name: "", instructions: "", dayOffset: -1, time: "invalid", duration: 0, category: "prep", enabled: false },
    ]);

    expect(validation.flow).toEqual([
      "Give this flow a name before saving.",
      "Keep at least one step enabled before saving.",
    ]);
    expect(validation.steps.step).toEqual([
      "Choose a valid time.",
      "Duration must be more than 0 minutes.",
    ]);
  });
});
