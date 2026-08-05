import { useState, useEffect } from "react";
import { AlertTriangle, Check, Clock, Timer as TimerIcon, Pause, Play, Sparkles } from "lucide-react";
import { buildStarterPlans } from "../planning";
import { DEFAULT_FLOWS, type ProductionFlow, calculateTaskDependencyStatus, type ProductionTask } from "../production";
import { ProductionFlowBuilder } from "../components/production/ProductionFlowBuilder";
import { ProductionTimeBlock } from "../components/production/ProductionTimeBlock";
import { TaskExecutionCard, calculateTaskElapsedSeconds, formatElapsedSeconds } from "../components/production/TaskExecutionCard";
import { Chip } from "../components/shared/Chip";
import { TASK_STATUS, TASK_URGENCY, CAT_COLORS, ORDERS, dateKey, displayTime, addDays, pickupDateKey } from "../constants";
import { deriveProductionTimeline } from "../productionTimeline";
import type { Task } from "../types";

export function ScheduleTaskCard({
  task,
  allTasks = [],
  flows = DEFAULT_FLOWS,
  dependencyLabel,
  onUpdate,
  currentTimeMs,
  starterBuild,
}: {
  task: Task;
  allTasks?: Task[];
  flows?: ProductionFlow[];
  dependencyLabel?: string;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  currentTimeMs?: number;
  starterBuild?: ReturnType<typeof buildStarterPlans>[number];
}) {
  return (
    <TaskExecutionCard
      task={task}
      allTasks={allTasks}
      flows={flows}
      prerequisiteName={dependencyLabel}
      onComplete={id => onUpdate(id, { status: "completed", timerRunning: false } as Partial<Task & ProductionTask>)}
      onStartTimer={id => onUpdate(id, { timerRunning: true, timerStartedAt: new Date().toISOString(), status: "in-progress" } as Partial<Task>)}
      onPauseTimer={(id, elapsedSeconds) => onUpdate(id, { timerRunning: false, elapsedSeconds } as Partial<Task>)}
      onDelayTask={(id, delayMinutes) => {
        const currentScheduled = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
        if (!isNaN(currentScheduled.getTime())) {
          currentScheduled.setMinutes(currentScheduled.getMinutes() + delayMinutes);
        }
        const prevDelay = (task as unknown as { delayMinutes?: number }).delayMinutes || 0;
        onUpdate(id, {
          delayMinutes: prevDelay + delayMinutes,
          scheduledAt: currentScheduled.toISOString(),
          time: displayTime(currentScheduled.toISOString()),
        } as Partial<Task>);
      }}
      onSkipTask={(id, reason) => onUpdate(id, { status: "skipped", skipReason: reason, timerRunning: false } as Partial<Task>)}
      onUpdate={onUpdate}
      currentTimeMs={currentTimeMs}
      starterBuild={starterBuild}
    />
  );
}

export function FlowBuilder({ flows = DEFAULT_FLOWS, onSaveFlow }: { flows?: ProductionFlow[]; onSaveFlow?: (flow: ProductionFlow) => void }) {
  const [localFlows, setLocalFlows] = useState<ProductionFlow[]>(flows);
  const [selectedId, setSelectedId] = useState(flows[0]?.id || DEFAULT_FLOWS[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLocalFlows(flows);
  }, [flows]);

  const selected = localFlows.find(flow => flow.id === selectedId) || localFlows[0] || DEFAULT_FLOWS[0];
  const incomplete = selected.steps.filter(step => step.enabled && (!step.time || !step.instructions));

  const update = (patch: Partial<ProductionFlow>) => {
    const updated = localFlows.map(flow => flow.id === selected.id ? { ...flow, ...patch } : flow);
    setLocalFlows(updated);
    const target = updated.find(f => f.id === selected.id);
    if (target && onSaveFlow) onSaveFlow(target);
  };

  const duplicate = () => {
    const copy = { ...selected, id: `${selected.id}-copy`, name: `${selected.name} Copy`, isDefault: false, steps: selected.steps.map(step => ({ ...step })) };
    const updated = [...localFlows, copy];
    setLocalFlows(updated);
    setSelectedId(copy.id);
    if (onSaveFlow) onSaveFlow(copy);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#EAF2F8] rounded-[12px] p-3 text-xs text-[#4B6F8C] flex justify-between items-center flex-wrap gap-2">
        <span><b>Production Flow Builder.</b> Customize multi-step baking flows, day offsets, and prerequisite dependencies.</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-3 rounded-[8px] bg-[#7A3E24] text-white text-xs font-bold hover:bg-[#934E2E] transition-colors"
        >
          Edit in Flow Builder Modal
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {localFlows.map(flow => (
          <button
            key={flow.id}
            onClick={() => setSelectedId(flow.id)}
            className={`h-9 px-3 rounded-full text-xs font-bold whitespace-nowrap ${flow.id === selected.id ? "bg-[#7A3E24] text-white" : "bg-white border border-[#E5DDD3] text-[#6F655E]"}`}
          >
            {flow.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5DDD3] p-4 space-y-3">
        <div className="flex justify-between gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-[#988D84] uppercase">Flow name</label>
            <input value={selected.name} onChange={event => update({ name: event.target.value })} className="mt-1 w-full h-10 rounded-[8px] border border-[#E5DDD3] px-3 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsModalOpen(true)} className="h-10 px-3.5 rounded-[8px] bg-[#FAF1EB] text-[#7A3E24] text-xs font-bold border border-[#E5DDD3]">Open Full Builder</button>
            <button onClick={duplicate} className="h-10 px-3 rounded-[8px] bg-[#F3DED1] text-[#7A3E24] text-xs font-bold">Duplicate</button>
          </div>
        </div>

        <p className="text-xs text-[#6F655E]">Assigned recipe: <b>{selected.recipe}</b></p>
        {incomplete.length > 0 ? (
          <div className="rounded-[10px] bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{incomplete.length} enabled step{incomplete.length === 1 ? " is" : "s are"} missing timing or instructions and will not generate a valid plan.</div>
        ) : (
          <div className="rounded-[10px] bg-[#E8F3EB] p-3 text-xs font-semibold text-[#3F7A55]">All enabled steps have scheduling details.</div>
        )}

        <div className="space-y-2">
          {selected.steps.map((step, index) => (
            <div key={step.id || index} className="rounded-[10px] border border-[#F0E9E0] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#2F2925]">{index + 1}. {step.name}</p>
                <label className="text-xs text-[#6F655E]">
                  <input type="checkbox" checked={step.enabled} onChange={() => update({ steps: selected.steps.map(item => item.id === step.id ? { ...item, enabled: !item.enabled } : item) })} className="mr-1" />
                  Enabled
                </label>
              </div>
              <p className="text-xs text-[#988D84] mt-1">
                {step.dayOffset === 0 ? "Pickup day" : `${Math.abs(step.dayOffset)} day${Math.abs(step.dayOffset) === 1 ? "" : "s"} before`} at {step.time} · {step.instructions}
              </p>
              {step.dependsOn && (
                <span className="inline-block mt-1.5 text-[10px] font-semibold text-[#B7791F] bg-[#FFF4D8] px-2 py-0.5 rounded">
                  Prerequisite: {selected.steps.find(s => s.id === step.dependsOn)?.name || step.dependsOn}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ProductionFlowBuilder
          isOpen={isModalOpen}
          flow={selected}
          recipeName={selected.recipe}
          onClose={() => setIsModalOpen(false)}
          onSave={(savedFlow) => {
            const updated = localFlows.map(f => f.id === savedFlow.id ? savedFlow : f);
            setLocalFlows(updated);
            if (onSaveFlow) onSaveFlow(savedFlow);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function ProductionScreen({
  tasks,
  setTasks,
  onTaskUpdate,
  starterBuilds,
  flows = DEFAULT_FLOWS,
  onSaveFlow,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTaskUpdate: (id: string, patch: Partial<Task>) => void;
  starterBuilds: ReturnType<typeof buildStarterPlans>;
  flows?: ProductionFlow[];
  onSaveFlow?: (flow: ProductionFlow) => void;
}) {
  const [view, setView] = useState<"today" | "tomorrow" | "calendar">("today");
  const [showFlows, setShowFlows] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());

  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));
  const firstTaskDate = tasks.find(task => task.scheduledAt)?.scheduledAt;
  const [calendarDate, setCalendarDate] = useState(firstTaskDate ? dateKey(firstTaskDate) : todayKey);
  const selectedDate = view === "today" ? todayKey : view === "tomorrow" ? tomorrowKey : calendarDate;

  const updateTask = (id: string, patch: Partial<Task>) => onTaskUpdate(id, patch);

  // Active timers
  const runningTasks = tasks.filter(t => Boolean((t as unknown as { timerRunning?: boolean }).timerRunning));

  useEffect(() => {
    if (runningTasks.length === 0) return;

    setCurrentTimeMs(Date.now());
    const interval = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [runningTasks.length]);

  const timelineBlocks = deriveProductionTimeline(tasks, selectedDate, starterBuilds)
    .filter(block =>
      categoryFilter === "all"
      || block.tasks.some(task => (task.category || "").toLowerCase() === categoryFilter.toLowerCase())
    );

  const pickups = ORDERS
    .filter(order => pickupDateKey(order) === selectedDate)
    .map(order => ({
      order,
      scheduledAt: new Date(`${order.pickup}, ${new Date().getFullYear()} ${order.pickupTime}`).toISOString(),
    }));

  const schedule = [
    ...timelineBlocks.map(block => ({ type: "block" as const, scheduledAt: block.scheduledAt, block })),
    ...pickups.map(pickup => ({ type: "pickup" as const, ...pickup })),
  ].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const calendarDays = Array.from(
    new Set([
      ...tasks.flatMap(task => (task.scheduledAt ? [dateKey(task.scheduledAt)] : [])),
      ...ORDERS.map(pickupDateKey).filter(Boolean),
    ])
  ).sort();

  const dependencyFor = (task: Task) => {
    const depStatus = calculateTaskDependencyStatus(
      task as unknown as ProductionTask,
      tasks as unknown as ProductionTask[],
      flows
    );
    return depStatus.isBlocked ? depStatus.pendingPrerequisiteName : undefined;
  };

  const categories = ["all", "prep", "starter", "mixing", "shaping", "ferment", "baking", "packaging"];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10 space-y-5">
      {/* Title & Top Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#2F2925]">Production Workspace</h1>
          <p className="text-xs text-[#988D84]">Execute tasks, manage timers, and monitor kitchen workflow</p>
        </div>
        <button
          onClick={() => setShowFlows(v => !v)}
          className="h-9 px-3.5 rounded-[10px] border border-[#E5DDD3] bg-white text-xs font-bold text-[#7A3E24] hover:bg-[#FAF1EB] transition-colors shadow-2xs"
        >
          {showFlows ? "Schedule" : "Flow Builder"}
        </button>
      </div>

      {showFlows ? (
        <FlowBuilder flows={flows} onSaveFlow={onSaveFlow} />
      ) : (
        <>
          {/* Active Live Timers Overview Widget */}
          {runningTasks.length > 0 && (
            <div className="bg-gradient-to-r from-[#7A3E24] to-[#934E2E] rounded-[20px] p-4 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-white/20 flex items-center justify-center animate-pulse">
                    <TimerIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/80">
                      Active Live Timers ({runningTasks.length})
                    </h3>
                    <p className="text-sm font-bold">Kitchen Execution in Progress</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    runningTasks.forEach(rt => onTaskUpdate(rt.id, {
                      timerRunning: false,
                      elapsedSeconds: calculateTaskElapsedSeconds(rt, currentTimeMs),
                    } as Partial<Task>));
                  }}
                  className="h-8 px-3 rounded-[8px] bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Pause size={12} /> Pause All
                </button>
              </div>

              <div className="space-y-2 pt-1 border-t border-white/15">
                {runningTasks.map(rt => {
                  const elapsed = calculateTaskElapsedSeconds(rt, currentTimeMs);
                  return (
                    <div key={rt.id} className="flex items-center justify-between bg-black/15 rounded-[10px] px-3 py-2 text-xs">
                      <span className="font-semibold truncate max-w-[200px] sm:max-w-[300px]">{rt.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{formatElapsedSeconds(elapsed)}</span>
                        <button
                          onClick={() => onTaskUpdate(rt.id, {
                            timerRunning: false,
                            elapsedSeconds: calculateTaskElapsedSeconds(rt, currentTimeMs),
                          } as Partial<Task>)}
                          className="p-1 rounded hover:bg-white/20"
                          title="Pause"
                        >
                          <Pause size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Tabs & Category Filters */}
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["today", "tomorrow", "calendar"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-bold capitalize transition-colors ${
                    view === v
                      ? "bg-[#7A3E24] text-white shadow-xs"
                      : "bg-white border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-7 px-3 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? "bg-[#7A3E24] text-white"
                      : "bg-white border border-[#E5DDD3] text-[#6F655E] hover:bg-[#F6F0E8]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {view === "calendar" && (
            <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-4">
              <label htmlFor="production-calendar" className="text-[11px] font-bold text-[#988D84] uppercase">
                Select production day
              </label>
              <input
                id="production-calendar"
                type="date"
                value={calendarDate}
                onChange={event => setCalendarDate(event.target.value)}
                className="mt-1 w-full h-10 rounded-[8px] border border-[#E5DDD3] px-3 text-sm"
              />
              <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                {calendarDays.map(day => {
                  const taskCount = tasks.filter(
                    task => task.scheduledAt && dateKey(task.scheduledAt) === day
                  ).length;
                  const pickupCount = ORDERS.filter(order => pickupDateKey(order) === day).length;
                  return (
                    <button
                      key={day}
                      onClick={() => setCalendarDate(day)}
                      className={`min-w-[92px] rounded-[10px] border p-2 text-left transition-colors ${
                        calendarDate === day ? "border-[#7A3E24] bg-[#F3DED1]" : "border-[#E5DDD3] bg-white"
                      }`}
                    >
                      <span className="block text-xs font-bold text-[#2F2925]">{day.slice(5)}</span>
                      <span className="block text-[10px] text-[#6F655E] mt-1">
                        {taskCount} tasks · {pickupCount} pickups
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-0.5">
            {Object.entries(CAT_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-[#988D84] capitalize font-medium">{cat}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-extrabold text-[#2F2925]">{selectedDate}</p>
            <p className="text-xs text-[#988D84]">Bakery timezone: America/New_York · chronological tasks and pickups</p>
          </div>

          {/* Task Timeline */}
          {schedule.length > 0 && (
            <div className="relative">
              <div className="space-y-3">
                {schedule.map(item => {
                  if (item.type === "pickup") {
                    return (
                      <div key={`pickup-${item.order.id}`} className="flex gap-3">
                        <div className="w-[56px] flex-shrink-0 text-right pt-3.5">
                          <span className="text-[11px] font-['DM_Mono',monospace] text-[#988D84]">
                            {displayTime(item.scheduledAt)}
                          </span>
                        </div>
                        <div className="flex-shrink-0 w-5 flex justify-center pt-3.5">
                          <div className="w-3 h-3 rounded-full border-2 border-[#FBF8F3] z-10 bg-[#B4643B]" />
                        </div>
                        <article className="flex-1 rounded-[14px] border border-[#B4643B]/30 bg-[#F3DED1]/40 p-3.5">
                          <p className="text-[11px] font-bold uppercase text-[#B4643B]">Pickup event</p>
                          <p className="font-bold text-sm text-[#2F2925] mt-0.5">
                            {item.order.customer} · {item.order.id}
                          </p>
                          <p className="text-xs text-[#6F655E] mt-1">
                            {item.order.items.map(product => `${product.qty}× ${product.product}`).join(", ")}
                          </p>
                        </article>
                      </div>
                    );
                  }

                  return (
                    <ProductionTimeBlock
                      key={item.block.id}
                      block={item.block}
                      allTasks={tasks}
                      flows={flows}
                      currentTimeMs={currentTimeMs}
                      onCompleteBlock={taskIds => {
                        taskIds.forEach(id => {
                          updateTask(id, { status: "completed", timerRunning: false } as Partial<Task & ProductionTask>);
                        });
                      }}
                      onTaskComplete={id => updateTask(id, { status: "completed", timerRunning: false } as Partial<Task & ProductionTask>)}
                      onTaskStartTimer={id =>
                        updateTask(id, {
                          timerRunning: true,
                          timerStartedAt: new Date().toISOString(),
                          status: "in-progress",
                        } as Partial<Task>)
                      }
                      onTaskPauseTimer={(id, elapsedSeconds) =>
                        updateTask(id, { timerRunning: false, elapsedSeconds } as Partial<Task>)
                      }
                      onTaskDelay={(id, delayMinutes) => {
                        const task = tasks.find(candidate => candidate.id === id);
                        const currentScheduled = task?.scheduledAt ? new Date(task.scheduledAt) : new Date();
                        if (!isNaN(currentScheduled.getTime())) {
                          currentScheduled.setMinutes(currentScheduled.getMinutes() + delayMinutes);
                        }
                        const prevDelay = (task as unknown as { delayMinutes?: number } | undefined)?.delayMinutes || 0;
                        updateTask(id, {
                          delayMinutes: prevDelay + delayMinutes,
                          scheduledAt: currentScheduled.toISOString(),
                          time: displayTime(currentScheduled.toISOString()),
                        } as Partial<Task>);
                      }}
                      onTaskSkip={(id, reason) =>
                        updateTask(id, { status: "skipped", skipReason: reason, timerRunning: false } as Partial<Task>)
                      }
                      onTaskUpdate={updateTask}
                      prerequisiteNameForTask={dependencyFor}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {schedule.length === 0 && (
            <div className="bg-white rounded-[16px] border border-[#E5DDD3] p-8 text-center">
              <p className="text-[#2F2925] font-bold text-sm">No tasks in this view</p>
              <p className="text-[#988D84] text-xs mt-1">
                Try selecting "All" categories or choosing a different production day.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
