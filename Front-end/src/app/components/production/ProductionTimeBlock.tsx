import { useId, useState } from "react";
import { Check, ChevronDown, ChevronUp, ClipboardList, Clock, Package } from "lucide-react";
import { displayTime } from "../../constants";
import type { ProductionFlow } from "../../production";
import type { ProductionTimelineBlock } from "../../productionTimeline";
import type { Task } from "../../types";
import { TaskExecutionCard } from "./TaskExecutionCard";

export type ProductionTimeBlockProps = {
  block: ProductionTimelineBlock;
  allTasks?: Task[];
  flows?: ProductionFlow[];
  currentTimeMs?: number;
  /** Completes every active source task through the owning screen's update path. */
  onCompleteBlock: (taskIds: string[]) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskStartTimer?: (taskId: string) => void;
  onTaskPauseTimer?: (taskId: string, elapsedSeconds: number) => void;
  onTaskDelay?: (taskId: string, delayMinutes: number) => void;
  onTaskSkip?: (taskId: string, reason: string) => void;
  onTaskUpdate?: (taskId: string, patch: Partial<Task>) => void;
  prerequisiteNameForTask?: (task: Task) => string | undefined;
};

const statusLabel: Record<ProductionTimelineBlock["status"], string> = {
  active: "In progress",
  completed: "Completed",
  skipped: "Skipped",
  cancelled: "Cancelled",
  mixed: "Partially complete",
};

function taskCountLabel(count: number) {
  return `${count} task${count === 1 ? "" : "s"}`;
}

/**
 * Presentation-only timeline block. Domain mutations are intentionally owned by
 * its caller so grouped completion retains the existing per-task update path.
 */
export function ProductionTimeBlock({
  block,
  allTasks = [],
  flows,
  currentTimeMs,
  onCompleteBlock,
  onTaskComplete,
  onTaskStartTimer,
  onTaskPauseTimer,
  onTaskDelay,
  onTaskSkip,
  onTaskUpdate,
  prerequisiteNameForTask,
}: ProductionTimeBlockProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const activeCount = block.activeTaskIds.length;
  const progressLabel = `${block.progress.completed} of ${block.progress.total} completed`;
  const time = displayTime(block.scheduledAt);

  return (
    <article className="flex gap-3 sm:gap-5" aria-label={`${time} ${block.title} production block`}>
      <div className="w-[64px] shrink-0 pt-3 text-right sm:w-[82px]">
        <time dateTime={block.scheduledAt} className="font-['DM_Mono',monospace] text-xs font-bold text-[#7A3E24]">
          {time}
        </time>
      </div>

      <div className="relative flex w-5 shrink-0 justify-center" aria-hidden="true">
        <span className="absolute top-0 bottom-0 w-px bg-[#E5DDD3]" />
        <span className="z-10 mt-4 h-3 w-3 rounded-full border-2 border-[#FBF8F3] bg-[#7A3E24]" />
      </div>

      <div className="min-w-0 flex-1 rounded-[16px] border border-[#E5DDD3] bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-[#2F2925]">{block.title}</h3>
              <span className="rounded-full bg-[#F6F0E8] px-2.5 py-0.5 text-[11px] font-bold text-[#6F655E]">
                {statusLabel[block.status]}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#6F655E]" aria-label={`Progress: ${progressLabel}`}>
              {progressLabel} · {taskCountLabel(block.progress.total)}
              {block.progress.skipped > 0 ? ` · ${block.progress.skipped} skipped` : ""}
            </p>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={() => onCompleteBlock(block.activeTaskIds)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-[#7A3E24] px-3.5 text-xs font-extrabold text-white hover:bg-[#934E2E]"
            >
              <Check size={14} /> Complete {activeCount === 1 ? "task" : `${activeCount} tasks`}
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-1.5 border-t border-[#F0E9E0] pt-3" aria-label="Product quantities">
          {block.productLines.map(line => (
            <p key={line.product} className="flex items-center gap-2 text-sm text-[#2F2925]">
              <Package size={14} className="shrink-0 text-[#B4643B]" aria-hidden="true" />
              <span><strong>{line.quantity}</strong> {line.product}</span>
              {line.taskCount > 1 ? <span className="text-xs text-[#988D84]">({taskCountLabel(line.taskCount)})</span> : null}
            </p>
          ))}
        </div>

        {block.starterBuild ? (
          <div className="mt-3 rounded-xl border border-[#B7D2E8] bg-[#EAF2F8] p-3 text-xs text-[#315B78]">
            <p className="font-extrabold">Starter preparation</p>
            <p className="mt-1">
              {block.starterBuild.seedAmount}g seed + {block.starterBuild.flourAmount}g flour + {block.starterBuild.waterAmount}g water
              {" · "}{block.starterBuild.usableAmount}g usable
            </p>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen(open => !open)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#7A3E24] hover:text-[#934E2E]"
        >
          <ClipboardList size={14} /> {detailsOpen ? "Hide task details" : "Actions & notes"}
          {detailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {detailsOpen ? (
          <section id={detailsId} className="mt-3 space-y-3 border-t border-[#F0E9E0] pt-3" aria-label={`${block.title} task details`}>
            {block.starterBuild ? (
              <div className="rounded-xl bg-[#F6F0E8] p-3 text-xs text-[#6F655E]">
                <p className="font-bold text-[#2F2925]">Starter build details</p>
                <p className="mt-1">
                  Retain {block.starterBuild.retainedAmount}g · total build {block.starterBuild.totalAmount}g
                </p>
              </div>
            ) : null}
            {block.tasks.map(task => (
              <TaskExecutionCard
                key={task.id}
                task={task as Task}
                allTasks={allTasks}
                flows={flows}
                prerequisiteName={prerequisiteNameForTask?.(task as Task)}
                onComplete={onTaskComplete}
                onStartTimer={onTaskStartTimer}
                onPauseTimer={onTaskPauseTimer}
                onDelayTask={onTaskDelay}
                onSkipTask={onTaskSkip}
                onUpdate={onTaskUpdate}
                currentTimeMs={currentTimeMs}
                starterBuild={block.starterBuild}
              />
            ))}
          </section>
        ) : null}
      </div>
    </article>
  );
}
