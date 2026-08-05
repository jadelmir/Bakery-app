export type ProductionStatus = "pending" | "in-progress" | "completed" | "skipped" | "cancelled" | "overdue";
export type FlowStep = { id: string; name: string; instructions: string; dayOffset: number; time: string; duration: number; category: string; enabled: boolean; groupable?: boolean; dependsOn?: string };
export type ProductionFlow = { id: string; name: string; recipe: string; steps: FlowStep[]; isDefault?: boolean };
export type PlanOrder = { id: string; pickupDate: string; pickupTime: string; items: { id?: string; product: string; qty: number }[] };
export type ProductionTask = {
  id: string;
  orderId: string;
  orderItemId: string;
  flowId: string;
  flowStepId: string;
  title: string;
  product: string;
  quantity: number;
  scheduledAt: string;
  status: ProductionStatus;
  instructions: string;
  category: string;
  duration: number;
  dependencyIncomplete?: boolean;
  note?: string;
  skipReason?: string;
  timerRunning?: boolean;
  timerStartedAt?: string;
  elapsedSeconds?: number;
  delayMinutes?: number;
};
export type ScheduleWarning = { taskId?: string; message: string };

export interface TaskDependencyStatus {
  readonly isBlocked: boolean;
  readonly pendingPrerequisiteName?: string;
  readonly prerequisiteStepId?: string;
}

export const calculateTaskDependencyStatus = (
  task: ProductionTask,
  allTasks: ProductionTask[],
  flows: ProductionFlow[] = DEFAULT_FLOWS
): TaskDependencyStatus => {
  const flow = flows.find(f => f.id === task.flowId || f.recipe === task.product);
  const stepDef = flow?.steps.find(s => s.id === task.flowStepId);

  if (!stepDef?.dependsOn) {
    return { isBlocked: false };
  }

  const prereqStepDef = flow?.steps.find(s => s.id === stepDef.dependsOn);
  const prereqTask = allTasks.find(
    other => other.orderId === task.orderId && other.orderItemId === task.orderItemId && other.flowStepId === stepDef.dependsOn
  );

  if (prereqTask && prereqTask.status !== "completed") {
    return {
      isBlocked: true,
      pendingPrerequisiteName: prereqStepDef?.name ?? stepDef.dependsOn,
      prerequisiteStepId: stepDef.dependsOn,
    };
  }

  return { isBlocked: false };
};

const step = (id: string, name: string, dayOffset: number, time: string, category: string, instructions: string, dependsOn?: string): FlowStep => ({ id, name, dayOffset, time, category, instructions, duration: category === "baking" ? 35 : 15, enabled: true, groupable: category !== "baking", dependsOn });

export const DEFAULT_FLOWS: ProductionFlow[] = [
  { id: "flow-sourdough", name: "Standard Sourdough Loaf", recipe: "Sourdough Loaf", isDefault: true, steps: [
    step("starter-check", "Check starter and inventory", -2, "09:00", "prep", "Verify starter, ingredients, and packaging."),
    step("build-starter", "Build Starter", -1, "08:00", "starter", "Build active starter for the planned loaves.", "starter-check"),
    step("mix", "Mix Dough", -1, "14:00", "mixing", "Mix dough until incorporated.", "build-starter"),
    step("shape", "Shape Dough", -1, "20:00", "shaping", "Shape dough and place in bannetons.", "mix"),
    step("cold-ferment", "Begin Cold Fermentation", -1, "20:30", "ferment", "Refrigerate covered dough.", "shape"),
    step("bake", "Bake", 0, "10:30", "baking", "Bake until deeply browned.", "cold-ferment"),
    step("cool", "Cool", 0, "11:15", "ferment", "Cool completely before packaging.", "bake"),
    step("package", "Package", 0, "13:00", "packaging", "Package and label for pickup.", "cool") ] },
  { id: "flow-focaccia", name: "Standard Focaccia", recipe: "Focaccia", isDefault: true, steps: [
    step("starter-check", "Check starter and inventory", -2, "09:00", "prep", "Check flour, oil, toppings, tray, and packaging."),
    step("build-starter", "Build Starter", -1, "08:00", "starter", "Build active starter.", "starter-check"),
    step("mix", "Mix Focaccia Dough", -1, "14:00", "mixing", "Mix dough until incorporated.", "build-starter"),
    step("transfer", "Transfer to Tray", -1, "20:00", "shaping", "Transfer dough to an oiled tray.", "mix"),
    step("cold-ferment", "Begin Cold Fermentation", -1, "20:30", "ferment", "Refrigerate covered dough.", "transfer"),
    step("final-proof", "Final Proof", 0, "09:30", "ferment", "Bring dough to final proof.", "cold-ferment"),
    step("bake", "Bake Focaccia", 0, "10:30", "baking", "Bake until golden.", "final-proof"),
    step("package", "Package", 0, "13:00", "packaging", "Package and label for pickup.", "bake") ] },
];

const dateAt = (date: string, offset: number, time: string) => { const d = new Date(`${date}T${time}:00`); d.setDate(d.getDate() + offset); return d.toISOString(); };
export const generatePlan = (
  order: PlanOrder,
  flows = DEFAULT_FLOWS,
  existingTasks: ProductionTask[] = []
): { tasks: ProductionTask[]; warnings: ScheduleWarning[] } => {
  const initialTasks: ProductionTask[] = order.items.flatMap((item, index) => {
    const flow = flows.find(f => f.recipe === item.product || f.id === item.product);
    if (!flow) return [];
    const orderItemId = item.id || `${order.id}-${index}`;
    return flow.steps.filter(s => s.enabled).map(s => ({
      id: `${order.id}-${index}-${s.id}`,
      orderId: order.id,
      orderItemId,
      flowId: flow.id,
      flowStepId: s.id,
      title: s.name,
      product: item.product,
      quantity: item.qty,
      scheduledAt: dateAt(order.pickupDate, s.dayOffset, s.time),
      status: "pending" as ProductionStatus,
      instructions: s.instructions,
      category: s.category,
      duration: s.duration,
    }));
  }).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const taskMap = new Map<string, ProductionTask>();
  for (const t of initialTasks) {
    taskMap.set(t.id, t);
  }
  for (const et of existingTasks) {
    if (et.orderId === order.id) {
      taskMap.set(et.id, et);
    }
  }

  const allTaskList = Array.from(taskMap.values());
  const tasks = initialTasks.map(t => {
    const depStatus = calculateTaskDependencyStatus(t, allTaskList, flows);
    return { ...t, dependencyIncomplete: depStatus.isBlocked };
  });

  const warnings = tasks.filter(t => new Date(t.scheduledAt) > new Date(`${order.pickupDate}T${order.pickupTime}:00`)).map(t => ({ taskId: t.id, message: `${t.title} is scheduled after pickup.` }));
  return { tasks, warnings };
};

export const regenerateFutureTasks = (existing: ProductionTask[], order: PlanOrder, flows = DEFAULT_FLOWS) => {
  const historical = existing.filter(t => t.orderId === order.id && ["completed", "skipped", "cancelled"].includes(t.status));
  const retained = existing.filter(t => t.orderId !== order.id);
  const plan = generatePlan(order, flows, existing);
  return [...retained, ...historical, ...plan.tasks.filter(t => !historical.some(h => h.id === t.id))];
};

