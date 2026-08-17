import type {
  AdapterResult,
  AdapterFailure,
  BakeryDomainAdapter,
  BakeryDomainSnapshot,
  BakeryId,
  CreateRecipeInput,
  CreateOrderInput,
  CreateCustomerInput,
  CustomerResult,
  RecipeResult,
  UpdateRecipeInput,
  UpdateCustomerInput,
  DomainEntityChanges,
  DeleteOrderInput,
  DeleteOrderResult,
  MarkOrderPaidInput,
  MarkOrderPaidResult,
  SaveProductionFlowInput,
  DeleteProductionFlowInput,
  ProductionFlowResult,
  TransitionOrderStatusInput,
  TransitionOrderStatusResult,
  UpdateTaskInput,
} from "../domain/types";

export type RequestState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly bakeryId: BakeryId }
  | { readonly status: "ready"; readonly bakeryId: BakeryId; readonly data: T }
  | { readonly status: "empty"; readonly bakeryId: BakeryId; readonly data: T }
  | { readonly status: "error"; readonly bakeryId: BakeryId; readonly error: AdapterFailure }
  | { readonly status: "offline"; readonly bakeryId: BakeryId; readonly error: Extract<AdapterFailure, { kind: "connection" }> };

export type MutationRequestState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly bakeryId: BakeryId }
  | { readonly status: "ready"; readonly bakeryId: BakeryId }
  | { readonly status: "error"; readonly bakeryId: BakeryId; readonly error: Exclude<AdapterFailure, { kind: "connection" }> }
  | { readonly status: "offline"; readonly bakeryId: BakeryId; readonly error: Extract<AdapterFailure, { kind: "connection" }> };

export interface BakeryDomainState {
  readonly resource: RequestState<BakeryDomainSnapshot>;
  readonly mutations: Readonly<Record<string, MutationRequestState>>;
}

export const initialBakeryDomainState: BakeryDomainState = { resource: { status: "idle" }, mutations: {} };

type DomainAction =
  | { readonly type: "load-started"; readonly bakeryId: BakeryId }
  | { readonly type: "load-succeeded"; readonly bakeryId: BakeryId; readonly snapshot: BakeryDomainSnapshot }
  | { readonly type: "load-failed"; readonly bakeryId: BakeryId; readonly error: AdapterFailure }
  | { readonly type: "mutation-started"; readonly bakeryId: BakeryId; readonly operationId: string }
  | { readonly type: "mutation-succeeded"; readonly bakeryId: BakeryId; readonly operationId: string; readonly changes: DomainEntityChanges }
  | { readonly type: "mutation-failed"; readonly bakeryId: BakeryId; readonly operationId: string; readonly error: AdapterFailure };

const isConnectionFailure = (error: AdapterFailure): error is Extract<AdapterFailure, { kind: "connection" }> => error.kind === "connection";

const containsRecords = (snapshot: BakeryDomainSnapshot) =>
  Object.keys(snapshot.ordersById).length > 0 || Object.keys(snapshot.tasksById).length > 0 || Object.keys(snapshot.recipesById).length > 0;

const snapshotResource = (snapshot: BakeryDomainSnapshot): RequestState<BakeryDomainSnapshot> =>
  containsRecords(snapshot)
    ? { status: "ready", bakeryId: snapshot.bakeryId, data: snapshot }
    : { status: "empty", bakeryId: snapshot.bakeryId, data: snapshot };

const hasSnapshot = (resource: RequestState<BakeryDomainSnapshot>): resource is Extract<RequestState<BakeryDomainSnapshot>, { data: BakeryDomainSnapshot }> =>
  resource.status === "ready" || resource.status === "empty";

const mutationFailure = (bakeryId: BakeryId, error: AdapterFailure): MutationRequestState =>
  isConnectionFailure(error) ? { status: "offline", bakeryId, error } : { status: "error", bakeryId, error };

/** Applies only authoritative entities returned by a successful adapter mutation. */
export function applyDomainChanges(snapshot: BakeryDomainSnapshot, changes: DomainEntityChanges): BakeryDomainSnapshot {
  const flowUpdates = changes.flows ? Object.fromEntries(changes.flows.map((entity) => [entity.id, entity])) : {};
  const flowIdsToDelete = changes.deletedFlowIds ?? [];
  const nextFlows = { ...snapshot.flowsById, ...flowUpdates };
  flowIdsToDelete.forEach((flowId) => delete nextFlows[flowId]);
  const nextOrders = changes.orders ? { ...snapshot.ordersById, ...Object.fromEntries(changes.orders.map((entity) => [entity.id, entity])) } : { ...snapshot.ordersById };
  const nextOrderItems = changes.orderItems ? { ...snapshot.orderItemsById, ...Object.fromEntries(changes.orderItems.map((entity) => [entity.id, entity])) } : { ...snapshot.orderItemsById };
  const nextTasks = changes.tasks ? { ...snapshot.tasksById, ...Object.fromEntries(changes.tasks.map((entity) => [entity.id, entity])) } : { ...snapshot.tasksById };
  (changes.deletedOrderIds ?? []).forEach((id) => delete nextOrders[id]);
  (changes.deletedOrderItemIds ?? []).forEach((id) => delete nextOrderItems[id]);
  (changes.deletedTaskIds ?? []).forEach((id) => delete nextTasks[id]);
  return {
    ...snapshot,
    ordersById: nextOrders,
    orderItemsById: nextOrderItems,
    tasksById: nextTasks,
    customersById: changes.customers ? { ...snapshot.customersById, ...Object.fromEntries(changes.customers.map((entity) => [entity.id, entity])) } : snapshot.customersById,
    inventoryById: changes.inventoryItems ? { ...snapshot.inventoryById, ...Object.fromEntries(changes.inventoryItems.map((entity) => [entity.id, entity])) } : snapshot.inventoryById,
    inventoryTransactionsById: changes.inventoryTransactions ? { ...snapshot.inventoryTransactionsById, ...Object.fromEntries(changes.inventoryTransactions.map((entity) => [entity.id, entity])) } : snapshot.inventoryTransactionsById,
    recipesById: changes.recipes ? { ...snapshot.recipesById, ...Object.fromEntries(changes.recipes.map((entity) => [entity.id, entity])) } : snapshot.recipesById,
    flowsById: changes.flows || flowIdsToDelete.length > 0 ? nextFlows : snapshot.flowsById,
  };
}

export function bakeryDomainReducer(state: BakeryDomainState, action: DomainAction): BakeryDomainState {
  switch (action.type) {
    case "load-started":
      // Starting a different bakery load clears the previous snapshot synchronously.
      return { resource: { status: "loading", bakeryId: action.bakeryId }, mutations: {} };
    case "load-succeeded":
      return state.resource.status === "loading" && state.resource.bakeryId === action.bakeryId
        ? { ...state, resource: snapshotResource(action.snapshot) }
        : state;
    case "load-failed":
      if (state.resource.status !== "loading" || state.resource.bakeryId !== action.bakeryId) return state;
      return {
        ...state,
        resource: isConnectionFailure(action.error)
          ? { status: "offline", bakeryId: action.bakeryId, error: action.error }
          : { status: "error", bakeryId: action.bakeryId, error: action.error },
      };
    case "mutation-started":
      return {
        ...state,
        mutations: { ...state.mutations, [action.operationId]: { status: "loading", bakeryId: action.bakeryId } },
      };
    case "mutation-succeeded":
      if (!hasSnapshot(state.resource) || state.resource.bakeryId !== action.bakeryId) return state;
      return {
        resource: snapshotResource(applyDomainChanges(state.resource.data, action.changes)),
        mutations: { ...state.mutations, [action.operationId]: { status: "ready", bakeryId: action.bakeryId } },
      };
    case "mutation-failed":
      return {
        ...state,
        mutations: { ...state.mutations, [action.operationId]: mutationFailure(action.bakeryId, action.error) },
      };
  }
}

export interface BakeryDomainCommands {
  load(bakeryId: BakeryId): Promise<void>;
  createOrder(input: CreateOrderInput): Promise<void>;
  deleteOrder(input: DeleteOrderInput): Promise<AdapterResult<DeleteOrderResult>>;
  createRecipe(input: CreateRecipeInput): Promise<AdapterResult<RecipeResult>>;
  updateRecipe(input: UpdateRecipeInput): Promise<AdapterResult<RecipeResult>>;
  createCustomer(input: CreateCustomerInput): Promise<AdapterResult<CustomerResult>>;
  updateCustomer(input: UpdateCustomerInput): Promise<AdapterResult<CustomerResult>>;
  transitionOrderStatus(input: TransitionOrderStatusInput): Promise<AdapterResult<TransitionOrderStatusResult>>;
  markOrderPaid(input: MarkOrderPaidInput): Promise<AdapterResult<MarkOrderPaidResult>>;
  updateTask(input: UpdateTaskInput): Promise<void>;
  saveProductionFlow(input: SaveProductionFlowInput): Promise<AdapterResult<ProductionFlowResult>>;
  deleteProductionFlow(input: DeleteProductionFlowInput): Promise<AdapterResult<ProductionFlowResult>>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  updateStorefrontSettings(input: any): Promise<any>;
  publishRecipeToStorefront(input: any): Promise<any>;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface BakeryDomainController extends BakeryDomainCommands {
  getState(): BakeryDomainState;
  subscribe(listener: (state: BakeryDomainState) => void): () => void;
}

export function createBakeryDomainController(adapter: BakeryDomainAdapter): BakeryDomainController {
  let state = initialBakeryDomainState;
  const listeners = new Set<(next: BakeryDomainState) => void>();
  const dispatch = (action: DomainAction) => {
    const next = bakeryDomainReducer(state, action);
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener(state));
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async load(bakeryId) {
      dispatch({ type: "load-started", bakeryId });
      const result = await adapter.loadSnapshot({ bakeryId });
      if (result.ok) dispatch({ type: "load-succeeded", bakeryId, snapshot: result.data });
      else dispatch({ type: "load-failed", bakeryId, error: result.error });
    },
    async createOrder(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.createOrder(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
    },
    async deleteOrder(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.deleteOrder(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async createRecipe(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.createRecipe(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async updateRecipe(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.updateRecipe(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async createCustomer(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.createCustomer(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async updateCustomer(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.updateCustomer(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async transitionOrderStatus(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.transitionOrderStatus(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async markOrderPaid(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.markOrderPaid(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async updateTask(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.updateTask(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
    },
    async saveProductionFlow(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.saveProductionFlow(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async deleteProductionFlow(input) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.deleteProductionFlow(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    /* eslint-disable @typescript-eslint/no-explicit-any */
    async updateStorefrontSettings(input: any) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.updateStorefrontSettings(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    async publishRecipeToStorefront(input: any) {
      dispatch({ type: "mutation-started", bakeryId: input.bakeryId, operationId: input.operationId });
      const result = await adapter.publishRecipeToStorefront(input);
      if (result.ok) dispatch({ type: "mutation-succeeded", bakeryId: input.bakeryId, operationId: input.operationId, changes: result.data.changes });
      else dispatch({ type: "mutation-failed", bakeryId: input.bakeryId, operationId: input.operationId, error: result.error });
      return result;
    },
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };
}

export const selectMutationState = (state: BakeryDomainState, operationId: string): MutationRequestState =>
  state.mutations[operationId] ?? { status: "idle" };
