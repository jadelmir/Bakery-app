import { buildStarterPlans, calculateRequirements, recordDeductions } from "../planning";
import { generatePlan, type ProductionTask } from "../production";
import { createFixtureSnapshots, FIXTURE_BAKERY_IDS } from "./fixtures";
import type {
  AdapterFailure,
  AdapterResult,
  AdjustInventoryInput,
  BakeryDomainAdapter,
  BakeryDomainSnapshot,
  CancelInvoiceInput,
  CartItem,
  CreateCustomerInput,
  CreateIngredientInput,
  CreateIngredientResult,
  DeleteIngredientResult,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  CreateOrderResult,
  CustomerResult,
  DelayTaskInput,
  DeleteProductionFlowInput,
  DomainClosedDate,
  DomainCustomer,
  DomainFlowStep,
  DomainInventoryItem,
  DomainInventoryTransaction,
  DomainInvoice,
  DomainInvoiceEvent,
  DomainInvoiceItem,
  DomainOperation,
  DomainOrder,
  DomainOrderItem,
  DomainPayment,
  DomainPaymentMethod,
  DomainPickupWindow,
  DomainProductionFlow,
  DomainRecipe,
  DomainRecipeIngredient,
  DomainStorefront,
  DomainStorefrontProduct,
  DomainTask,
  InventoryResult,
  InvoiceResult,
  InvoiceStatus,
  MarkOrderPaidResult,
  OnlineCheckoutInput,
  OnlineOrderResult,
  ProductionFlowResult,
  PublishRecipeInput,
  RecipeIngredientInput,
  RecipeResult,
  RecordMovementInput,
  RecordPaymentInput,
  RestockInventoryInput,
  SaveProductionFlowInput,
  SkipTaskInput,
  StartTaskTimerInput,
  StopTaskTimerInput,
  StorefrontPort,
  StorefrontResult,
  TaskExecutionState,
  TransitionOrderStatusResult,
  UpdateIngredientInput,
  UpdateIngredientResult,
  UpdateCustomerInput,
  UpdateInvoiceInput,
  UpdatePaymentMethodInput,
  UpdateStorefrontSettingsInput,
  UpdateTaskResult,
  ValidateOnlineCheckoutInput,
  ValidateOnlineCheckoutResult,
} from "./types";


export interface SessionLocalAdapterOptions {
  readonly snapshots?: Record<string, BakeryDomainSnapshot>;
  /** Deterministic failure injection for adapter and application-state tests. */
  readonly failures?: Partial<Record<DomainOperation, AdapterFailure>>;
}

type MutationResult = CreateOrderResult | TransitionOrderStatusResult | MarkOrderPaidResult | UpdateTaskResult | RecipeResult | CustomerResult | InvoiceResult | StorefrontResult | OnlineOrderResult | ProductionFlowResult | InventoryResult | CreateIngredientResult | UpdateIngredientResult | DeleteIngredientResult;


const clone = <T>(value: T): T => structuredClone(value);

const unknownBakery = (bakeryId: string): AdapterFailure => ({
  kind: "authorization", message: `Bakery ${bakeryId} is not available to this local session.`, retryable: false,
});

const validation = (message: string, field?: string): AdapterFailure => ({ kind: "validation", message, retryable: false, field });

const paymentStatusFor = (total: number, paid: number): "unpaid" | "partially-paid" | "paid" =>
  paid <= 0 ? "unpaid" : paid >= total ? "paid" : "partially-paid";

const toProductionTask = (task: DomainTask): ProductionTask => task;

const inventoryTransactions = (snapshot: BakeryDomainSnapshot): DomainInventoryTransaction[] => Object.values(snapshot.inventoryTransactionsById);

export function getIngredientUnitCost(
  inventoryItemId: string,
  ingInput: RecipeIngredientInput,
  snapshot: BakeryDomainSnapshot
): number {
  if (ingInput.unitCost !== undefined) return ingInput.unitCost;
  const item = snapshot.inventoryById[inventoryItemId];
  if (item?.unitCost !== undefined) return item.unitCost;
  if (item && item.packageQuantity && item.packageQuantity > 0 && item.packagePrice !== undefined) {
    return item.packagePrice / item.packageQuantity;
  }
  for (const recipe of Object.values(snapshot.recipesById)) {
    const found = recipe.ingredients.find((i) => i.inventoryItemId === inventoryItemId);
    if (found && found.quantity > 0 && found.cost > 0) {
      return found.cost / found.quantity;
    }
  }
  return 0;
}

export function computeRecipeBatchCostAndIngredients(
  ingredients: readonly RecipeIngredientInput[],
  snapshot: BakeryDomainSnapshot
): { batchCost: number; recipeIngredients: DomainRecipeIngredient[] } {
  let totalCost = 0;
  const recipeIngredients: DomainRecipeIngredient[] = ingredients.map((ing) => {
    const unitCost = getIngredientUnitCost(ing.inventoryItemId, ing, snapshot);
    const lineCost = Math.round(ing.quantity * unitCost * 10000) / 10000;
    totalCost += lineCost;
    return {
      inventoryItemId: ing.inventoryItemId,
      quantity: ing.quantity,
      cost: Math.round(lineCost * 100) / 100,
    };
  });
  return {
    batchCost: Math.round(totalCost * 100) / 100,
    recipeIngredients,
  };
}

export function calculateRecipeMargin(sellingPrice: number, batchCost: number): number {
  if (sellingPrice <= 0) return 0;
  const margin = ((sellingPrice - batchCost) / sellingPrice) * 100;
  return Math.round(margin * 100) / 100;
}

export function createSessionLocalBakeryDomainAdapter(options: SessionLocalAdapterOptions = {}): BakeryDomainAdapter {
  const snapshots = ensureStorefrontFixtures(ensureInvoicingFixtures(clone(options.snapshots ?? createFixtureSnapshots())));
  const operationResults = new Map<string, MutationResult>();

  const failureFor = (operation: DomainOperation): AdapterFailure | undefined => options.failures?.[operation];
  const resultFor = <T>(operation: DomainOperation, action: () => AdapterResult<T>): AdapterResult<T> => {
    const failure = failureFor(operation);
    return failure ? { ok: false, error: clone(failure) } : action();
  };
  const snapshotFor = (bakeryId: string): AdapterResult<BakeryDomainSnapshot> => {
    let snapshot = snapshots[bakeryId];
    if (!snapshot) {
      const base = snapshots[FIXTURE_BAKERY_IDS.EARLS] ?? Object.values(snapshots)[0];
      if (base) {
        snapshot = { ...structuredClone(base), bakeryId };
        snapshots[bakeryId] = snapshot;
      }
    }
    return snapshot ? { ok: true, data: snapshot } : { ok: false, error: unknownBakery(bakeryId) };
  };
  const operationKey = (bakeryId: string, operationId: string) => `${bakeryId}:${operationId}`;

  return {
    source: { durability: "session-local", description: "Deterministic in-memory bakery fixtures; data is discarded when the adapter is recreated." },

    async loadSnapshot({ bakeryId }) {
      return resultFor("load-snapshot", () => {
        const loaded = snapshotFor(bakeryId);
        return loaded.ok ? { ok: true, data: clone(loaded.data) } : loaded;
      });
    },

    async createOrder(input) {
      return resultFor("create-order", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as CreateOrderResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.orderId || snapshot.ordersById[input.orderId]) return { ok: false, error: validation("Order ID must be new within the bakery.", "orderId") };
        if (!snapshot.customersById[input.customerId]) return { ok: false, error: validation("The selected customer does not exist in this bakery.", "customerId") };
        if (!input.items.length || input.items.some((item) => item.quantity <= 0 || item.unitPrice < 0 || !snapshot.recipesById[item.recipeId])) {
          return { ok: false, error: validation("Each order item needs a known recipe, positive quantity, and non-negative price.", "items") };
        }

        const orderItems = input.items.map((item, index) => ({
          id: `${input.orderId}:item:${index + 1}`, orderId: input.orderId, recipeId: item.recipeId,
          product: snapshot.recipesById[item.recipeId].name, quantity: item.quantity, unitPrice: item.unitPrice,
        }));
        const total = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const order = {
          id: input.orderId, customerId: input.customerId, itemIds: orderItems.map((item) => item.id), pickupDate: input.pickupDate, pickupTime: input.pickupTime,
          status: "confirmed" as const, total, paid: input.paid, paymentStatus: paymentStatusFor(total, input.paid), notes: input.notes,
        };
        const generatedTasks = generateTasks(order, orderItems, Object.values(snapshot.flowsById ?? {}));
        snapshots[input.bakeryId] = {
          ...snapshot,
          ordersById: { ...snapshot.ordersById, [order.id]: order },
          orderItemsById: { ...snapshot.orderItemsById, ...Object.fromEntries(orderItems.map((item) => [item.id, item])) },
          tasksById: { ...snapshot.tasksById, ...Object.fromEntries(generatedTasks.map((task) => [task.id, task])) },
        };
        const data: CreateOrderResult = { kind: "order-created", operationId: input.operationId, changes: { orders: [order], orderItems, tasks: generatedTasks } };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async transitionOrderStatus(input) {
      return resultFor("transition-order-status", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as TransitionOrderStatusResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const order = snapshot.ordersById[input.orderId];
        if (!order) return { ok: false, error: validation("The order does not exist in this bakery.", "orderId") };
        if (order.status !== input.expectedStatus) return { ok: false, error: validation("The order status has changed; refresh and try again.", "expectedStatus") };

        const nextStatus: Partial<Record<typeof order.status, typeof input.targetStatus>> = {
          confirmed: "in-production",
          "in-production": "ready",
          ready: "completed",
        };
        if (nextStatus[order.status] !== input.targetStatus) {
          return { ok: false, error: validation("Orders can only advance to the next status in the manual lifecycle.", "targetStatus") };
        }

        const updatedOrder: DomainOrder = { ...order, status: input.targetStatus };
        snapshots[input.bakeryId] = {
          ...snapshot,
          ordersById: { ...snapshot.ordersById, [updatedOrder.id]: updatedOrder },
        };
        const data: TransitionOrderStatusResult = {
          kind: "order-status-transitioned",
          operationId: input.operationId,
          changes: { orders: [updatedOrder] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async markOrderPaid(input) {
      return resultFor("mark-order-paid", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as MarkOrderPaidResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const order = snapshot.ordersById[input.orderId];
        if (!order) return { ok: false, error: validation("The order does not exist in this bakery.", "orderId") };
        const updatedOrder: DomainOrder = { ...order, paid: order.total, paymentStatus: "paid" };
        snapshots[input.bakeryId] = {
          ...snapshot,
          ordersById: { ...snapshot.ordersById, [updatedOrder.id]: updatedOrder },
        };
        const data: MarkOrderPaidResult = {
          kind: "order-marked-paid",
          operationId: input.operationId,
          changes: { orders: [updatedOrder] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async updateTask(input) {
      return resultFor("update-task", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as UpdateTaskResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const task = snapshot.tasksById[input.taskId];
        if (!task) return { ok: false, error: validation("The production task does not exist in this bakery.", "taskId") };
        
        let newScheduledAt = input.patch.scheduledAt ?? task.scheduledAt;
        let newDelayMinutes = task.delayMinutes ?? 0;
        if (input.patch.delayMinutes !== undefined && input.patch.scheduledAt === undefined) {
          newDelayMinutes += input.patch.delayMinutes;
          const dt = new Date(task.scheduledAt);
          if (!isNaN(dt.getTime())) {
            dt.setMinutes(dt.getMinutes() + input.patch.delayMinutes);
            newScheduledAt = dt.toISOString();
          }
        }

        let newStatus = input.patch.status ?? task.status;
        if (input.patch.skipReason !== undefined && input.patch.status === undefined) {
          newStatus = "skipped";
        }

        const updatedTask: DomainTask = {
          ...task,
          ...input.patch,
          scheduledAt: newScheduledAt,
          delayMinutes: newDelayMinutes,
          status: newStatus,
        };
        const newTransactions = completedTaskDeductions(task, updatedTask, snapshot);

        let updatedInventoryById = snapshot.inventoryById;
        const updatedItemsList: DomainInventoryItem[] = [];

        if (newTransactions.length > 0) {
          const invCopy = { ...snapshot.inventoryById };
          for (const tx of newTransactions) {
            const item = invCopy[tx.itemId];
            if (item) {
              const nextOnHand = Math.max(0, item.onHand + tx.quantityChange);
              const updatedItem: DomainInventoryItem = {
                ...item,
                onHand: nextOnHand,
                status: nextOnHand <= 0 ? "out-of-stock" : nextOnHand <= item.minLevel ? "low" : "in-stock",
              };
              invCopy[tx.itemId] = updatedItem;
              updatedItemsList.push(updatedItem);
            }
          }
          updatedInventoryById = invCopy;
        }

        snapshots[input.bakeryId] = {
          ...snapshot,
          tasksById: { ...snapshot.tasksById, [updatedTask.id]: updatedTask },
          inventoryById: updatedInventoryById,
          inventoryTransactionsById: { ...snapshot.inventoryTransactionsById, ...Object.fromEntries(newTransactions.map((transaction) => [transaction.id, transaction])) },
        };
        const data: UpdateTaskResult = {
          kind: "task-updated",
          operationId: input.operationId,
          changes: {
            tasks: [updatedTask],
            inventoryTransactions: newTransactions,
            ...(updatedItemsList.length > 0 ? { inventoryItems: updatedItemsList } : {}),
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async startTaskTimer(input: StartTaskTimerInput) {
      return resultFor("start-task-timer", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as UpdateTaskResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const task = snapshot.tasksById[input.taskId];
        if (!task) return { ok: false, error: validation("The production task does not exist in this bakery.", "taskId") };

        const updatedTask: DomainTask = {
          ...task,
          timerRunning: true,
          timerStartedAt: new Date().toISOString(),
          status: task.status === "pending" ? "in-progress" : task.status,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          tasksById: { ...snapshot.tasksById, [updatedTask.id]: updatedTask },
        };

        const data: UpdateTaskResult = {
          kind: "task-updated",
          operationId: input.operationId,
          changes: { tasks: [updatedTask] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async stopTaskTimer(input: StopTaskTimerInput) {
      return resultFor("stop-task-timer", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as UpdateTaskResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const task = snapshot.tasksById[input.taskId];
        if (!task) return { ok: false, error: validation("The production task does not exist in this bakery.", "taskId") };

        let addedSeconds = input.elapsedSeconds ?? 0;
        if (input.elapsedSeconds === undefined && task.timerStartedAt) {
          const startMs = new Date(task.timerStartedAt).getTime();
          if (!isNaN(startMs)) {
            addedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          }
        }
        const currentElapsed = task.elapsedSeconds ?? 0;
        const newElapsedSeconds = currentElapsed + addedSeconds;

        const updatedTask: DomainTask = {
          ...task,
          timerRunning: false,
          timerStartedAt: undefined,
          elapsedSeconds: newElapsedSeconds,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          tasksById: { ...snapshot.tasksById, [updatedTask.id]: updatedTask },
        };

        const data: UpdateTaskResult = {
          kind: "task-updated",
          operationId: input.operationId,
          changes: { tasks: [updatedTask] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async delayTask(input: DelayTaskInput) {
      return resultFor("delay-task", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as UpdateTaskResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const task = snapshot.tasksById[input.taskId];
        if (!task) return { ok: false, error: validation("The production task does not exist in this bakery.", "taskId") };

        const currentDelay = task.delayMinutes ?? 0;
        const totalDelay = currentDelay + input.delayMinutes;
        let newScheduledAt = task.scheduledAt;
        const dt = new Date(task.scheduledAt);
        if (!isNaN(dt.getTime())) {
          dt.setMinutes(dt.getMinutes() + input.delayMinutes);
          newScheduledAt = dt.toISOString();
        }

        const updatedTask: DomainTask = {
          ...task,
          scheduledAt: newScheduledAt,
          delayMinutes: totalDelay,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          tasksById: { ...snapshot.tasksById, [updatedTask.id]: updatedTask },
        };

        const data: UpdateTaskResult = {
          kind: "task-updated",
          operationId: input.operationId,
          changes: { tasks: [updatedTask] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async skipTask(input: SkipTaskInput) {
      return resultFor("skip-task", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as UpdateTaskResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const task = snapshot.tasksById[input.taskId];
        if (!task) return { ok: false, error: validation("The production task does not exist in this bakery.", "taskId") };

        const updatedTask: DomainTask = {
          ...task,
          status: "skipped",
          skipReason: input.reason,
          timerRunning: false,
          timerStartedAt: undefined,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          tasksById: { ...snapshot.tasksById, [updatedTask.id]: updatedTask },
        };

        const data: UpdateTaskResult = {
          kind: "task-updated",
          operationId: input.operationId,
          changes: { tasks: [updatedTask] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async createIngredient(input) {
      return resultFor("create-order", () => {
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        const newItem: DomainInventoryItem = {
          id: input.ingredientId,
          name: input.name,
          unit: input.unit,
          onHand: 0,
          minLevel: input.minLevel,
          kind: input.kind,
          status: "out-of-stock",
          packageQuantity: input.packageQuantity,
          packagePrice: input.packagePrice,
          unitCost: input.packageQuantity > 0 ? input.packagePrice / input.packageQuantity : 0,
        };
        snapshots[input.bakeryId] = {
          ...snapshot,
          inventoryById: { ...snapshot.inventoryById, [newItem.id]: newItem },
        };
        return { ok: true, data: { kind: "ingredient-created", operationId: input.operationId, changes: { inventoryItems: [newItem] } } };
      });
    },

    async updateIngredient(input: UpdateIngredientInput) {
      return resultFor("create-order", () => {
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        const existing = snapshot.inventoryById[input.ingredientId];
        if (!existing) return { ok: false, error: validation("Inventory item not found", "ingredientId") };
        const unitCost = input.packageQuantity > 0 ? input.packagePrice / input.packageQuantity : 0;
        const updatedItem: DomainInventoryItem = {
          ...existing,
          name: input.name,
          unit: input.unit,
          minLevel: input.minLevel,
          kind: input.kind,
          packageQuantity: input.packageQuantity,
          packagePrice: input.packagePrice,
          unitCost,
          status: existing.onHand <= 0 ? "out-of-stock" : existing.onHand <= input.minLevel ? "low" : "in-stock",
        };
        snapshots[input.bakeryId] = {
          ...snapshot,
          inventoryById: { ...snapshot.inventoryById, [updatedItem.id]: updatedItem },
        };
        const data: UpdateIngredientResult = {
          kind: "ingredient-updated",
          operationId: input.operationId,
          changes: { inventoryItems: [updatedItem] },
        };
        return { ok: true, data };
      });
    },

    async deleteIngredient(input) {
      return resultFor("create-order", () => {
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!snapshot.inventoryById[input.ingredientId]) return { ok: false, error: validation("Inventory item not found", "ingredientId") };
        const { [input.ingredientId]: _removed, ...remainingItems } = snapshot.inventoryById;
        snapshots[input.bakeryId] = { ...snapshot, inventoryById: remainingItems };
        return {
          ok: true,
          data: {
            kind: "ingredient-deleted",
            operationId: input.operationId,
            changes: { inventoryItems: [] },
          },
        };
      });
    },

    async recordMovement(input) {
      return resultFor("update-task", () => {
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        const existing = snapshot.inventoryById[input.ingredientId];
        if (!existing) return { ok: false, error: validation("Ingredient not found", "ingredientId") };
        const nextOnHand = Math.max(0, existing.onHand + input.quantityChange);
        const updatedItem: DomainInventoryItem = {
          ...existing,
          onHand: nextOnHand,
          status: nextOnHand <= 0 ? "out-of-stock" : nextOnHand <= existing.minLevel ? "low" : "in-stock",
        };
        snapshots[input.bakeryId] = {
          ...snapshot,
          inventoryById: { ...snapshot.inventoryById, [updatedItem.id]: updatedItem },
        };
        return { ok: true, data: { kind: "movement-recorded", operationId: input.operationId, changes: { inventoryItems: [updatedItem] } } };
      });
    },

    async restockInventory(input: RestockInventoryInput) {
      return resultFor("restock-inventory", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InventoryResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const item = snapshot.inventoryById[input.itemId];
        if (!item) return { ok: false, error: validation("The inventory item does not exist in this bakery.", "itemId") };
        if (input.quantityAdded <= 0) {
          return { ok: false, error: validation("Restock quantity must be greater than zero.", "quantityAdded") };
        }

        const nextOnHand = item.onHand + input.quantityAdded;
        const updatedItem: DomainInventoryItem = {
          ...item,
          onHand: nextOnHand,
          status: nextOnHand <= 0 ? "out-of-stock" : nextOnHand <= item.minLevel ? "low" : "in-stock",
          ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
        };

        const txId = `tx-restock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const sourceKey = `restock:${input.operationId}`;
        const transaction: DomainInventoryTransaction = {
          id: txId,
          sourceKey,
          itemId: input.itemId,
          quantityChange: input.quantityAdded,
          reason: "restock",
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          inventoryById: { ...snapshot.inventoryById, [updatedItem.id]: updatedItem },
          inventoryTransactionsById: { ...snapshot.inventoryTransactionsById, [transaction.id]: transaction },
        };

        const data: InventoryResult = {
          kind: "inventory-mutated",
          operationId: input.operationId,
          changes: {
            inventoryItems: [updatedItem],
            inventoryTransactions: [transaction],
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async adjustInventory(input: AdjustInventoryInput) {
      return resultFor("adjust-inventory", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InventoryResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const item = snapshot.inventoryById[input.itemId];
        if (!item) return { ok: false, error: validation("The inventory item does not exist in this bakery.", "itemId") };

        const diff = input.newOnHand - item.onHand;
        const nextOnHand = Math.max(0, input.newOnHand);
        const updatedItem: DomainInventoryItem = {
          ...item,
          onHand: nextOnHand,
          status: nextOnHand <= 0 ? "out-of-stock" : nextOnHand <= item.minLevel ? "low" : "in-stock",
        };

        const txId = `tx-adjust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const sourceKey = `adjust:${input.operationId}`;
        const transaction: DomainInventoryTransaction = {
          id: txId,
          sourceKey,
          itemId: input.itemId,
          quantityChange: diff,
          reason: "adjustment",
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          inventoryById: { ...snapshot.inventoryById, [updatedItem.id]: updatedItem },
          inventoryTransactionsById: { ...snapshot.inventoryTransactionsById, [transaction.id]: transaction },
        };

        const data: InventoryResult = {
          kind: "inventory-mutated",
          operationId: input.operationId,
          changes: {
            inventoryItems: [updatedItem],
            inventoryTransactions: [transaction],
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async createRecipe(input) {
      return resultFor("create-recipe", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as RecipeResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.recipeId || snapshot.recipesById[input.recipeId]) {
          return { ok: false, error: validation("Recipe ID must be unique within the bakery.", "recipeId") };
        }
        if (!input.name || input.name.trim() === "") {
          return { ok: false, error: validation("Recipe name is required.", "name") };
        }
        if (input.sellingPrice < 0) {
          return { ok: false, error: validation("Selling price cannot be negative.", "sellingPrice") };
        }

        const { batchCost, recipeIngredients } = computeRecipeBatchCostAndIngredients(input.ingredients, snapshot);
        const marginPercent = calculateRecipeMargin(input.sellingPrice, batchCost);

        const newRecipe: DomainRecipe = {
          id: input.recipeId,
          name: input.name,
          yield: input.yield,
          batchCost,
          sellingPrice: input.sellingPrice,
          flowId: input.flowId,
          ingredients: recipeIngredients,
          archived: false,
          marginPercent,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          recipesById: { ...snapshot.recipesById, [newRecipe.id]: newRecipe },
        };

        const data: RecipeResult = {
          kind: "recipe-mutated",
          operationId: input.operationId,
          changes: { recipes: [newRecipe] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async updateRecipe(input) {
      return resultFor("update-recipe", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as RecipeResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const existing = snapshot.recipesById[input.recipeId];
        if (!existing) return { ok: false, error: validation("The recipe does not exist in this bakery.", "recipeId") };

        const name = input.name ?? existing.name;
        const yieldVal = input.yield ?? existing.yield;
        const sellingPrice = input.sellingPrice ?? existing.sellingPrice;
        const flowId = input.flowId === undefined ? existing.flowId : input.flowId;

        let batchCost = existing.batchCost;
        let recipeIngredients = existing.ingredients;

        if (input.ingredients) {
          const computed = computeRecipeBatchCostAndIngredients(input.ingredients, snapshot);
          batchCost = computed.batchCost;
          recipeIngredients = computed.recipeIngredients;
        }

        const marginPercent = calculateRecipeMargin(sellingPrice, batchCost);

        const updatedRecipe: DomainRecipe = {
          ...existing,
          name,
          yield: yieldVal,
          sellingPrice,
          flowId,
          batchCost,
          ingredients: recipeIngredients,
          marginPercent,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          recipesById: { ...snapshot.recipesById, [updatedRecipe.id]: updatedRecipe },
        };

        const data: RecipeResult = {
          kind: "recipe-mutated",
          operationId: input.operationId,
          changes: { recipes: [updatedRecipe] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async duplicateRecipe(input) {
      return resultFor("duplicate-recipe", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as RecipeResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const target = snapshot.recipesById[input.recipeId];
        if (!target) return { ok: false, error: validation("Source recipe does not exist.", "recipeId") };
        if (!input.newRecipeId || snapshot.recipesById[input.newRecipeId]) {
          return { ok: false, error: validation("New recipe ID must be unique within the bakery.", "newRecipeId") };
        }

        const duplicated: DomainRecipe = {
          ...target,
          id: input.newRecipeId,
          name: `${target.name} (Copy)`,
          archived: false,
          marginPercent: target.marginPercent ?? calculateRecipeMargin(target.sellingPrice, target.batchCost),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          recipesById: { ...snapshot.recipesById, [duplicated.id]: duplicated },
        };

        const data: RecipeResult = {
          kind: "recipe-mutated",
          operationId: input.operationId,
          changes: { recipes: [duplicated] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async archiveRecipe(input) {
      return resultFor("archive-recipe", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as RecipeResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const target = snapshot.recipesById[input.recipeId];
        if (!target) return { ok: false, error: validation("Recipe does not exist.", "recipeId") };

        const archivedRecipe: DomainRecipe = {
          ...target,
          archived: true,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          recipesById: { ...snapshot.recipesById, [archivedRecipe.id]: archivedRecipe },
        };

        const data: RecipeResult = {
          kind: "recipe-mutated",
          operationId: input.operationId,
          changes: { recipes: [archivedRecipe] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async restoreRecipe(input) {
      return resultFor("restore-recipe", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as RecipeResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const target = snapshot.recipesById[input.recipeId];
        if (!target) return { ok: false, error: validation("Recipe does not exist.", "recipeId") };

        const restoredRecipe: DomainRecipe = {
          ...target,
          archived: false,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          recipesById: { ...snapshot.recipesById, [restoredRecipe.id]: restoredRecipe },
        };

        const data: RecipeResult = {
          kind: "recipe-mutated",
          operationId: input.operationId,
          changes: { recipes: [restoredRecipe] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async createCustomer(input) {
      return resultFor("create-customer", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as CustomerResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.customerId || snapshot.customersById[input.customerId]) {
          return { ok: false, error: validation("Customer ID must be unique within the bakery.", "customerId") };
        }
        if (!input.name || input.name.trim() === "") {
          return { ok: false, error: validation("Customer name is required.", "name") };
        }
        if (!input.email || input.email.trim() === "") {
          return { ok: false, error: validation("Customer email is required.", "email") };
        }

        const newCustomer: DomainCustomer = {
          id: input.customerId,
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone,
          type: input.type,
          address: input.address,
          notes: input.notes,
          totalOrders: 0,
          totalSpent: 0,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          customersById: { ...snapshot.customersById, [newCustomer.id]: newCustomer },
        };

        const data: CustomerResult = {
          kind: "customer-mutated",
          operationId: input.operationId,
          changes: { customers: [newCustomer] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async updateCustomer(input) {
      return resultFor("update-customer", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as CustomerResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const existing = snapshot.customersById[input.customerId];
        if (!existing) return { ok: false, error: validation("The customer does not exist in this bakery.", "customerId") };

        const updatedCustomer: DomainCustomer = {
          ...existing,
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.email !== undefined ? { email: input.email.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          customersById: { ...snapshot.customersById, [updatedCustomer.id]: updatedCustomer },
        };

        const data: CustomerResult = {
          kind: "customer-mutated",
          operationId: input.operationId,
          changes: { customers: [updatedCustomer] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async createInvoice(input) {
      return resultFor("create-invoice", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InvoiceResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.invoiceId || (snapshot.invoicesById && snapshot.invoicesById[input.invoiceId])) {
          return { ok: false, error: validation("Invoice ID must be unique within the bakery.", "invoiceId") };
        }
        const customer = snapshot.customersById[input.customerId];
        if (!customer) {
          return { ok: false, error: validation("The selected customer does not exist in this bakery.", "customerId") };
        }

        let itemsToUse: readonly CreateInvoiceItemInput[] = input.items ?? [];
        if (itemsToUse.length === 0 && input.orderId) {
          const order = snapshot.ordersById[input.orderId];
          if (order) {
            const orderItems = order.itemIds.map((itemId) => snapshot.orderItemsById[itemId]).filter(Boolean);
            itemsToUse = orderItems.map((item) => ({
              description: item.product,
              quantity: item.quantity,
              unitPriceCents: Math.round(item.unitPrice * 100),
              recipeId: item.recipeId,
            }));
          }
        }

        if (itemsToUse.length === 0) {
          return { ok: false, error: validation("Invoice must contain at least one line item.", "items") };
        }

        const domainItems: DomainInvoiceItem[] = itemsToUse.map((item, idx) => {
          const totalCents = Math.round(item.quantity * item.unitPriceCents);
          return {
            id: `${input.invoiceId}:item:${idx + 1}`,
            invoiceId: input.invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents,
            recipeId: item.recipeId,
          };
        });

        const subtotalCents = domainItems.reduce((sum, item) => sum + item.totalCents, 0);
        const taxCents = input.taxCents ?? 0;
        const discountCents = input.discountCents ?? 0;
        const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
        const amountPaidCents = 0;
        const balanceCents = totalCents;

        const currentInvoices = Object.values(snapshot.invoicesById ?? {});
        const count = currentInvoices.length + 1;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${count.toString().padStart(3, "0")}`;
        const publicToken = `tok_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
        const issueDate = input.issueDate ?? new Date().toISOString().split("T")[0];

        const invoice: DomainInvoice = {
          id: input.invoiceId,
          bakeryId: input.bakeryId,
          invoiceNumber,
          publicToken,
          orderId: input.orderId,
          customerId: input.customerId,
          customerName: customer.name,
          customerEmail: customer.email,
          status: "Draft",
          issueDate,
          dueDate: input.dueDate,
          subtotalCents,
          taxCents,
          discountCents,
          totalCents,
          amountPaidCents,
          balanceCents,
          items: domainItems,
          notes: input.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const event: DomainInvoiceEvent = {
          id: `${input.invoiceId}:evt:created`,
          invoiceId: input.invoiceId,
          eventType: "created",
          notes: "Invoice created",
          createdAt: new Date().toISOString(),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          invoicesById: { ...snapshot.invoicesById, [invoice.id]: invoice },
          invoiceEventsById: { ...snapshot.invoiceEventsById, [event.id]: event },
        };

        const data: InvoiceResult = {
          kind: "invoice-mutated",
          operationId: input.operationId,
          changes: { invoices: [invoice], invoiceEvents: [event] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async updateInvoice(input) {
      return resultFor("update-invoice", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InvoiceResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const existing = snapshot.invoicesById?.[input.invoiceId];
        if (!existing) return { ok: false, error: validation("Invoice not found.", "invoiceId") };

        let domainItems = existing.items;
        let subtotalCents = existing.subtotalCents;
        if (input.items && input.items.length > 0) {
          domainItems = input.items.map((item, idx) => ({
            id: `${input.invoiceId}:item:${idx + 1}`,
            invoiceId: input.invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalCents: Math.round(item.quantity * item.unitPriceCents),
            recipeId: item.recipeId,
          }));
          subtotalCents = domainItems.reduce((sum, item) => sum + item.totalCents, 0);
        }

        const taxCents = input.taxCents ?? existing.taxCents;
        const discountCents = input.discountCents ?? existing.discountCents;
        const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
        const balanceCents = Math.max(0, totalCents - existing.amountPaidCents);

        let status = input.status ?? existing.status;
        if (balanceCents === 0 && totalCents > 0) {
          status = "Paid";
        } else if (existing.amountPaidCents > 0 && status === "Draft") {
          status = "Partially paid";
        }

        const updatedInvoice: DomainInvoice = {
          ...existing,
          dueDate: input.dueDate ?? existing.dueDate,
          items: domainItems,
          subtotalCents,
          taxCents,
          discountCents,
          totalCents,
          balanceCents,
          status,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          updatedAt: new Date().toISOString(),
        };

        const event: DomainInvoiceEvent = {
          id: `${input.invoiceId}:evt:updated:${Date.now()}`,
          invoiceId: input.invoiceId,
          eventType: "status_changed",
          notes: `Invoice updated. Status: ${status}`,
          createdAt: new Date().toISOString(),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          invoicesById: { ...snapshot.invoicesById, [updatedInvoice.id]: updatedInvoice },
          invoiceEventsById: { ...snapshot.invoiceEventsById, [event.id]: event },
        };

        const data: InvoiceResult = {
          kind: "invoice-mutated",
          operationId: input.operationId,
          changes: { invoices: [updatedInvoice], invoiceEvents: [event] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async recordPayment(input) {
      return resultFor("record-payment", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InvoiceResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const invoice = snapshot.invoicesById?.[input.invoiceId];
        if (!invoice) return { ok: false, error: validation("Invoice not found.", "invoiceId") };
        if (input.amountCents <= 0) {
          return { ok: false, error: validation("Payment amount must be greater than zero.", "amountCents") };
        }

        const newAmountPaidCents = invoice.amountPaidCents + input.amountCents;
        const newBalanceCents = Math.max(0, invoice.totalCents - newAmountPaidCents);
        const newStatus: InvoiceStatus = newBalanceCents === 0 ? "Paid" : "Partially paid";

        const updatedInvoice: DomainInvoice = {
          ...invoice,
          amountPaidCents: newAmountPaidCents,
          balanceCents: newBalanceCents,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        const payment: DomainPayment = {
          id: input.paymentId,
          invoiceId: input.invoiceId,
          bakeryId: input.bakeryId,
          paymentMethodId: input.paymentMethodId,
          paymentMethodType: input.paymentMethodType,
          amountCents: input.amountCents,
          paymentDate: input.paymentDate,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          createdAt: new Date().toISOString(),
        };

        const event: DomainInvoiceEvent = {
          id: `${input.invoiceId}:evt:payment:${Date.now()}`,
          invoiceId: input.invoiceId,
          eventType: "payment_recorded",
          notes: `Recorded payment of $${(input.amountCents / 100).toFixed(2)} via ${input.paymentMethodType}`,
          createdAt: new Date().toISOString(),
        };

        let updatedOrder;
        if (invoice.orderId && snapshot.ordersById[invoice.orderId]) {
          const order = snapshot.ordersById[invoice.orderId];
          const addedPaidDollars = input.amountCents / 100;
          const nextPaidDollars = order.paid + addedPaidDollars;
          const nextPaymentStatus = paymentStatusFor(order.total, nextPaidDollars);
          updatedOrder = {
            ...order,
            paid: nextPaidDollars,
            paymentStatus: nextPaymentStatus,
          };
        }

        snapshots[input.bakeryId] = {
          ...snapshot,
          invoicesById: { ...snapshot.invoicesById, [updatedInvoice.id]: updatedInvoice },
          paymentsById: { ...snapshot.paymentsById, [payment.id]: payment },
          invoiceEventsById: { ...snapshot.invoiceEventsById, [event.id]: event },
          ...(updatedOrder ? { ordersById: { ...snapshot.ordersById, [updatedOrder.id]: updatedOrder } } : {}),
        };

        const data: InvoiceResult = {
          kind: "invoice-mutated",
          operationId: input.operationId,
          changes: {
            invoices: [updatedInvoice],
            payments: [payment],
            invoiceEvents: [event],
            ...(updatedOrder ? { orders: [updatedOrder] } : {}),
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async cancelInvoice(input) {
      return resultFor("cancel-invoice", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InvoiceResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const invoice = snapshot.invoicesById?.[input.invoiceId];
        if (!invoice) return { ok: false, error: validation("Invoice not found.", "invoiceId") };

        const cancelledInvoice: DomainInvoice = {
          ...invoice,
          status: "Cancelled",
          updatedAt: new Date().toISOString(),
        };

        const event: DomainInvoiceEvent = {
          id: `${input.invoiceId}:evt:cancelled:${Date.now()}`,
          invoiceId: input.invoiceId,
          eventType: "cancelled",
          notes: input.reason ?? "Invoice cancelled",
          createdAt: new Date().toISOString(),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          invoicesById: { ...snapshot.invoicesById, [cancelledInvoice.id]: cancelledInvoice },
          invoiceEventsById: { ...snapshot.invoiceEventsById, [event.id]: event },
        };

        const data: InvoiceResult = {
          kind: "invoice-mutated",
          operationId: input.operationId,
          changes: { invoices: [cancelledInvoice], invoiceEvents: [event] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async updatePaymentMethods(input) {
      return resultFor("update-payment-methods", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as InvoiceResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };

        const updatedMethodsById = {
          ...snapshot.paymentMethodsById,
          ...indexByEntityId(input.paymentMethods),
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          paymentMethodsById: updatedMethodsById,
        };

        const data: InvoiceResult = {
          kind: "invoice-mutated",
          operationId: input.operationId,
          changes: { paymentMethods: input.paymentMethods },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async getStorefrontBySlug(slug: string) {
      for (const snapshot of Object.values(snapshots)) {
        if (snapshot.storefront && (snapshot.storefront.slug === slug || (slug === "earls-bakery" && snapshot.storefront.slug === "jadore-bakery") || (slug === "jadore-bakery" && snapshot.storefront.slug === "earls-bakery"))) {
          return {
            ok: true as const,
            data: clone({
              storefront: snapshot.storefront,
              products: Object.values(snapshot.storefrontProducts ?? {}),
              pickupWindows: Object.values(snapshot.pickupWindows ?? {}),
              closedDates: Object.values(snapshot.closedDates ?? {}),
            }),
          };
        }
      }
      return {
        ok: false as const,
        error: validation(`Storefront with slug "${slug}" was not found.`, "slug"),
      };
    },

    async updateStorefrontSettings(input: UpdateStorefrontSettingsInput) {
      return resultFor("update-storefront-settings", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as StorefrontResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };

        const existingStore = snapshot.storefront ?? {
          id: `sf-${input.bakeryId}`,
          bakeryId: input.bakeryId,
          name: "Bakery Storefront",
          slug: input.slug ?? `store-${input.bakeryId}`,
          isEnabled: true,
          capacityRules: { minimumLeadTimeHours: 24 },
        };

        const updatedStorefront: DomainStorefront = {
          ...existingStore,
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
          capacityRules: {
            ...existingStore.capacityRules,
            ...(input.capacityRules ?? {}),
          },
          updatedAt: new Date().toISOString(),
        };

        const updatedPickupWindows = input.pickupWindows !== undefined
          ? indexByEntityId(input.pickupWindows)
          : (snapshot.pickupWindows ?? {});

        const updatedClosedDates = input.closedDates !== undefined
          ? indexByEntityId(input.closedDates)
          : (snapshot.closedDates ?? {});

        snapshots[input.bakeryId] = {
          ...snapshot,
          storefront: updatedStorefront,
          pickupWindows: updatedPickupWindows,
          closedDates: updatedClosedDates,
        };

        const data: StorefrontResult = {
          kind: "storefront-mutated",
          operationId: input.operationId,
          changes: {
            storefront: updatedStorefront,
            pickupWindows: Object.values(updatedPickupWindows),
            closedDates: Object.values(updatedClosedDates),
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async publishRecipeToStorefront(input: PublishRecipeInput) {
      return resultFor("publish-storefront-product", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as StorefrontResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        const recipe = snapshot.recipesById[input.recipeId];
        if (!recipe) return { ok: false, error: validation("Recipe does not exist in this bakery.", "recipeId") };

        const storefront = snapshot.storefront ?? {
          id: `sf-${input.bakeryId}`,
          bakeryId: input.bakeryId,
          name: "Bakery Storefront",
          slug: `store-${input.bakeryId}`,
          isEnabled: true,
          capacityRules: { minimumLeadTimeHours: 24 },
        };

        const existingProds = snapshot.storefrontProducts ?? {};
        const existingProd = Object.values(existingProds).find((p) => p.recipeId === input.recipeId);
        const prodId = existingProd?.id ?? `sf-prod-${input.recipeId}`;

        const product: DomainStorefrontProduct = {
          id: prodId,
          storefrontId: storefront.id,
          recipeId: input.recipeId,
          publicName: input.publicName,
          publicDescription: input.publicDescription,
          onlinePriceCents: input.onlinePriceCents,
          imagePath: input.imagePath,
          isPublished: input.isPublished,
          isSoldOut: input.isSoldOut ?? false,
          updatedAt: new Date().toISOString(),
        };

        const updatedProducts = {
          ...existingProds,
          [product.id]: product,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          storefront,
          storefrontProducts: updatedProducts,
        };

        const data: StorefrontResult = {
          kind: "storefront-mutated",
          operationId: input.operationId,
          changes: {
            storefrontProducts: [product],
          },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async validateOnlineCheckout(input: ValidateOnlineCheckoutInput) {
      for (const snapshot of Object.values(snapshots)) {
        if (snapshot.storefront && (snapshot.storefront.slug === input.slug || (input.slug === "earls-bakery" && snapshot.storefront.slug === "jadore-bakery") || (input.slug === "jadore-bakery" && snapshot.storefront.slug === "earls-bakery"))) {
          const validationResult = validateOnlineCheckoutInternal(snapshot, input);
          return { ok: true as const, data: validationResult };
        }
      }
      return {
        ok: true as const,
        data: { valid: false, reason: `Storefront "${input.slug}" not found.`, code: "INVALID_INPUT" as const },
      };
    },

    async submitOnlineOrder(input: OnlineCheckoutInput) {
      return resultFor("submit-online-order", () => {
        let targetBakeryId = input.bakeryId;
        let targetSnapshot: BakeryDomainSnapshot | undefined;

        if (targetBakeryId && snapshots[targetBakeryId]) {
          targetSnapshot = snapshots[targetBakeryId];
        } else {
          for (const [bId, snap] of Object.entries(snapshots)) {
            if (snap.storefront && (snap.storefront.slug === input.slug || (input.slug === "earls-bakery" && snap.storefront.slug === "jadore-bakery") || (input.slug === "jadore-bakery" && snap.storefront.slug === "earls-bakery"))) {
              targetBakeryId = bId;
              targetSnapshot = snap;
              break;
            }
          }
        }

        if (!targetBakeryId || !targetSnapshot) {
          return { ok: false, error: validation(`Storefront with slug "${input.slug}" not found.`, "slug") };
        }

        const opId = input.operationId ?? input.idempotencyKey ?? `online-op-${Date.now()}`;
        const cached = operationResults.get(operationKey(targetBakeryId, opId));
        if (cached) return { ok: true, data: clone(cached as OnlineOrderResult) };

        const validationResult = validateOnlineCheckoutInternal(targetSnapshot, input);
        if (!validationResult.valid) {
          return { ok: false, error: validation(validationResult.reason ?? "Checkout validation failed.") };
        }

        const normEmail = input.customerEmail.toLowerCase().trim();
        const customer = Object.values(targetSnapshot.customersById).find(
          (c) => c.email.toLowerCase().trim() === normEmail
        );

        let customerCreatedOrUpdated: DomainCustomer;
        if (customer) {
          customerCreatedOrUpdated = {
            ...customer,
            ...(input.customerName ? { name: input.customerName.trim() } : {}),
            ...(input.customerPhone ? { phone: input.customerPhone.trim() } : {}),
            totalOrders: (customer.totalOrders ?? 0) + 1,
          };
        } else {
          const custId = `cust-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          customerCreatedOrUpdated = {
            id: custId,
            name: input.customerName.trim(),
            email: input.customerEmail.trim(),
            phone: input.customerPhone?.trim(),
            type: "retail",
            address: input.deliveryAddress,
            totalOrders: 1,
            totalSpent: 0,
          };
        }

        const orderId = `order-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const orderItems: DomainOrderItem[] = input.items.map((item, idx) => {
          const prods = Object.values(targetSnapshot!.storefrontProducts ?? {});
          const matchedProd = prods.find((p) => p.id === item.productId || p.recipeId === item.productId || p.recipeId === item.recipeId);
          const recipeId = matchedProd?.recipeId ?? item.recipeId ?? item.productId;
          const recipe = targetSnapshot!.recipesById[recipeId];
          const productName = recipe?.name ?? matchedProd?.publicName ?? "Baked Item";
          const unitPriceDollars = item.unitPriceCents !== undefined
            ? item.unitPriceCents / 100
            : matchedProd
            ? matchedProd.onlinePriceCents / 100
            : recipe
            ? recipe.sellingPrice
            : 0;

          return {
            id: `${orderId}:item:${idx + 1}`,
            orderId,
            recipeId,
            product: productName,
            quantity: item.quantity,
            unitPrice: unitPriceDollars,
          };
        });

        const totalDollars = orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
        const updatedCustomer = {
          ...customerCreatedOrUpdated,
          totalSpent: (customerCreatedOrUpdated.totalSpent ?? 0) + totalDollars,
        };

        const order: DomainOrder = {
          id: orderId,
          customerId: updatedCustomer.id,
          itemIds: orderItems.map((it) => it.id),
          pickupDate: input.fulfillmentDate,
          pickupTime: input.fulfillmentTimeWindow ?? "10:00",
          status: "confirmed",
          total: totalDollars,
          paid: 0,
          paymentStatus: "unpaid",
          notes: input.notes,
        };

        const generatedTasks = generateTasks(order, orderItems, Object.values(targetSnapshot.flowsById ?? {}));

        snapshots[targetBakeryId] = {
          ...targetSnapshot,
          customersById: {
            ...targetSnapshot.customersById,
            [updatedCustomer.id]: updatedCustomer,
          },
          ordersById: {
            ...targetSnapshot.ordersById,
            [order.id]: order,
          },
          orderItemsById: {
            ...targetSnapshot.orderItemsById,
            ...Object.fromEntries(orderItems.map((it) => [it.id, it])),
          },
          tasksById: {
            ...targetSnapshot.tasksById,
            ...Object.fromEntries(generatedTasks.map((t) => [t.id, t])),
          },
        };

        const data: OnlineOrderResult = {
          kind: "online-order-submitted",
          operationId: opId,
          orderId: order.id,
          customerId: updatedCustomer.id,
          changes: {
            customers: [updatedCustomer],
            orders: [order],
            orderItems,
            tasks: generatedTasks,
          },
        };
        operationResults.set(operationKey(targetBakeryId, opId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async saveProductionFlow(input: SaveProductionFlowInput) {
      return resultFor("save-production-flow", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as ProductionFlowResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.flow || !input.flow.id) return { ok: false, error: validation("Flow and Flow ID are required.", "flow") };

        const currentFlows = snapshot.flowsById ?? {};
        const updatedFlows = {
          ...currentFlows,
          [input.flow.id]: input.flow,
        };

        snapshots[input.bakeryId] = {
          ...snapshot,
          flowsById: updatedFlows,
        };

        const data: ProductionFlowResult = {
          kind: "production-flow-mutated",
          operationId: input.operationId,
          changes: { flows: [input.flow] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },

    async deleteProductionFlow(input: DeleteProductionFlowInput) {
      return resultFor("delete-production-flow", () => {
        const cached = operationResults.get(operationKey(input.bakeryId, input.operationId));
        if (cached) return { ok: true, data: clone(cached as ProductionFlowResult) };
        const loaded = snapshotFor(input.bakeryId);
        if (!loaded.ok) return loaded;
        const snapshot = loaded.data;
        if (!input.operationId) return { ok: false, error: validation("An operation ID is required for a safe retry.", "operationId") };
        if (!input.flowId) return { ok: false, error: validation("Flow ID is required.", "flowId") };

        const currentFlows = { ...(snapshot.flowsById ?? {}) };
        delete currentFlows[input.flowId];

        snapshots[input.bakeryId] = {
          ...snapshot,
          flowsById: currentFlows,
        };

        const data: ProductionFlowResult = {
          kind: "production-flow-mutated",
          operationId: input.operationId,
          changes: { deletedFlowIds: [input.flowId] },
        };
        operationResults.set(operationKey(input.bakeryId, input.operationId), data);
        return { ok: true, data: clone(data) };
      });
    },
  };
}

function generateTasks(
  order: { readonly id: string; readonly pickupDate: string; readonly pickupTime: string },
  items: readonly { readonly id: string; readonly product: string; readonly quantity: number }[],
  flows?: DomainProductionFlow[]
): DomainTask[] {
  // Imported pure production utility keeps generated work consistent with the prototype.
  return generatePlan(
    {
      ...order,
      items: items.map((item) => ({ id: item.id, product: item.product, qty: item.quantity })),
    },
    flows && flows.length > 0 ? flows : undefined
  ).tasks.map((task) => ({ ...task, status: task.status as DomainTask["status"] }));
}


function completedTaskDeductions(previous: DomainTask, next: DomainTask, snapshot: BakeryDomainSnapshot): DomainInventoryTransaction[] {
  if (previous.status === "completed" || next.status !== "completed") return [];
  const tasks = Object.values(snapshot.tasksById).map(toProductionTask);
  const inventory = Object.values(snapshot.inventoryById).map((item) => ({ id: item.id, name: item.name, unit: item.unit, onHand: item.onHand, kind: item.kind }));
  const lines = calculateRequirements([toProductionTask(previous)], buildStarterPlans(tasks), inventory);
  const before = inventoryTransactions(snapshot);
  const after = recordDeductions(before, "task-completion", previous.id, lines);
  const existing = new Set(before.map((transaction) => transaction.id));
  return after.filter((transaction) => !existing.has(transaction.id));
}

const defaultEarlsPaymentMethods: readonly DomainPaymentMethod[] = [
  {
    id: "pm-earls-zelle",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    methodType: "zelle",
    name: "Zelle",
    instructions: "Send Zelle payments to pay@earlsbakery.com",
    isEnabled: true,
    requiresManualConfirmation: true,
  },
  {
    id: "pm-earls-paypal",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    methodType: "paypal",
    name: "PayPal",
    instructions: "Pay via paypal.me/earlsbakery",
    isEnabled: true,
    requiresManualConfirmation: false,
  },
  {
    id: "pm-earls-cash",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    methodType: "cash",
    name: "Cash / Check",
    instructions: "Pay with cash or check upon pickup.",
    isEnabled: true,
    requiresManualConfirmation: false,
  },
];

const defaultEarlsInvoices: readonly DomainInvoice[] = [
  {
    id: "inv-earls-001",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    invoiceNumber: "INV-2026-001",
    publicToken: "tok_earls_001",
    orderId: "order-024",
    customerId: "customer-sarah",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah.m@email.com",
    status: "Paid",
    issueDate: "2026-07-28",
    dueDate: "2026-08-04",
    subtotalCents: 4400,
    taxCents: 0,
    discountCents: 0,
    totalCents: 4400,
    amountPaidCents: 4400,
    balanceCents: 0,
    items: [
      { id: "inv-earls-001-item-1", invoiceId: "inv-earls-001", description: "Sourdough Loaf", quantity: 2, unitPriceCents: 1400, totalCents: 2800, recipeId: "recipe-sourdough" },
      { id: "inv-earls-001-item-2", invoiceId: "inv-earls-001", description: "Focaccia", quantity: 2, unitPriceCents: 800, totalCents: 1600, recipeId: "recipe-focaccia" },
    ],
    notes: "Paid via Cash",
    createdAt: "2026-07-28T09:00:00Z",
    updatedAt: "2026-07-28T10:00:00Z",
  },
  {
    id: "inv-earls-002",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    invoiceNumber: "INV-2026-002",
    publicToken: "tok_earls_002",
    orderId: "order-025",
    customerId: "customer-james",
    customerName: "James Okonkwo",
    customerEmail: "james.ok@email.com",
    status: "Partially paid",
    issueDate: "2026-07-29",
    dueDate: "2026-08-05",
    subtotalCents: 2200,
    taxCents: 0,
    discountCents: 0,
    totalCents: 2200,
    amountPaidCents: 1000,
    balanceCents: 1200,
    items: [
      { id: "inv-earls-002-item-1", invoiceId: "inv-earls-002", description: "Sourdough Loaf", quantity: 1, unitPriceCents: 1400, totalCents: 1400, recipeId: "recipe-sourdough" },
      { id: "inv-earls-002-item-2", invoiceId: "inv-earls-002", description: "Focaccia", quantity: 1, unitPriceCents: 800, totalCents: 800, recipeId: "recipe-focaccia" },
    ],
    notes: "Partial deposit paid",
    createdAt: "2026-07-29T09:00:00Z",
    updatedAt: "2026-07-29T12:00:00Z",
  },
];

const defaultEarlsPayments: readonly DomainPayment[] = [
  {
    id: "pay-earls-001",
    invoiceId: "inv-earls-001",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    paymentMethodType: "cash",
    amountCents: 4400,
    paymentDate: "2026-07-28",
    createdAt: "2026-07-28T10:00:00Z",
  },
  {
    id: "pay-earls-002",
    invoiceId: "inv-earls-002",
    bakeryId: FIXTURE_BAKERY_IDS.EARLS,
    paymentMethodType: "zelle",
    amountCents: 1000,
    paymentDate: "2026-07-29",
    createdAt: "2026-07-29T12:00:00Z",
  },
];

const defaultEarlsInvoiceEvents: readonly DomainInvoiceEvent[] = [
  { id: "evt-earls-001", invoiceId: "inv-earls-001", eventType: "created", createdAt: "2026-07-28T09:00:00Z" },
  { id: "evt-earls-002", invoiceId: "inv-earls-002", eventType: "created", createdAt: "2026-07-29T09:00:00Z" },
  { id: "evt-earls-003", invoiceId: "inv-earls-002", eventType: "payment_recorded", notes: "Recorded partial payment of $10.00", createdAt: "2026-07-29T12:00:00Z" },
];

const defaultEarlsStorefront: DomainStorefront = {
  id: "sf-earls",
  bakeryId: FIXTURE_BAKERY_IDS.EARLS,
  name: "J'adore Bakery",
  slug: "jadore-bakery",
  description: "Artisanal sourdough, pastries, and fresh baked goods in Mill Valley.",
  isEnabled: true,
  capacityRules: {
    minimumLeadTimeHours: 24,
    orderCutoffTime: "18:00",
    maximumDailyOrders: 10,
    maximumDailyProducts: 50,
  },
  createdAt: "2026-07-01T08:00:00Z",
  updatedAt: "2026-07-01T08:00:00Z",
};

const defaultEarlsStorefrontProducts: readonly DomainStorefrontProduct[] = [
  {
    id: "sf-prod-sourdough",
    storefrontId: "sf-earls",
    recipeId: "recipe-sourdough",
    publicName: "Artisanal Sourdough",
    publicDescription: "Naturally leavened sourdough bread.",
    onlinePriceCents: 1400,
    isPublished: true,
    isSoldOut: false,
    displayOrder: 1,
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "sf-prod-focaccia",
    storefrontId: "sf-earls",
    recipeId: "recipe-focaccia",
    publicName: "Olive Oil Focaccia",
    publicDescription: "Fluffy rosemary & olive oil focaccia tray.",
    onlinePriceCents: 800,
    isPublished: true,
    isSoldOut: false,
    displayOrder: 2,
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
  },
];

const defaultEarlsPickupWindows: readonly DomainPickupWindow[] = [
  {
    id: "pw-earls-morning",
    storefrontId: "sf-earls",
    name: "Morning Pickup",
    startTime: "09:00",
    endTime: "12:00",
    maxCapacity: 10,
    isEnabled: true,
  },
  {
    id: "pw-earls-afternoon",
    storefrontId: "sf-earls",
    name: "Afternoon Pickup",
    startTime: "13:00",
    endTime: "17:00",
    maxCapacity: 10,
    isEnabled: true,
  },
];

const defaultEarlsClosedDates: readonly DomainClosedDate[] = [
  {
    id: "cd-earls-holiday-1",
    storefrontId: "sf-earls",
    date: "2026-12-25",
    reason: "Christmas Day",
  },
];

const defaultMarinaStorefront: DomainStorefront = {
  id: "sf-marina",
  bakeryId: FIXTURE_BAKERY_IDS.MARINA,
  name: "Marina Bakery",
  slug: "marina-bakery",
  description: "Fresh coastal sourdough and pastries.",
  isEnabled: true,
  capacityRules: {
    minimumLeadTimeHours: 24,
    maximumDailyOrders: 15,
  },
  createdAt: "2026-07-01T08:00:00Z",
  updatedAt: "2026-07-01T08:00:00Z",
};

function validateOnlineCheckoutInternal(
  snapshot: BakeryDomainSnapshot,
  input: { readonly fulfillmentDate: string; readonly fulfillmentTime?: string }
): ValidateOnlineCheckoutResult {
  const storefront = snapshot.storefront;
  if (!storefront || !storefront.isEnabled) {
    return { valid: false, reason: "Store is currently closed or unavailable.", code: "STORE_DISABLED" };
  }

  const closedDates = Object.values(snapshot.closedDates ?? {});
  const isClosed = closedDates.some((cd) => cd.date === input.fulfillmentDate);
  if (isClosed) {
    return { valid: false, reason: `Store is closed on ${input.fulfillmentDate}.`, code: "CLOSED_DATE" };
  }

  const leadTimeHours = storefront.capacityRules.minimumLeadTimeHours ?? 0;
  if (leadTimeHours > 0) {
    const now = new Date();
    const timeStr = input.fulfillmentTime ?? "12:00";
    const targetDate = new Date(`${input.fulfillmentDate}T${timeStr}:00`);
    const diffHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < leadTimeHours) {
      return { valid: false, reason: `Orders require at least ${leadTimeHours} hours lead time.`, code: "LEAD_TIME_VIOLATION" };
    }
  }

  const maxDailyOrders = storefront.capacityRules.maximumDailyOrders;
  if (maxDailyOrders !== undefined && maxDailyOrders > 0) {
    const existingOrdersOnDate = Object.values(snapshot.ordersById).filter(
      (o) => o.pickupDate === input.fulfillmentDate && o.status !== "cancelled"
    );
    if (existingOrdersOnDate.length >= maxDailyOrders) {
      return { valid: false, reason: "Maximum daily order capacity reached for this date.", code: "DAILY_CAPACITY_REACHED" };
    }
  }

  return { valid: true };
}

function indexByEntityId<T extends { readonly id: string }>(entries: readonly T[]): Record<string, T> {
  return Object.fromEntries(entries.map((e) => [e.id, e]));
}

function ensureInvoicingFixtures(snapshots: Record<string, BakeryDomainSnapshot>): Record<string, BakeryDomainSnapshot> {
  const result: Record<string, BakeryDomainSnapshot> = {};
  for (const [bakeryId, snapshot] of Object.entries(snapshots)) {
    if (bakeryId === FIXTURE_BAKERY_IDS.EARLS) {
      result[bakeryId] = {
        ...snapshot,
        invoicesById: snapshot.invoicesById ?? indexByEntityId(defaultEarlsInvoices),
        paymentsById: snapshot.paymentsById ?? indexByEntityId(defaultEarlsPayments),
        invoiceEventsById: snapshot.invoiceEventsById ?? indexByEntityId(defaultEarlsInvoiceEvents),
        paymentMethodsById: snapshot.paymentMethodsById ?? indexByEntityId(defaultEarlsPaymentMethods),
      };
    } else {
      result[bakeryId] = {
        ...snapshot,
        invoicesById: snapshot.invoicesById ?? {},
        paymentsById: snapshot.paymentsById ?? {},
        invoiceEventsById: snapshot.invoiceEventsById ?? {},
        paymentMethodsById: snapshot.paymentMethodsById ?? {},
      };
    }
  }
  return result;
}

function ensureStorefrontFixtures(snapshots: Record<string, BakeryDomainSnapshot>): Record<string, BakeryDomainSnapshot> {
  const result: Record<string, BakeryDomainSnapshot> = {};
  for (const [bakeryId, snapshot] of Object.entries(snapshots)) {
    if (bakeryId === FIXTURE_BAKERY_IDS.EARLS) {
      result[bakeryId] = {
        ...snapshot,
        storefront: snapshot.storefront ?? defaultEarlsStorefront,
        storefrontProducts: snapshot.storefrontProducts ?? indexByEntityId(defaultEarlsStorefrontProducts),
        pickupWindows: snapshot.pickupWindows ?? indexByEntityId(defaultEarlsPickupWindows),
        closedDates: snapshot.closedDates ?? indexByEntityId(defaultEarlsClosedDates),
      };
    } else if (bakeryId === FIXTURE_BAKERY_IDS.MARINA) {
      result[bakeryId] = {
        ...snapshot,
        storefront: snapshot.storefront ?? defaultMarinaStorefront,
        storefrontProducts: snapshot.storefrontProducts ?? {},
        pickupWindows: snapshot.pickupWindows ?? {},
        closedDates: snapshot.closedDates ?? {},
      };
    } else {
      result[bakeryId] = {
        ...snapshot,
        storefrontProducts: snapshot.storefrontProducts ?? {},
        pickupWindows: snapshot.pickupWindows ?? {},
        closedDates: snapshot.closedDates ?? {},
      };
    }
  }
  return result;
}

export const createLocalBakeryAdapter = createSessionLocalBakeryDomainAdapter;
