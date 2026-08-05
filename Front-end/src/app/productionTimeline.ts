import type { StarterBuild } from "./planning";
import type { ProductionStatus, ProductionTask } from "./production";
import type { Task, TaskStatus } from "./types";
import { BAKERY_TIME_ZONE, dateKey } from "./constants";

export type ProductionTimelineTask = Task | ProductionTask;
export type ProductionTimelineStatus = TaskStatus | ProductionStatus;

export type ProductionTimelineProductLine = {
  product: string;
  quantity: number;
  taskIds: string[];
  taskCount: number;
};

export type ProductionTimelineProgress = {
  total: number;
  completed: number;
  skipped: number;
  cancelled: number;
  active: number;
};

export type ProductionTimelineBlock = {
  id: string;
  selectedDay: string;
  scheduledAt: string;
  scheduledMinute: number;
  flowStepIdentity: string;
  title: string;
  category: string;
  tasks: ProductionTimelineTask[];
  taskIds: string[];
  productLines: ProductionTimelineProductLine[];
  progress: ProductionTimelineProgress;
  status: "active" | "completed" | "skipped" | "cancelled" | "mixed";
  activeTaskIds: string[];
  starterBuild?: StarterBuild;
};

const isActive = (status: ProductionTimelineStatus) =>
  status === "pending" || status === "in-progress" || status === "overdue";

const scheduledMinute = (scheduledAt: string) => {
  const date = new Date(scheduledAt);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime() / 60_000;
};

const bakeryMinuteKey = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BAKERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(entry => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};

const flowStepIdentity = (task: ProductionTimelineTask) =>
  task.flowStepId || `${task.category || "uncategorized"}:${task.title || "untitled"}`;

const statusFor = (progress: ProductionTimelineProgress): ProductionTimelineBlock["status"] => {
  if (progress.active > 0 && progress.completed + progress.skipped + progress.cancelled > 0) return "mixed";
  if (progress.active > 0) return "active";
  if (progress.completed === progress.total) return "completed";
  if (progress.skipped === progress.total) return "skipped";
  if (progress.cancelled === progress.total) return "cancelled";
  return "mixed";
};

/**
 * Creates a display-only production schedule for one ISO calendar day. The
 * returned blocks retain source tasks so execution continues through the
 * existing task update path.
 */
export function deriveProductionTimeline(
  tasks: readonly ProductionTimelineTask[],
  selectedDay: string,
  starterBuilds: readonly StarterBuild[] = [],
): ProductionTimelineBlock[] {
  const grouped = new Map<string, ProductionTimelineTask[]>();

  for (const task of tasks) {
    if (!task.scheduledAt || dateKey(task.scheduledAt) !== selectedDay) continue;
    const key = `${bakeryMinuteKey(task.scheduledAt)}:${flowStepIdentity(task)}`;
    grouped.set(key, [...(grouped.get(key) ?? []), task]);
  }

  return [...grouped.entries()].map(([id, blockTasks]) => {
    const first = blockTasks[0];
    const progress = blockTasks.reduce<ProductionTimelineProgress>((result, task) => {
      result.total += 1;
      if (task.status === "completed") result.completed += 1;
      else if (task.status === "skipped") result.skipped += 1;
      else if (task.status === "cancelled") result.cancelled += 1;
      else result.active += 1;
      return result;
    }, { total: 0, completed: 0, skipped: 0, cancelled: 0, active: 0 });
    const products = new Map<string, ProductionTimelineProductLine>();

    for (const task of blockTasks) {
      const existing = products.get(task.product);
      if (existing) {
        existing.quantity += task.quantity ?? 0;
        existing.taskIds.push(task.id);
        existing.taskCount += 1;
      } else {
        products.set(task.product, {
          product: task.product,
          quantity: task.quantity ?? 0,
          taskIds: [task.id],
          taskCount: 1,
        });
      }
    }

    const starterBuild = (first.category === "starter" || first.flowStepId === "build-starter")
      ? starterBuilds.find(build => bakeryMinuteKey(`${build.peakWindow}:00:00.000Z`).slice(0, 13) === bakeryMinuteKey(first.scheduledAt!).slice(0, 13))
      : undefined;

    return {
      id,
      selectedDay,
      scheduledAt: first.scheduledAt!,
      scheduledMinute: scheduledMinute(first.scheduledAt!),
      flowStepIdentity: flowStepIdentity(first),
      title: first.title,
      category: first.category,
      tasks: blockTasks,
      taskIds: blockTasks.map(task => task.id),
      productLines: [...products.values()],
      progress,
      status: statusFor(progress),
      activeTaskIds: blockTasks.filter(task => isActive(task.status)).map(task => task.id),
      starterBuild,
    };
  }).sort((left, right) =>
    left.scheduledMinute - right.scheduledMinute
    || left.flowStepIdentity.localeCompare(right.flowStepIdentity)
    || left.id.localeCompare(right.id)
  );
}
