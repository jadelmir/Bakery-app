import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Clock,
  Save,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import type { ProductionFlow, FlowStep } from "../../production";

export interface ProductionFlowBuilderProps {
  isOpen: boolean;
  flow?: ProductionFlow;
  recipeName?: string;
  onSave: (flow: ProductionFlow) => void;
  onClose: () => void;
  onResetDefault?: () => void;
}

const CATEGORIES = [
  { value: "prep", label: "Prep & Inventory" },
  { value: "starter", label: "Starter Build" },
  { value: "mixing", label: "Mixing" },
  { value: "shaping", label: "Shaping" },
  { value: "ferment", label: "Fermentation" },
  { value: "baking", label: "Baking" },
  { value: "packaging", label: "Packaging" },
];

const DAY_OFFSETS = [
  { value: -2, label: "-2 Days (2 Days Before Pickup)" },
  { value: -1, label: "-1 Day (1 Day Before Pickup)" },
  { value: 0, label: "0 Days (Pickup Day)" },
];

export function ProductionFlowBuilder({
  isOpen,
  flow,
  recipeName,
  onSave,
  onClose,
  onResetDefault,
}: ProductionFlowBuilderProps) {
  const [flowName, setFlowName] = useState("");
  const [targetRecipe, setTargetRecipe] = useState("");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flow) {
      setFlowName(flow.name);
      setTargetRecipe(flow.recipe);
      setSteps(flow.steps.map((s) => ({ ...s })));
    } else {
      const rec = recipeName || "Custom Recipe";
      setFlowName(`Custom ${rec} Flow`);
      setTargetRecipe(rec);
      setSteps([
        {
          id: `step-${Date.now()}-1`,
          name: "Check starter and inventory",
          dayOffset: -2,
          time: "09:00",
          category: "prep",
          duration: 15,
          instructions: "Verify starter and ingredient stock.",
          enabled: true,
        },
        {
          id: `step-${Date.now()}-2`,
          name: "Mix Dough",
          dayOffset: -1,
          time: "14:00",
          category: "mixing",
          duration: 20,
          instructions: "Combine ingredients and mix until incorporated.",
          enabled: true,
          dependsOn: `step-${Date.now()}-1`,
        },
      ]);
    }
    setError(null);
  }, [flow, recipeName, isOpen]);

  if (!isOpen) return null;

  const handleStepChange = (index: number, patch: Partial<FlowStep>) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleAddStep = () => {
    const newId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const prevStep = steps.length > 0 ? steps[steps.length - 1] : null;
    const newStep: FlowStep = {
      id: newId,
      name: "New Step",
      category: "mixing",
      dayOffset: prevStep ? prevStep.dayOffset : -1,
      time: "12:00",
      duration: 15,
      instructions: "",
      enabled: true,
      dependsOn: prevStep ? prevStep.id : undefined,
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const stepToRemove = steps[index];
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Clean up dependsOn references to removed step
      return next.map((s) => (s.dependsOn === stepToRemove.id ? { ...s, dependsOn: undefined } : s));
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    setSteps((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleSave = () => {
    if (!flowName.trim()) {
      setError("Flow name is required.");
      return;
    }
    if (steps.length === 0) {
      setError("At least one production step is required.");
      return;
    }

    const updatedFlow: ProductionFlow = {
      id: flow?.id || `flow-${Date.now()}`,
      name: flowName.trim(),
      recipe: targetRecipe || recipeName || "Custom Recipe",
      steps,
      isDefault: flow?.isDefault ?? false,
    };

    onSave(updatedFlow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#E5DDD3] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDD3] bg-[#FBF8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF1EB] text-[#7A3E24] flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#2F2925]">
                {flow ? "Edit Production Flow" : "Build Production Flow"}
              </h2>
              <p className="text-xs text-[#6F655E]">
                Recipe: <span className="font-semibold text-[#7A3E24]">{targetRecipe || recipeName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#988D84] hover:text-[#2F2925] hover:bg-[#F6F0E8] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Flow Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FBF8F3] p-4 rounded-xl border border-[#E5DDD3]">
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                Flow Name
              </label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g. Standard Sourdough Loaf"
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-xl text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                Associated Recipe
              </label>
              <input
                type="text"
                value={targetRecipe}
                onChange={(e) => setTargetRecipe(e.target.value)}
                placeholder="e.g. Sourdough Loaf"
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-xl text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2F2925] flex items-center gap-2">
                <Clock size={16} className="text-[#7A3E24]" />
                Production Steps ({steps.length})
              </h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A3E24] text-white rounded-xl text-xs font-bold hover:bg-[#934E2E] transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 bg-[#FBF8F3] rounded-xl border border-dashed border-[#E5DDD3] text-[#988D84] text-xs">
                No steps defined. Click "Add Step" to create the first step for this flow.
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const availablePrereqs = steps.filter((s) => s.id !== step.id);

                  return (
                    <div
                      key={step.id || index}
                      className="bg-white rounded-xl border border-[#E5DDD3] p-4 shadow-xs space-y-3 relative group"
                    >
                      {/* Step Header & Order Controls */}
                      <div className="flex items-center justify-between border-b border-[#F0E9E0] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#FAF1EB] text-[#7A3E24] font-extrabold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-[#6F655E]">Step #{index + 1}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 rounded-lg text-[#6F655E] hover:bg-[#F6F0E8] disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === steps.length - 1}
                            className="p-1 rounded-lg text-[#6F655E] hover:bg-[#F6F0E8] disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(index)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors ml-2"
                            title="Remove Step"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Step Input Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Step Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Step Name
                          </label>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => handleStepChange(index, { name: e.target.value })}
                            placeholder="e.g. Build Starter"
                            className="w-full h-9 px-3 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <select
                            value={step.category}
                            onChange={(e) => handleStepChange(index, { category: e.target.value })}
                            className="w-full h-9 px-2 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Day Offset */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Day Offset
                          </label>
                          <select
                            value={step.dayOffset}
                            onChange={(e) => handleStepChange(index, { dayOffset: Number(e.target.value) })}
                            className="w-full h-9 px-2 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          >
                            {DAY_OFFSETS.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Target Time */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Target Time
                          </label>
                          <input
                            type="time"
                            value={step.time}
                            onChange={(e) => handleStepChange(index, { time: e.target.value })}
                            className="w-full h-9 px-2 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          />
                        </div>

                        {/* Duration (mins) */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Duration (mins)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={step.duration}
                            onChange={(e) => handleStepChange(index, { duration: Math.max(1, Number(e.target.value)) })}
                            className="w-full h-9 px-3 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          />
                        </div>

                        {/* Prerequisite Step */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                            Prerequisite Step (dependsOn)
                          </label>
                          <select
                            value={step.dependsOn || ""}
                            onChange={(e) =>
                              handleStepChange(index, {
                                dependsOn: e.target.value ? e.target.value : undefined,
                              })
                            }
                            className="w-full h-9 px-2 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                          >
                            <option value="">None (No Prerequisite)</option>
                            {availablePrereqs.map((prereq, pIdx) => (
                              <option key={prereq.id || pIdx} value={prereq.id}>
                                Step {steps.findIndex((s) => s.id === prereq.id) + 1}: {prereq.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                          Baker Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={step.instructions}
                          onChange={(e) => handleStepChange(index, { instructions: e.target.value })}
                          placeholder="Detailed instructions for the baker..."
                          className="w-full p-2.5 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24] resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5DDD3] bg-[#FBF8F3]">
          <div>
            {onResetDefault && flow?.isDefault && (
              <button
                type="button"
                onClick={onResetDefault}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5DDD3] rounded-xl text-xs font-bold text-[#6F655E] hover:bg-white transition-colors"
              >
                <RotateCcw size={14} /> Reset to Default
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5DDD3] rounded-xl text-xs font-bold text-[#6F655E] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#7A3E24] text-white rounded-xl text-xs font-extrabold hover:bg-[#934E2E] transition-all shadow-sm active:scale-95"
            >
              <Save size={14} /> Save Production Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
