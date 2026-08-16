import type { FlowStep, ProductionFlow } from "../../production";

export type FlowBuilderValidation = {
  readonly flow: string[];
  readonly steps: Record<string, string[]>;
};

export function createFlowStepId(prefix = "step") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatClockTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value || "a time to be set";

  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function formatDayOffset(dayOffset: number) {
  if (dayOffset === 0) return "pickup day";
  const days = Math.abs(dayOffset);
  const unit = days === 1 ? "day" : "days";
  return dayOffset < 0 ? `${days} ${unit} before pickup` : `${days} ${unit} after pickup`;
}

export function formatFlowStepSchedule(step: Pick<FlowStep, "dayOffset" | "time" | "duration">) {
  const duration = Number.isFinite(step.duration) && step.duration > 0 ? ` · about ${step.duration} min` : "";
  return `${formatDayOffset(step.dayOffset)} at ${formatClockTime(step.time)}${duration}`;
}

export function getFlowDraftSignature(flowName: string, targetRecipe: string, steps: readonly FlowStep[]) {
  return JSON.stringify({ flowName, targetRecipe, steps });
}

export function normalizeFlowForSave(flow: ProductionFlow, flowName: string, targetRecipe: string, steps: readonly FlowStep[]): ProductionFlow {
  return {
    ...flow,
    name: flowName.trim(),
    recipe: targetRecipe.trim() || flow.recipe,
    steps: steps.map((step) => ({
      ...step,
      name: step.name.trim(),
      instructions: step.instructions.trim(),
      dependsOn: step.dependsOn || undefined,
    })),
  };
}

function addStepError(errors: FlowBuilderValidation, stepId: string, message: string) {
  errors.steps[stepId] ??= [];
  errors.steps[stepId].push(message);
}

function findDependencyCycles(steps: readonly FlowStep[]) {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleIds = new Set<string>();

  const visit = (stepId: string, path: string[]) => {
    if (visiting.has(stepId)) {
      const cycleStart = path.indexOf(stepId);
      path.slice(cycleStart === -1 ? 0 : cycleStart).forEach((id) => cycleIds.add(id));
      return;
    }
    if (visited.has(stepId)) return;

    visiting.add(stepId);
    const dependencyId = byId.get(stepId)?.dependsOn;
    if (dependencyId && byId.has(dependencyId)) visit(dependencyId, [...path, stepId]);
    visiting.delete(stepId);
    visited.add(stepId);
  };

  steps.forEach((step) => visit(step.id, []));
  return cycleIds;
}

export function validateFlowDraft(flowName: string, steps: readonly FlowStep[]): FlowBuilderValidation {
  const errors: FlowBuilderValidation = { flow: [], steps: {} };
  const stepIds = new Set(steps.map((step) => step.id));
  const enabledSteps = steps.filter((step) => step.enabled);

  if (!flowName.trim()) errors.flow.push("Give this flow a name before saving.");
  if (enabledSteps.length === 0) errors.flow.push("Keep at least one step enabled before saving.");

  steps.forEach((step) => {
    if (step.enabled && !step.name.trim()) addStepError(errors, step.id, "Add a name for this step.");
    if (step.enabled && !step.instructions.trim()) addStepError(errors, step.id, "Add instructions so the baker knows what to do.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(step.time)) addStepError(errors, step.id, "Choose a valid time.");
    if (!Number.isFinite(step.duration) || step.duration <= 0) addStepError(errors, step.id, "Duration must be more than 0 minutes.");

    if (step.dependsOn === step.id) addStepError(errors, step.id, "A step cannot depend on itself.");
    if (step.dependsOn && !stepIds.has(step.dependsOn)) addStepError(errors, step.id, "Choose an existing prerequisite step.");
    if (step.dependsOn && steps.find((candidate) => candidate.id === step.dependsOn)?.enabled === false) {
      addStepError(errors, step.id, "Choose an enabled prerequisite or enable the prerequisite first.");
    }
  });

  findDependencyCycles(steps).forEach((stepId) => addStepError(errors, stepId, "Remove the circular dependency before saving."));
  return errors;
}

export function hasFlowBuilderErrors(validation: FlowBuilderValidation) {
  return validation.flow.length > 0 || Object.values(validation.steps).some((messages) => messages.length > 0);
}
