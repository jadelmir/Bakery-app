import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Clock,
  Copy,
  FileJson,
  GripVertical,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { FlowStep, ProductionFlow } from "../../production";
import {
  createFlowStepId,
  formatFlowStepSchedule,
  getFlowDraftSignature,
  hasFlowBuilderErrors,
  normalizeFlowForSave,
  type FlowBuilderValidation,
  validateFlowDraft,
} from "./productionFlowBuilderModel";

export interface ProductionFlowBuilderProps {
  isOpen: boolean;
  flow?: ProductionFlow;
  availableFlows?: readonly ProductionFlow[];
  recipeName?: string;
  onSave: (flow: ProductionFlow) => void | Promise<void>;
  onClose: () => void;
  onResetDefault?: () => void;
}

const CATEGORIES = [
  { value: "prep", label: "Prep & inventory" },
  { value: "starter", label: "Starter build" },
  { value: "mixing", label: "Mixing" },
  { value: "shaping", label: "Shaping" },
  { value: "ferment", label: "Fermentation" },
  { value: "baking", label: "Baking" },
  { value: "packaging", label: "Packaging" },
];

const DAY_OFFSETS = [
  { value: -2, label: "2 days before pickup" },
  { value: -1, label: "1 day before pickup" },
  { value: 0, label: "Pickup day" },
];

const JSON_IMPORT_PROMPT = `Convert the bakery production notes below into JSON only. Do not use markdown fences or extra text.

Use this shape:
{
  "name": "Flow name",
  "recipe": "Recipe name",
  "steps": [
    {
      "id": "step-1",
      "name": "Step name",
      "category": "prep|starter|mixing|shaping|ferment|baking|packaging",
      "dayOffset": -1,
      "time": "09:00",
      "duration": 15,
      "instructions": "What the baker should do",
      "enabled": true,
      "groupable": true,
      "dependsOn": null
    }
  ]
}

Use 24-hour HH:MM times, use -2, -1, or 0 for dayOffset, and set dependsOn to another step's id or null. Return a complete, valid JSON object.`;

type ConfirmIntent = "close" | "reset" | null;
type DeletedStep = { step: FlowStep; index: number } | null;

function cloneSteps(steps: readonly FlowStep[]) {
  return steps.map((step) => ({ ...step }));
}

function getStepErrors(validation: FlowBuilderValidation, stepId: string) {
  return validation.steps[stepId] ?? [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseImportedFlowJson(input: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Use valid JSON without markdown fences or extra text.");
  }

  const source = isRecord(parsed) && isRecord(parsed.flow) ? parsed.flow : parsed;
  if (!isRecord(source) || !Array.isArray(source.steps)) {
    throw new Error("JSON must include a steps array.");
  }

  const sourceSteps = source.steps.map((step, index) => {
    if (!isRecord(step)) throw new Error(`Step ${index + 1} must be a JSON object.`);
    const id = typeof step.id === "string" && step.id.trim() ? step.id.trim() : `step-${index + 1}`;
    const name = typeof step.name === "string" ? step.name.trim() : "";
    if (!name) throw new Error(`Step ${index + 1} needs a name.`);
    return { source: step, id, name };
  });
  const idMap = new Map(sourceSteps.map((step) => [step.id, createFlowStepId("step")]));

  const steps = sourceSteps.map(({ source: step, id, name }, index): FlowStep => {
    const rawDependency = step.dependsOn;
    let dependencyId: string | undefined;
    if (typeof rawDependency === "string" && rawDependency.trim()) {
      const dependencySource = sourceSteps.find((candidate) => candidate.id === rawDependency || candidate.name === rawDependency);
      if (!dependencySource) throw new Error(`Step ${index + 1} references a missing dependency.`);
      dependencyId = idMap.get(dependencySource.id);
    }

    const numericDayOffset = Number(step.dayOffset);
    const numericDuration = Number(step.duration);
    return {
      id: idMap.get(id) ?? createFlowStepId("step"),
      name,
      category: typeof step.category === "string" ? step.category : "mixing",
      dayOffset: Number.isFinite(numericDayOffset) ? numericDayOffset : 0,
      time: typeof step.time === "string" ? step.time : "12:00",
      duration: Number.isFinite(numericDuration) && numericDuration > 0 ? numericDuration : 15,
      instructions: typeof step.instructions === "string" ? step.instructions : "",
      enabled: step.enabled !== false,
      groupable: step.groupable !== false,
      dependsOn: dependencyId,
    };
  });

  return {
    name: typeof source.name === "string" ? source.name.trim() : "",
    recipe: typeof source.recipe === "string" ? source.recipe.trim() : "",
    steps,
  };
}

export function ProductionFlowBuilder({
  isOpen,
  flow,
  availableFlows = [],
  recipeName,
  onSave,
  onClose,
  onResetDefault,
}: ProductionFlowBuilderProps) {
  const [flowId, setFlowId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [targetRecipe, setTargetRecipe] = useState("");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [initialSignature, setInitialSignature] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deletedStep, setDeletedStep] = useState<DeletedStep>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [focusStepId, setFocusStepId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState("");
  const [jsonImportError, setJsonImportError] = useState("");
  const selectedStepRef = useRef<HTMLDivElement>(null);
  const flowNameRef = useRef<HTMLInputElement>(null);
  const stepButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!isOpen) return;

    const initialSteps = flow ? cloneSteps(flow.steps) : [];
    const initialName = flow?.name ?? `Custom ${recipeName || "Recipe"} Flow`;
    const initialRecipe = flow?.recipe ?? recipeName ?? "Custom Recipe";
    setFlowId(flow?.id ?? createFlowStepId("flow"));
    setIsDefault(Boolean(flow?.isDefault));
    setFlowName(initialName);
    setTargetRecipe(initialRecipe);
    setSteps(initialSteps);
    setSelectedStepId(initialSteps[0]?.id ?? null);
    setInitialSignature(getFlowDraftSignature(initialName, initialRecipe, initialSteps));
    setShowValidation(false);
    setConfirmIntent(null);
    setDeleteCandidateId(null);
    setDeletedStep(null);
    setDraggedStepId(null);
    setFocusStepId(null);
    setStatusMessage("");
    setShowJsonImport(false);
    setJsonImportText("");
    setJsonImportError("");
  }, [flow, isOpen, recipeName]);

  const selectedStep = useMemo(
    () => steps.find((step) => step.id === selectedStepId) ?? steps[0],
    [selectedStepId, steps],
  );
  const validation = useMemo(() => validateFlowDraft(flowName, steps), [flowName, steps]);
  const draftSignature = useMemo(
    () => getFlowDraftSignature(flowName, targetRecipe, steps),
    [flowName, targetRecipe, steps],
  );
  const isDirty = Boolean(initialSignature) && draftSignature !== initialSignature;
  const enabledCount = steps.filter((step) => step.enabled).length;
  const totalMinutes = steps.filter((step) => step.enabled).reduce((total, step) => total + (step.duration || 0), 0);
  const validationCount = validation.flow.length + Object.values(validation.steps).reduce((total, messages) => total + messages.length, 0);
  const selectedStepErrors = selectedStep ? getStepErrors(validation, selectedStep.id) : [];
  const dependentSteps = deleteCandidateId
    ? steps.filter((step) => step.dependsOn === deleteCandidateId)
    : [];
  const availablePrerequisites = selectedStep
    ? steps.filter((step) => step.id !== selectedStep.id && (step.enabled || step.id === selectedStep.dependsOn))
    : [];

  useEffect(() => {
    if (selectedStepId && steps.some((step) => step.id === selectedStepId)) return;
    setSelectedStepId(steps[0]?.id ?? null);
  }, [selectedStepId, steps]);

  useEffect(() => {
    if (!showValidation) return;
    if (selectedStepErrors.length > 0) selectedStepRef.current?.focus();
    else if (validation.flow.length > 0) flowNameRef.current?.focus();
  }, [showValidation, selectedStepId, selectedStepErrors.length, validation.flow.length]);

  useEffect(() => {
    if (!focusStepId) return;
    stepButtonRefs.current[focusStepId]?.focus();
    setFocusStepId(null);
  }, [focusStepId]);

  if (!isOpen) return null;

  const updateStep = (stepId: string, patch: Partial<FlowStep>) => {
    setSteps((current) => current.map((step) => (step.id === stepId ? { ...step, ...patch } : step)));
  };

  const moveStep = (stepId: string, direction: -1 | 1) => {
    setSteps((current) => {
      const index = current.findIndex((step) => step.id === stepId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const duplicateStep = (stepId: string) => {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index < 0) return;
    const source = steps[index];
    const copy = {
      ...source,
      id: createFlowStepId("step"),
      name: `${source.name || "Step"} copy`,
    };
    setSteps((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setSelectedStepId(copy.id);
    setFocusStepId(copy.id);
    setStatusMessage(`${copy.name} added after ${source.name || "the selected step"}.`);
  };

  const addStep = () => {
    const afterIndex = selectedStep ? steps.findIndex((step) => step.id === selectedStep.id) : steps.length - 1;
    const previous = afterIndex >= 0 ? steps[afterIndex] : undefined;
    const step: FlowStep = {
      id: createFlowStepId("step"),
      name: "New step",
      category: "mixing",
      dayOffset: previous?.dayOffset ?? -1,
      time: previous?.time ?? "12:00",
      duration: 15,
      instructions: "",
      enabled: true,
      dependsOn: previous?.id,
    };
    setSteps((current) => {
      const insertAt = afterIndex < 0 ? current.length : afterIndex + 1;
      return [...current.slice(0, insertAt), step, ...current.slice(insertAt)];
    });
    setSelectedStepId(step.id);
    setFocusStepId(step.id);
    setShowValidation(true);
    setStatusMessage("New step added. Add its instructions before saving.");
  };

  const importFlow = (sourceId: string) => {
    if (!sourceId) {
      const blankName = `Custom ${recipeName || "Recipe"} Flow`;
      const blankRecipe = recipeName ?? "Custom Recipe";
      setFlowName(blankName);
      setTargetRecipe(blankRecipe);
      setSteps([]);
      setSelectedStepId(null);
      setShowValidation(false);
      setStatusMessage("Blank flow restored. Add the first step when you are ready.");
      return;
    }

    const source = availableFlows.find((candidate) => candidate.id === sourceId);
    if (!source) return;

    const idMap = new Map(source.steps.map((step) => [step.id, createFlowStepId("step")]));
    const importedSteps = source.steps.map((step) => ({
      ...step,
      id: idMap.get(step.id) ?? createFlowStepId("step"),
      dependsOn: step.dependsOn ? idMap.get(step.dependsOn) : undefined,
    }));
    setFlowName(`${source.name} Copy`);
    setTargetRecipe(source.recipe);
    setSteps(importedSteps);
    setSelectedStepId(importedSteps[0]?.id ?? null);
    setShowValidation(false);
    setStatusMessage(`${source.name} imported. Review the copied steps before saving.`);
  };

  const addJsonToFlow = () => {
    try {
      const imported = parseImportedFlowJson(jsonImportText);
      setFlowName(imported.name || flowName);
      setTargetRecipe(imported.recipe || targetRecipe);
      setSteps(imported.steps);
      setSelectedStepId(imported.steps[0]?.id ?? null);
      setShowValidation(false);
      setJsonImportError("");
      setShowJsonImport(false);
      setStatusMessage("JSON imported. Review the populated flow before saving.");
    } catch (error) {
      setJsonImportError(error instanceof Error ? error.message : "This JSON could not be imported.");
    }
  };

  const copyJsonPrompt = async () => {
    if (!navigator.clipboard) {
      setStatusMessage("Select the prompt text and copy it into your AI assistant.");
      return;
    }
    await navigator.clipboard.writeText(JSON_IMPORT_PROMPT);
    setStatusMessage("AI organizer prompt copied.");
  };

  const requestDelete = (stepId: string) => {
    setDeleteCandidateId(stepId);
  };

  const confirmDelete = () => {
    if (!deleteCandidateId) return;
    const index = steps.findIndex((step) => step.id === deleteCandidateId);
    const removed = steps[index];
    if (!removed) return;

    setSteps((current) => current
      .filter((step) => step.id !== deleteCandidateId)
      .map((step) => (step.dependsOn === deleteCandidateId ? { ...step, dependsOn: undefined } : step)));
    setDeletedStep({ step: removed, index });
    setDeleteCandidateId(null);
    setSelectedStepId(steps[index + 1]?.id ?? steps[index - 1]?.id ?? null);
    setStatusMessage(`${removed.name || "Step"} deleted. You can undo this change.`);
  };

  const undoDelete = () => {
    if (!deletedStep) return;
    setSteps((current) => [
      ...current.slice(0, Math.min(deletedStep.index, current.length)),
      deletedStep.step,
      ...current.slice(Math.min(deletedStep.index, current.length)),
    ]);
    setSelectedStepId(deletedStep.step.id);
    setDeletedStep(null);
    setStatusMessage(`${deletedStep.step.name || "Step"} restored.`);
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, targetStepId: string) => {
    event.preventDefault();
    if (!draggedStepId || draggedStepId === targetStepId) return;
    setSteps((current) => {
      const sourceIndex = current.findIndex((step) => step.id === draggedStepId);
      const targetIndex = current.findIndex((step) => step.id === targetStepId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedStepId(null);
    setStatusMessage("Step order updated.");
  };

  const handleSave = async () => {
    setShowValidation(true);
    if (hasFlowBuilderErrors(validation)) {
      const firstStepWithErrors = Object.keys(validation.steps).find((stepId) => validation.steps[stepId]?.length);
      if (firstStepWithErrors) setSelectedStepId(firstStepWithErrors);
      setStatusMessage("Fix the highlighted issues before saving this flow.");
      return;
    }

    const savedFlow = normalizeFlowForSave(
      { id: flowId, name: flowName, recipe: targetRecipe, steps, isDefault },
      flowName,
      targetRecipe,
      steps,
    );
    setIsSaving(true);
    setStatusMessage("Saving production flow…");
    try {
      await onSave(savedFlow);
      onClose();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not save this production flow.");
    } finally {
      setIsSaving(false);
    }
  };

  const requestClose = () => {
    if (isDirty) setConfirmIntent("close");
    else onClose();
  };

  const requestReset = () => {
    if (!onResetDefault) return;
    if (isDirty) setConfirmIntent("reset");
    else onResetDefault();
  };

  const completeConfirmation = () => {
    if (confirmIntent === "close") onClose();
    if (confirmIntent === "reset") onResetDefault?.();
    setConfirmIntent(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="production-flow-builder-title"
        className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E5DDD3] bg-[#FBF8F3] shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-[#E5DDD3] bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF1EB] text-[#7A3E24]">
              <Layers size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#988D84]">Production flow</p>
              <h2 id="production-flow-builder-title" className="truncate text-lg font-extrabold text-[#2F2925]">
                {flow ? "Edit production flow" : "Build Production Flow"}
              </h2>
              <p className="truncate text-xs text-[#6F655E]">{targetRecipe || recipeName || "Custom recipe"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!flow && (
              <button
                type="button"
                onClick={() => {
                  setShowJsonImport((current) => !current);
                  setJsonImportError("");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5DDD3] bg-white px-3 text-xs font-bold text-[#7A3E24] hover:bg-[#FAF1EB]"
              >
                <FileJson size={14} /> <span className="hidden sm:inline">{showJsonImport ? "Close JSON import" : "Import JSON"}</span>
              </button>
            )}
            <button type="button" onClick={requestClose} aria-label="Close production flow builder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#988D84] hover:bg-[#F6F0E8] hover:text-[#2F2925]">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <section aria-labelledby="flow-setup-heading" className="rounded-2xl border border-[#E5DDD3] bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="flow-setup-heading" className="text-sm font-extrabold text-[#2F2925]">Start with the basics</h3>
                  <p className="mt-1 text-xs text-[#6F655E]">Name the process and the recipe it belongs to, then shape the timeline below.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#6F655E]">
                  <span className="rounded-full bg-[#F6F0E8] px-2.5 py-1">{steps.length} total steps</span>
                  <span className="rounded-full bg-[#EBF4EC] px-2.5 py-1 text-[#2D7A46]">{enabledCount} active</span>
                  <span className="rounded-full bg-[#F6F0E8] px-2.5 py-1">{totalMinutes} min active work</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-xs font-bold text-[#6F655E]">
                  Flow name
                  <input ref={flowNameRef} value={flowName} onChange={(event) => setFlowName(event.target.value)} placeholder="e.g. Standard sourdough loaf" className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" />
                </label>
                <label className="block text-xs font-bold text-[#6F655E]">
                  Recipe
                  <input value={targetRecipe} onChange={(event) => setTargetRecipe(event.target.value)} placeholder="e.g. Sourdough loaf" className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" />
                </label>
              </div>
              {!flow && availableFlows.length > 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-[#C7A48E] bg-[#FFF9F5] p-3.5">
                  <label className="block text-xs font-bold text-[#6F655E]">
                    Import from existing flow
                    <select
                      aria-label="Import from existing flow"
                      defaultValue=""
                      onChange={(event) => importFlow(event.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-white px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]"
                    >
                      <option value="">Start with a blank flow</option>
                      {availableFlows.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.recipe}</option>)}
                    </select>
                  </label>
                  <p className="mt-1.5 text-[11px] text-[#8B6A58]">Copy another flow's steps, timing, and instructions, then customize the new flow.</p>
                </div>
              )}
            </section>

            {showValidation && (validation.flow.length > 0 || validationCount > 0) && (
              <section aria-label="Flow validation" role="alert" className="rounded-2xl border border-[#E9B7B2] bg-[#FFF5F4] p-4 text-sm text-[#9B332C]">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold">A few things need your attention</p>
                    {validation.flow.map((message) => <p key={message} className="mt-1 text-xs">{message}</p>)}
                    {validationCount - validation.flow.length > 0 && <p className="mt-1 text-xs">Review the highlighted steps below before saving.</p>}
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.35fr)]">
              <section aria-labelledby="flow-timeline-heading" className="min-w-0 rounded-2xl border border-[#E5DDD3] bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 id="flow-timeline-heading" className="flex items-center gap-2 text-sm font-extrabold text-[#2F2925]"><Clock size={16} className="text-[#7A3E24]" /> Flow timeline</h3>
                    <p className="mt-1 text-xs text-[#6F655E]">Select a step to edit it. Drag or use the arrow buttons to reorder.</p>
                  </div>
                  {steps.length > 0 && <button type="button" onClick={addStep} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#7A3E24] px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#934E2E]"><Plus size={14} /> Add step</button>}
                </div>

                {steps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E5DDD3] bg-[#FBF8F3] px-4 py-10 text-center">
                    <p className="text-sm font-extrabold text-[#2F2925]">No steps yet</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-[#988D84]">Build this flow one step at a time, starting with the first thing the baker needs to do.</p>
                    <button type="button" onClick={addStep} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7A3E24] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#934E2E]"><Plus size={14} /> Add first step</button>
                  </div>
                ) : (
                  <ol aria-label="Production flow steps" className="space-y-2">
                    {steps.map((step, index) => {
                      const stepErrors = getStepErrors(validation, step.id);
                      const isSelected = step.id === selectedStep?.id;
                      return (
                        <li key={step.id} draggable onDragStart={() => setDraggedStepId(step.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, step.id)} className={`rounded-xl border transition-colors ${isSelected ? "border-[#B4643B] bg-[#FFF9F5]" : "border-[#E5DDD3] bg-white"}`}>
                          <div className="flex items-stretch gap-1">
                            <button ref={(element) => { stepButtonRefs.current[step.id] = element; }} type="button" onClick={() => setSelectedStepId(step.id)} aria-pressed={isSelected} className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-3 text-left">
                              <GripVertical size={15} aria-hidden="true" className="shrink-0 text-[#C4B7AD]" />
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${step.enabled ? "bg-[#FAF1EB] text-[#7A3E24]" : "bg-[#F0E9E0] text-[#988D84]"}`}>{index + 1}</span>
                              <span className="min-w-0 flex-1">
                                <span className={`block truncate text-sm font-extrabold ${step.enabled ? "text-[#2F2925]" : "text-[#988D84]"}`}>{step.name || "Unnamed step"}</span>
                                <span className="mt-0.5 block truncate text-[11px] text-[#6F655E]">{formatFlowStepSchedule(step)}</span>
                                <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#988D84]">
                                  <span className="rounded-full bg-[#F6F0E8] px-1.5 py-0.5">{CATEGORIES.find((category) => category.value === step.category)?.label || "Uncategorized"}</span>
                                  {step.dependsOn && <span className="truncate">After {steps.find((candidate) => candidate.id === step.dependsOn)?.name || "another step"}</span>}
                                </span>
                              </span>
                              <span className={`hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:inline-block ${step.enabled ? "bg-[#EBF4EC] text-[#2D7A46]" : "bg-[#F0E9E0] text-[#988D84]"}`}>{step.enabled ? "Active" : "Disabled"}</span>
                            </button>
                            <div className="flex shrink-0 items-center gap-0.5 pr-2">
                              <button type="button" onClick={() => moveStep(step.id, -1)} disabled={index === 0} aria-label={`Move ${step.name || "step"} up`} className="rounded-md p-1.5 text-[#6F655E] hover:bg-[#F6F0E8] disabled:opacity-25"><ArrowUp size={14} /></button>
                              <button type="button" onClick={() => moveStep(step.id, 1)} disabled={index === steps.length - 1} aria-label={`Move ${step.name || "step"} down`} className="rounded-md p-1.5 text-[#6F655E] hover:bg-[#F6F0E8] disabled:opacity-25"><ArrowDown size={14} /></button>
                            </div>
                          </div>
                          {showValidation && stepErrors.length > 0 && <p className="flex items-center gap-1 px-11 pb-3 text-[11px] font-semibold text-[#B8443C]"><AlertCircle size={13} /> {stepErrors[0]}</p>}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

              <section aria-labelledby="step-details-heading" ref={selectedStepRef} tabIndex={-1} className="min-w-0 rounded-2xl border border-[#E5DDD3] bg-white p-4 sm:p-5 outline-none focus-visible:ring-2 focus-visible:ring-[#B4643B]">
                {selectedStep ? (
                  <>
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#F0E9E0] pb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#988D84]">Step {steps.findIndex((step) => step.id === selectedStep.id) + 1}</p>
                        <h3 id="step-details-heading" className="mt-1 text-base font-extrabold text-[#2F2925]">Step details</h3>
                        <p className="mt-1 text-xs text-[#6F655E]">Give this step a clear job, then tell the baker when and how it connects.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => duplicateStep(selectedStep.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DDD3] px-2.5 py-2 text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]"><Copy size={13} /> Duplicate</button>
                        <button type="button" onClick={() => requestDelete(selectedStep.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E9B7B2] px-2.5 py-2 text-xs font-bold text-[#B8443C] hover:bg-[#FFF5F4]"><Trash2 size={13} /> Delete</button>
                      </div>
                    </div>

                    {showValidation && selectedStepErrors.length > 0 && <div className="mb-4 rounded-xl border border-[#E9B7B2] bg-[#FFF5F4] p-3 text-xs text-[#9B332C]"><p className="font-extrabold">Check this step</p>{selectedStepErrors.map((message) => <p key={message} className="mt-1">{message}</p>)}</div>}

                    <div className="space-y-5">
                      <fieldset className="space-y-3">
                        <legend className="text-xs font-extrabold uppercase tracking-wider text-[#7A3E24]">What to do</legend>
                        <label className="block text-xs font-bold text-[#6F655E]">Step name<input value={selectedStep.name} onChange={(event) => updateStep(selectedStep.id, { name: event.target.value })} placeholder="e.g. Build starter" className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" /></label>
                        <label className="block text-xs font-bold text-[#6F655E]">Category<select value={selectedStep.category} onChange={(event) => updateStep(selectedStep.id, { category: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]"><option value="">Choose a category</option>{CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
                        <label className="block text-xs font-bold text-[#6F655E]">Baker instructions<textarea rows={4} value={selectedStep.instructions} onChange={(event) => updateStep(selectedStep.id, { instructions: event.target.value })} placeholder="Describe what the baker should do..." className="mt-1.5 w-full resize-y rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] p-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" /></label>
                      </fieldset>

                      <fieldset className="space-y-3 border-t border-[#F0E9E0] pt-5">
                        <legend className="text-xs font-extrabold uppercase tracking-wider text-[#7A3E24]">When</legend>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <label className="block text-xs font-bold text-[#6F655E] sm:col-span-2">Timing relative to pickup<select value={selectedStep.dayOffset} onChange={(event) => updateStep(selectedStep.id, { dayOffset: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-2 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]">{DAY_OFFSETS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
                          <label className="block text-xs font-bold text-[#6F655E]">Time<input type="time" value={selectedStep.time} onChange={(event) => updateStep(selectedStep.id, { time: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-2 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" /></label>
                        </div>
                        <label className="block max-w-[180px] text-xs font-bold text-[#6F655E]">Duration (minutes)<input type="number" min={1} value={selectedStep.duration} onChange={(event) => updateStep(selectedStep.id, { duration: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-3 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]" /></label>
                        <p className="rounded-xl bg-[#F6F0E8] px-3 py-2.5 text-xs font-semibold text-[#6F655E]"><Clock size={13} className="mr-1 inline text-[#7A3E24]" /> This step is planned for <span className="text-[#2F2925]">{formatFlowStepSchedule(selectedStep)}</span>.</p>
                      </fieldset>

                      <fieldset className="space-y-3 border-t border-[#F0E9E0] pt-5">
                        <legend className="text-xs font-extrabold uppercase tracking-wider text-[#7A3E24]">How it connects</legend>
                        <label className="block text-xs font-bold text-[#6F655E]">Start after<select value={selectedStep.dependsOn || ""} onChange={(event) => updateStep(selectedStep.id, { dependsOn: event.target.value || undefined })} className="mt-1.5 h-10 w-full rounded-xl border border-[#E5DDD3] bg-[#FBF8F3] px-2 text-sm font-normal text-[#2F2925] outline-none focus:border-[#7A3E24]"><option value="">No prerequisite</option>{availablePrerequisites.map((step) => <option key={step.id} value={step.id}>Step {steps.findIndex((candidate) => candidate.id === step.id) + 1}: {step.name || "Unnamed step"}</option>)}</select></label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#6F655E]"><input type="checkbox" checked={selectedStep.groupable !== false} onChange={(event) => updateStep(selectedStep.id, { groupable: event.target.checked })} className="h-4 w-4 accent-[#7A3E24]" /> Allow compatible work to be grouped</label>
                        {selectedStep.dependsOn && <p className="text-xs text-[#6F655E]">This step waits for <span className="font-bold text-[#2F2925]">{steps.find((step) => step.id === selectedStep.dependsOn)?.name || "another step"}</span>.</p>}
                      </fieldset>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[300px] items-center justify-center text-center text-sm text-[#988D84]">Add a step to begin editing its details.</div>
                )}
              </section>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDD3] bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {onResetDefault && isDefault && <button type="button" onClick={requestReset} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5DDD3] px-3 py-2 text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]"><RotateCcw size={14} /> Reset to default</button>}
            <p aria-live="polite" className="truncate text-xs font-semibold text-[#6F655E]">{statusMessage || (isDirty ? "Unsaved changes" : "All changes saved")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={requestClose} className="rounded-xl border border-[#E5DDD3] px-4 py-2.5 text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8]">Cancel</button>
            <button type="button" onClick={() => void handleSave()} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A3E24] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#934E2E] disabled:cursor-wait disabled:opacity-60"><Save size={14} /> {isSaving ? "Saving…" : "Save Production Flow"}</button>
          </div>
        </footer>

        {!flow && showJsonImport && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 p-3 sm:p-6">
            <div role="dialog" aria-modal="true" aria-labelledby="json-import-title" className="max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#B7D2E8] bg-[#F5FAFE] p-4 shadow-2xl sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 id="json-import-title" className="text-base font-extrabold text-[#2F2925]">Import a flow with AI assistance</h3>
                  <p className="mt-1 text-xs text-[#315B78]">Give the prompt to an AI assistant, then paste its organized JSON on the right to populate this flow.</p>
                </div>
                <button type="button" onClick={() => setShowJsonImport(false)} aria-label="Close JSON import" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#315B78] hover:bg-[#EAF2F8]"><X size={17} /></button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#315B78]">
                    AI organizer prompt
                    <textarea readOnly value={JSON_IMPORT_PROMPT} className="mt-1.5 h-64 w-full resize-y rounded-xl border border-[#B7D2E8] bg-white p-3 font-mono text-[11px] leading-relaxed text-[#2F2925] outline-none" />
                  </label>
                  <button type="button" onClick={copyJsonPrompt} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#B7D2E8] bg-white px-2.5 py-2 text-xs font-bold text-[#315B78] hover:bg-[#EAF2F8]"><Copy size={13} /> Copy prompt</button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#315B78]">
                    Organized flow JSON
                    <textarea aria-label="Organized flow JSON" value={jsonImportText} onChange={(event) => { setJsonImportText(event.target.value); setJsonImportError(""); }} placeholder={'Paste the AI response here, for example: {"name":"My Flow","recipe":"Sourdough Loaf","steps":[]}' } className="mt-1.5 h-64 w-full resize-y rounded-xl border border-[#B7D2E8] bg-white p-3 font-mono text-[11px] leading-relaxed text-[#2F2925] outline-none focus:border-[#7A3E24]" />
                  </label>
                  {jsonImportError && <p role="alert" className="mt-2 rounded-lg bg-[#FFF5F4] px-3 py-2 text-xs font-semibold text-[#B8443C]">{jsonImportError}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={addJsonToFlow} className="inline-flex items-center gap-1.5 rounded-xl bg-[#315B78] px-3.5 py-2.5 text-xs font-extrabold text-white hover:bg-[#234963]"><FileJson size={14} /> Add JSON to flow</button>
              </div>
            </div>
          </div>
        )}

        {deletedStep && <div role="status" className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-[#2F2925] px-3 py-2 text-xs font-semibold text-white shadow-xl"><span>{statusMessage}</span><button type="button" onClick={undoDelete} className="inline-flex items-center gap-1 font-extrabold text-[#FFD3B8] hover:text-white"><Undo2 size={13} /> Undo</button></div>}

        {deleteCandidateId && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4"><div role="alertdialog" aria-modal="true" aria-labelledby="delete-step-title" className="w-full max-w-md rounded-2xl border border-[#E5DDD3] bg-white p-5 shadow-2xl"><h3 id="delete-step-title" className="text-base font-extrabold text-[#2F2925]">Delete this step?</h3><p className="mt-2 text-sm text-[#6F655E]">{dependentSteps.length > 0 ? `This will also remove the prerequisite link from ${dependentSteps.length} other step${dependentSteps.length === 1 ? "" : "s"}.` : "This step will be removed from the flow."}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteCandidateId(null)} className="rounded-xl border border-[#E5DDD3] px-3 py-2 text-xs font-bold text-[#6F655E]">Keep step</button><button type="button" onClick={confirmDelete} className="rounded-xl bg-[#B8443C] px-3 py-2 text-xs font-extrabold text-white">Delete step</button></div></div></div>}

        {confirmIntent && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"><div role="alertdialog" aria-modal="true" aria-labelledby="discard-flow-title" className="w-full max-w-md rounded-2xl border border-[#E5DDD3] bg-white p-5 shadow-2xl"><h3 id="discard-flow-title" className="text-base font-extrabold text-[#2F2925]">{confirmIntent === "reset" ? "Reset this flow?" : "Discard unsaved changes?"}</h3><p className="mt-2 text-sm text-[#6F655E]">{confirmIntent === "reset" ? "Your edits will be replaced by the default flow." : "Your edits will be lost if you leave this builder."}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmIntent(null)} className="rounded-xl border border-[#E5DDD3] px-3 py-2 text-xs font-bold text-[#6F655E]">Keep editing</button><button type="button" onClick={completeConfirmation} className="rounded-xl bg-[#7A3E24] px-3 py-2 text-xs font-extrabold text-white">{confirmIntent === "reset" ? "Reset flow" : "Discard changes"}</button></div></div></div>}
      </div>
    </div>
  );
}
