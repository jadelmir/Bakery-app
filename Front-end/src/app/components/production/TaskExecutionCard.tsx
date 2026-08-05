import { useState } from "react";
import {
  Play,
  Pause,
  Clock,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Ban,
  Timer as TimerIcon,
} from "lucide-react";
import { Chip } from "../shared/Chip";
import { TASK_STATUS, TASK_URGENCY, CAT_COLORS, displayTime } from "../../constants";
import {
  calculateTaskDependencyStatus,
  type ProductionTask,
  type ProductionFlow,
  DEFAULT_FLOWS,
} from "../../production";
import type { Task } from "../../types";

export interface TaskExecutionCardProps {
  task: Task;
  allTasks?: Task[];
  flows?: ProductionFlow[];
  prerequisiteName?: string;
  onComplete: (id: string) => void;
  onStartTimer?: (id: string) => void;
  onPauseTimer?: (id: string, elapsedSeconds: number) => void;
  onDelayTask?: (id: string, delayMinutes: number) => void;
  onSkipTask?: (id: string, reason: string) => void;
  onUpdate?: (id: string, patch: Partial<Task>) => void;
  currentTimeMs?: number;
  starterBuild?: {
    seedAmount: number;
    flourAmount: number;
    waterAmount: number;
    usableAmount: number;
  };
}

export function formatElapsedSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

type TimedTask = Task & {
  timerRunning?: boolean;
  timerStartedAt?: string;
  elapsedSeconds?: number;
};

export function calculateTaskElapsedSeconds(task: TimedTask, currentTimeMs = Date.now()): number {
  const accumulatedSeconds = task.elapsedSeconds ?? 0;
  if (!task.timerRunning || !task.timerStartedAt) return accumulatedSeconds;

  const startedAtMs = new Date(task.timerStartedAt).getTime();
  if (Number.isNaN(startedAtMs)) return accumulatedSeconds;

  return accumulatedSeconds + Math.max(0, Math.floor((currentTimeMs - startedAtMs) / 1000));
}

export function TaskExecutionCard({
  task,
  allTasks = [],
  flows = DEFAULT_FLOWS,
  prerequisiteName: propPrereqName,
  onComplete,
  onStartTimer,
  onPauseTimer,
  onDelayTask,
  onSkipTask,
  onUpdate,
  currentTimeMs,
  starterBuild,
}: TaskExecutionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showPrereqConfirmModal, setShowPrereqConfirmModal] = useState(false);
  const [skipReasonInput, setSkipReasonInput] = useState(task.skipReason || "");
  const [noteInput, setNoteInput] = useState(task.note || "");
  const [customDelay, setCustomDelay] = useState<number | "">(15);

  // Live timer calculation
  const taskExt = task as TimedTask & {
    timerRunning?: boolean;
    timerStartedAt?: string;
    elapsedSeconds?: number;
    delayMinutes?: number;
  };

  const isTimerRunning = Boolean(taskExt.timerRunning);
  const liveElapsed = calculateTaskElapsedSeconds(taskExt, currentTimeMs);

  // Dependency checking
  const depStatus = calculateTaskDependencyStatus(
    task as unknown as ProductionTask,
    allTasks as unknown as ProductionTask[],
    flows
  );
  const isBlocked = Boolean(propPrereqName) || (task.dependencyIncomplete ?? depStatus.isBlocked);
  const pendingPrereqName = propPrereqName || depStatus.pendingPrerequisiteName || "Upstream Step";

  const urgencyCfg = task.urgency ? TASK_URGENCY[task.urgency] : null;
  const dotColor = CAT_COLORS[task.category] || "#988D84";
  const isActive = task.status === "pending" || task.status === "in-progress";
  const formattedScheduledTime = task.scheduledAt ? displayTime(task.scheduledAt) : task.time;

  const handleStartTimer = () => {
    if (onStartTimer) {
      onStartTimer(task.id);
    } else if (onUpdate) {
      onUpdate(task.id, {
        timerRunning: true,
        timerStartedAt: new Date().toISOString(),
        status: task.status === "pending" ? "in-progress" : task.status,
      } as Partial<Task>);
    }
  };

  const handlePauseTimer = () => {
    if (onPauseTimer) {
      onPauseTimer(task.id, liveElapsed);
    } else if (onUpdate) {
      onUpdate(task.id, {
        timerRunning: false,
        elapsedSeconds: liveElapsed,
      } as Partial<Task>);
    }
  };

  const handleApplyDelay = (minutes: number) => {
    if (onDelayTask) {
      onDelayTask(task.id, minutes);
    } else if (onUpdate) {
      const currentScheduled = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
      if (!isNaN(currentScheduled.getTime())) {
        currentScheduled.setMinutes(currentScheduled.getMinutes() + minutes);
      }
      onUpdate(task.id, {
        delayMinutes: (taskExt.delayMinutes || 0) + minutes,
        scheduledAt: currentScheduled.toISOString(),
        time: displayTime(currentScheduled.toISOString()),
      } as Partial<Task>);
    }
    setShowDelayModal(false);
  };

  const handleApplySkip = () => {
    const reason = skipReasonInput.trim() || "Skipped by baker";
    if (onSkipTask) {
      onSkipTask(task.id, reason);
    } else if (onUpdate) {
      onUpdate(task.id, {
        status: "skipped",
        skipReason: reason,
        timerRunning: false,
      } as Partial<Task>);
    }
    setShowSkipModal(false);
  };

  const handleCompleteClick = () => {
    if (isBlocked) {
      setShowPrereqConfirmModal(true);
    } else {
      if (isTimerRunning) {
        handlePauseTimer();
      }
      onComplete(task.id);
    }
  };

  const confirmPrereqComplete = () => {
    setShowPrereqConfirmModal(false);
    if (isTimerRunning) {
      handlePauseTimer();
    }
    onComplete(task.id);
  };

  const handleSaveNote = () => {
    if (onUpdate) {
      onUpdate(task.id, { note: noteInput.trim() });
    }
  };

  const cardBorder =
    task.urgency === "overdue"
      ? "border-[#B8443C]/40 bg-[#FFF5F5] shadow-xs"
      : isTimerRunning
      ? "border-[#7A3E24] ring-2 ring-[#7A3E24]/20 bg-[#FAF1EB]/40 shadow-md"
      : task.status === "completed"
      ? "border-[#E5DDD3] bg-white opacity-70"
      : task.status === "skipped"
      ? "border-[#E5DDD3] bg-[#F9F7F5] opacity-75"
      : "border-[#E5DDD3] bg-white shadow-xs hover:border-[#D9CEC4]";

  return (
    <article className={`rounded-[16px] border p-4 transition-all duration-200 ${cardBorder}`}>
      {/* Header Info Bar */}
      <div className="flex items-start justify-between gap-3 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="pt-0.5 text-right flex-shrink-0">
            <span className="text-[11px] font-['DM_Mono',monospace] font-bold text-[#7A3E24] bg-[#FAF1EB] px-2 py-0.5 rounded-md border border-[#E5DDD3]">
              {formattedScheduledTime}
            </span>
          </div>

          <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: dotColor }} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-[#2F2925] text-sm leading-snug">{task.title}</h3>
              {taskExt.delayMinutes ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF4D8] text-[#B7791F] border border-[#B7791F]/30">
                  +{taskExt.delayMinutes}m Delayed
                </span>
              ) : null}
            </div>

            <p className="text-xs text-[#6F655E] mt-0.5 truncate">
              {task.product}
              {task.quantity ? ` · ${task.quantity}×` : ""}
              {task.orderId ? <span className="text-[#B4643B] font-bold"> · {task.orderId}</span> : null}
              <span className="text-[#988D84]"> · {task.duration} min est.</span>
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <Chip cfg={TASK_STATUS[task.status]} />
          {urgencyCfg && <Chip cfg={urgencyCfg} />}
          {isBlocked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFF4D8] text-[#B7791F] border border-[#B7791F]/40 shadow-2xs">
              <AlertTriangle size={12} className="text-[#B7791F]" />
              Prerequisite Pending: {pendingPrereqName}
            </span>
          )}
          <button
            type="button"
            aria-label="Toggle details"
            className="p-1 text-[#988D84] hover:text-[#2F2925] transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Active Timer Indicator Pill (if running or has elapsed time) */}
      {(isTimerRunning || liveElapsed > 0) && (
        <div className="mt-3 ml-[68px] flex items-center gap-3 bg-[#FAF1EB] border border-[#7A3E24]/20 rounded-[12px] p-2.5">
          <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${isTimerRunning ? "bg-[#7A3E24] text-white animate-pulse" : "bg-[#E5DDD3] text-[#7A3E24]"}`}>
            <TimerIcon size={15} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#988D84]">
              {isTimerRunning ? "Live Execution Timer" : "Elapsed Time"}
            </span>
            <p className="text-base font-extrabold font-['DM_Mono',monospace] text-[#7A3E24] leading-tight">
              {formatElapsedSeconds(liveElapsed)}
              <span className="text-xs font-normal text-[#988D84] ml-2">/ {task.duration}m est.</span>
            </p>
          </div>
        </div>
      )}

      {/* Expandable Task Instructions & Details */}
      {expanded && (
        <div className="mt-3 ml-[68px] space-y-3 pt-2 border-t border-[#F0E9E0]">
          <div className="bg-[#F6F0E8] rounded-xl p-3 text-xs text-[#6F655E] leading-relaxed">
            <p className="font-bold text-[#2F2925] mb-1">Instructions:</p>
            <p>{task.instructions}</p>
          </div>

          {task.flowStepId === "build-starter" && starterBuild && (
            <div className="bg-[#EAF2F8] rounded-xl p-3 text-xs text-[#4B6F8C]">
              <p className="font-bold mb-0.5">Starter Recipe Ratio:</p>
              <p>
                {starterBuild.seedAmount}g seed + {starterBuild.flourAmount}g flour + {starterBuild.waterAmount}g water · <b>{starterBuild.usableAmount}g usable</b>
              </p>
            </div>
          )}

          {task.note && (
            <p className="text-xs text-[#4B6F8C]">
              Note: {task.note}
            </p>
          )}

          {task.skipReason && (
            <p className="text-xs text-[#B8443C]">
              <b>Skip Reason:</b> {task.skipReason}
            </p>
          )}

          {/* Quick Note Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Add a production note"
              className="flex-1 h-8 rounded-[8px] border border-[#E5DDD3] px-2.5 text-xs text-[#2F2925] bg-white"
            />
            <button
              onClick={handleSaveNote}
              className="h-8 px-3 rounded-[8px] bg-[#FAF1EB] text-[#7A3E24] text-xs font-bold border border-[#E5DDD3] hover:bg-[#F3DED1]"
            >
              Save note
            </button>
          </div>

          {/* Quick Skip Input */}
          {isActive && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={skipReasonInput}
                onChange={e => setSkipReasonInput(e.target.value)}
                placeholder="Reason required"
                className="flex-1 h-8 rounded-[8px] border border-[#E5DDD3] px-2.5 text-xs text-[#2F2925] bg-white"
              />
              <button
                disabled={!skipReasonInput.trim()}
                onClick={handleApplySkip}
                className="h-8 px-3 rounded-[8px] bg-[#F6F0E8] text-[#6F655E] text-xs font-bold border border-[#E5DDD3] disabled:opacity-40"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Action Toolbar for Active Tasks */}
      {isActive && (
        <div className="mt-3.5 ml-[68px] flex items-center gap-2 flex-wrap">
          {/* Complete Button */}
          <button
            onClick={handleCompleteClick}
            className="h-9 px-4 rounded-[10px] bg-[#7A3E24] text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#934E2E] transition-all active:scale-[0.98] shadow-2xs"
          >
            <Check size={14} /> Complete
          </button>

          {/* Start / Pause Timer Toggle Button */}
          {isTimerRunning ? (
            <button
              onClick={handlePauseTimer}
              className="h-9 px-3.5 rounded-[10px] bg-[#FFF4D8] border border-[#B7791F]/40 text-[#B7791F] text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#FFEBB8] transition-colors"
            >
              <Pause size={13} /> Pause Timer
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="h-9 px-3.5 rounded-[10px] bg-[#FAF1EB] border border-[#E5DDD3] text-[#7A3E24] text-xs font-extrabold flex items-center gap-1.5 hover:bg-[#F3DED1] transition-colors"
            >
              <Play size={13} /> {liveElapsed > 0 || (taskExt.elapsedSeconds ?? 0) > 0 || task.status === "in-progress" ? "Resume Timer" : "Start Timer"}
            </button>
          )}

          {/* Delay Button */}
          <button
            onClick={() => setShowDelayModal(true)}
            className="h-9 px-3 rounded-[10px] bg-[#F6F0E8] text-[#6F655E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#EDE6DC] transition-colors"
          >
            <Clock size={13} /> Delay
          </button>

          {/* Skip Button */}
          <button
            onClick={() => setShowSkipModal(true)}
            className="h-9 px-3 rounded-[10px] bg-[#F6F0E8] text-[#6F655E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#EDE6DC] transition-colors"
          >
            <Ban size={13} /> Skip
          </button>

          {/* Actions & Notes Button */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="h-9 px-3 rounded-[10px] border border-[#E5DDD3] bg-white text-[#6F655E] text-xs font-semibold hover:bg-[#F6F0E8] transition-colors"
          >
            Actions & notes
          </button>
        </div>
      )}

      {/* Delay Modal Dialog */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] border border-[#E5DDD3] p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-[#2F2925] text-base flex items-center gap-2">
                <Clock size={18} className="text-[#7A3E24]" /> Postpone / Delay Task
              </h4>
              <button onClick={() => setShowDelayModal(false)} className="text-[#988D84] hover:text-[#2F2925]">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6F655E]">
              Select a preset postponement duration for <b>{task.title}</b>:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleApplyDelay(15)}
                className="h-11 rounded-[12px] bg-[#FAF1EB] border border-[#E5DDD3] text-[#7A3E24] text-xs font-extrabold hover:bg-[#7A3E24] hover:text-white transition-all flex items-center justify-center gap-1"
              >
                +15 Minutes
              </button>
              <button
                onClick={() => handleApplyDelay(30)}
                className="h-11 rounded-[12px] bg-[#FAF1EB] border border-[#E5DDD3] text-[#7A3E24] text-xs font-extrabold hover:bg-[#7A3E24] hover:text-white transition-all flex items-center justify-center gap-1"
              >
                +30 Minutes
              </button>
              <button
                onClick={() => handleApplyDelay(60)}
                className="h-11 rounded-[12px] bg-[#FAF1EB] border border-[#E5DDD3] text-[#7A3E24] text-xs font-extrabold hover:bg-[#7A3E24] hover:text-white transition-all flex items-center justify-center gap-1"
              >
                +1 Hour
              </button>
              <button
                onClick={() => handleApplyDelay(120)}
                className="h-11 rounded-[12px] bg-[#FAF1EB] border border-[#E5DDD3] text-[#7A3E24] text-xs font-extrabold hover:bg-[#7A3E24] hover:text-white transition-all flex items-center justify-center gap-1"
              >
                +2 Hours
              </button>
            </div>

            <div className="pt-2 border-t border-[#F0E9E0] flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customDelay}
                onChange={e => setCustomDelay(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Custom min"
                className="w-28 h-9 rounded-[8px] border border-[#E5DDD3] px-2 text-xs"
              />
              <button
                disabled={!customDelay || Number(customDelay) <= 0}
                onClick={() => handleApplyDelay(Number(customDelay))}
                className="flex-1 h-9 rounded-[8px] bg-[#7A3E24] text-white text-xs font-extrabold disabled:opacity-40"
              >
                Apply Custom Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Modal Dialog */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] border border-[#E5DDD3] p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-[#2F2925] text-base flex items-center gap-2">
                <Ban size={18} className="text-[#B8443C]" /> Record Skip Reason
              </h4>
              <button onClick={() => setShowSkipModal(false)} className="text-[#988D84] hover:text-[#2F2925]">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6F655E]">
              Provide a reason for skipping <b>{task.title}</b>:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {["Ingredient out of stock", "Customer order updated", "Equipment maintenance", "Chef decision"].map(
                preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSkipReasonInput(preset)}
                    className="px-2.5 py-1 rounded-full bg-[#F6F0E8] text-[#6F655E] text-[11px] font-semibold hover:bg-[#E5DDD3]"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            <textarea
              rows={3}
              value={skipReasonInput}
              onChange={e => setSkipReasonInput(e.target.value)}
              placeholder="Reason required"
              className="w-full rounded-[10px] border border-[#E5DDD3] p-2.5 text-xs text-[#2F2925]"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSkipModal(false)}
                className="h-9 px-4 rounded-[10px] border border-[#E5DDD3] text-[#6F655E] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!skipReasonInput.trim()}
                onClick={handleApplySkip}
                className="h-9 px-4 rounded-[10px] bg-[#B8443C] text-white text-xs font-extrabold disabled:opacity-40"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prerequisite Confirmation Warning Dialog */}
      {showPrereqConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[20px] border border-[#B7791F]/40 p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#B7791F]">
              <AlertTriangle size={22} />
              <h4 className="font-extrabold text-[#2F2925] text-base">Prerequisite Unresolved</h4>
            </div>

            <p className="text-xs text-[#6F655E] leading-relaxed">
              Upstream prerequisite step <b>"{pendingPrereqName}"</b> has not been completed. Are you sure you want to complete <b>{task.title}</b> anyway?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowPrereqConfirmModal(false)}
                className="h-9 px-4 rounded-[10px] border border-[#E5DDD3] text-[#6F655E] text-xs font-bold"
              >
                Go Back
              </button>
              <button
                onClick={confirmPrereqComplete}
                className="h-9 px-4 rounded-[10px] bg-[#B7791F] text-white text-xs font-extrabold"
              >
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
