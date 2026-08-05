import type { FlowStep, ProductionFlow, ProductionStatus } from "../production";

export type DomainFlowStep = FlowStep;
export type DomainProductionFlow = ProductionFlow;


export type BakeryId = string;
export type EntityId = string;

export type TaskStatus = Exclude<ProductionStatus, "overdue">;
export type OrderStatus = "draft" | "confirmed" | "in-production" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partially-paid" | "paid" | "refunded";
export type InventoryStatus = "in-stock" | "low" | "insufficient" | "out-of-stock";

export type CustomerType = "wholesale" | "retail";

export interface DomainCustomer {
  readonly id: EntityId;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly address?: string;
  readonly notes?: string;
  readonly favoriteProducts?: readonly string[];
  readonly totalOrders?: number;
  readonly totalSpent?: number;
}

export interface DomainInventoryItem {
  readonly id: EntityId;
  readonly name: string;
  readonly unit: string;
  readonly onHand: number;
  readonly minLevel: number;
  readonly kind: "ingredient" | "packaging";
  readonly status: InventoryStatus;
  readonly packageQuantity?: number;
  readonly packagePrice?: number;
  readonly unitCost?: number;
}

export interface DomainRecipeIngredient {
  readonly inventoryItemId: EntityId;
  readonly quantity: number;
  readonly cost: number;
}

export interface DomainRecipe {
  readonly id: EntityId;
  readonly name: string;
  readonly yield: string;
  readonly batchCost: number;
  readonly sellingPrice: number;
  readonly flowId: EntityId;
  readonly ingredients: readonly DomainRecipeIngredient[];
  readonly archived?: boolean;
  readonly marginPercent?: number;
}

export interface DomainOrder {
  readonly id: EntityId;
  readonly customerId: EntityId;
  readonly itemIds: readonly EntityId[];
  readonly pickupDate: string;
  readonly pickupTime: string;
  readonly status: OrderStatus;
  readonly total: number;
  readonly paid: number;
  readonly paymentStatus: PaymentStatus;
  readonly notes?: string;
}

export interface DomainOrderItem {
  readonly id: EntityId;
  readonly orderId: EntityId;
  readonly recipeId: EntityId;
  readonly product: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface DomainTask {
  readonly id: EntityId;
  readonly orderId: EntityId;
  readonly orderItemId: EntityId;
  readonly flowId: EntityId;
  readonly flowStepId: EntityId;
  readonly title: string;
  readonly product: string;
  readonly quantity: number;
  readonly scheduledAt: string;
  readonly status: TaskStatus;
  readonly instructions: string;
  readonly category: string;
  readonly duration: number;
  readonly dependencyIncomplete?: boolean;
  readonly note?: string;
  readonly skipReason?: string;
  readonly timerRunning?: boolean;
  readonly timerStartedAt?: string;
  readonly elapsedSeconds?: number;
  readonly delayMinutes?: number;
}

export interface TaskExecutionState {
  readonly taskId: string;
  readonly timerRunning: boolean;
  readonly timerStartedAt?: string;
  readonly elapsedSeconds: number;
  readonly delayMinutes: number;
  readonly skipReason?: string;
}

export interface DomainInventoryTransaction {
  readonly id: EntityId;
  readonly sourceKey: string;
  readonly itemId: EntityId;
  readonly quantityChange: number;
  readonly reason: "task-completed" | "order-completed" | "restock" | "adjustment";
}

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Viewed"
  | "Partially paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export type PaymentMethodType = "zelle" | "paypal" | "cash" | "check" | "custom";

export interface DomainInvoiceItem {
  readonly id: EntityId;
  readonly invoiceId: EntityId;
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly totalCents: number;
  readonly recipeId?: EntityId;
}

export interface DomainInvoiceEvent {
  readonly id: EntityId;
  readonly invoiceId: EntityId;
  readonly eventType: "created" | "sent" | "viewed" | "payment_recorded" | "cancelled" | "status_changed";
  readonly notes?: string;
  readonly createdAt: string;
}

export interface DomainInvoice {
  readonly id: EntityId;
  readonly bakeryId: BakeryId;
  readonly invoiceNumber: string;
  readonly publicToken: string;
  readonly orderId?: EntityId;
  readonly customerId: EntityId;
  readonly customerName?: string;
  readonly customerEmail?: string;
  readonly status: InvoiceStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly amountPaidCents: number;
  readonly balanceCents: number;
  readonly items: readonly DomainInvoiceItem[];
  readonly notes?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly customerSnapshotJson?: Record<string, unknown>;
  readonly bakerySnapshotJson?: Record<string, unknown>;
  readonly fulfillmentSnapshotJson?: Record<string, unknown>;
}

export interface DomainPaymentMethod {
  readonly id: EntityId;
  readonly bakeryId: BakeryId;
  readonly methodType: PaymentMethodType;
  readonly name: string;
  readonly instructions?: string;
  readonly isEnabled: boolean;
  readonly requiresManualConfirmation: boolean;
}

export interface DomainPayment {
  readonly id: EntityId;
  readonly invoiceId: EntityId;
  readonly bakeryId: BakeryId;
  readonly paymentMethodId?: EntityId;
  readonly paymentMethodType: PaymentMethodType;
  readonly amountCents: number;
  readonly paymentDate: string;
  readonly referenceNumber?: string;
  readonly notes?: string;
  readonly createdAt: string;
}

export interface StorefrontCapacityRules {
  readonly minimumLeadTimeHours: number;
  readonly orderCutoffTime?: string;
  readonly maximumDailyOrders?: number;
  readonly maximumDailyProducts?: number;
}

export interface DomainStorefront {
  readonly id: EntityId;
  readonly bakeryId: BakeryId;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly isEnabled: boolean;
  readonly logoUrl?: string;
  readonly coverImageUrl?: string;
  readonly capacityRules: StorefrontCapacityRules;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface DomainStorefrontProduct {
  readonly id: EntityId;
  readonly storefrontId: EntityId;
  readonly recipeId: EntityId;
  readonly publicName: string;
  readonly publicDescription?: string;
  readonly onlinePriceCents: number;
  readonly imagePath?: string;
  readonly isPublished: boolean;
  readonly isSoldOut: boolean;
  readonly displayOrder?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface DomainPickupWindow {
  readonly id: EntityId;
  readonly storefrontId: EntityId;
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly maxCapacity?: number;
  readonly dayOfWeek?: number;
  readonly isEnabled: boolean;
}

export interface DomainClosedDate {
  readonly id: EntityId;
  readonly storefrontId: EntityId;
  readonly date: string;
  readonly reason?: string;
}

export interface CartItem {
  readonly productId: EntityId;
  readonly recipeId?: EntityId;
  readonly quantity: number;
  readonly unitPriceCents?: number;
}

export interface OnlineCheckoutInput extends Partial<MutationScope> {
  readonly slug: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone?: string;
  readonly fulfillmentType: "pickup" | "delivery";
  readonly fulfillmentDate: string;
  readonly fulfillmentTimeWindow?: string;
  readonly pickupWindowId?: EntityId;
  readonly deliveryAddress?: string;
  readonly notes?: string;
  readonly items: readonly CartItem[];
  readonly paymentMethodType?: PaymentMethodType;
  readonly idempotencyKey?: string;
}

/** The only source of bakery-domain records during the local F1 prototype. */
export interface BakeryDomainSnapshot {
  readonly bakeryId: BakeryId;
  readonly customersById: Readonly<Record<EntityId, DomainCustomer>>;
  readonly inventoryById: Readonly<Record<EntityId, DomainInventoryItem>>;
  readonly recipesById: Readonly<Record<EntityId, DomainRecipe>>;
  readonly flowsById: Readonly<Record<EntityId, ProductionFlow>>;
  readonly ordersById: Readonly<Record<EntityId, DomainOrder>>;
  readonly orderItemsById: Readonly<Record<EntityId, DomainOrderItem>>;
  readonly tasksById: Readonly<Record<EntityId, DomainTask>>;
  readonly inventoryTransactionsById: Readonly<Record<EntityId, DomainInventoryTransaction>>;
  readonly invoicesById?: Readonly<Record<EntityId, DomainInvoice>>;
  readonly paymentsById?: Readonly<Record<EntityId, DomainPayment>>;
  readonly invoiceEventsById?: Readonly<Record<EntityId, DomainInvoiceEvent>>;
  readonly paymentMethodsById?: Readonly<Record<EntityId, DomainPaymentMethod>>;
  readonly storefront?: DomainStorefront;
  readonly storefrontProducts?: Readonly<Record<EntityId, DomainStorefrontProduct>>;
  readonly pickupWindows?: Readonly<Record<EntityId, DomainPickupWindow>>;
  readonly closedDates?: Readonly<Record<EntityId, DomainClosedDate>>;
}

export type DomainOperation =
  | "load-snapshot"
  | "create-order"
  | "transition-order-status"
  | "mark-order-paid"
  | "update-task"
  | "start-task-timer"
  | "stop-task-timer"
  | "delay-task"
  | "skip-task"
  | "create-recipe"
  | "update-recipe"
  | "duplicate-recipe"
  | "archive-recipe"
  | "restore-recipe"
  | "create-customer"
  | "update-customer"
  | "create-invoice"
  | "update-invoice"
  | "record-payment"
  | "cancel-invoice"
  | "update-payment-methods"
  | "update-storefront-settings"
  | "publish-storefront-product"
  | "submit-online-order"
  | "save-production-flow"
  | "delete-production-flow"
  | "restock-inventory"
  | "adjust-inventory";

export interface StartTaskTimerInput extends MutationScope {
  readonly taskId: EntityId;
}

export interface StopTaskTimerInput extends MutationScope {
  readonly taskId: EntityId;
  readonly elapsedSeconds?: number;
}

export interface DelayTaskInput extends MutationScope {
  readonly taskId: EntityId;
  readonly delayMinutes: number;
}

export interface SkipTaskInput extends MutationScope {
  readonly taskId: EntityId;
  readonly reason: string;
}


export type AdapterFailure =
  | { readonly kind: "connection"; readonly message: string; readonly retryable: true }
  | { readonly kind: "authorization"; readonly message: string; readonly retryable: false }
  | { readonly kind: "validation"; readonly message: string; readonly retryable: false; readonly field?: string }
  | { readonly kind: "unknown"; readonly message: string; readonly retryable: boolean };

export type AdapterResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: AdapterFailure };

export interface BakeryDomainDataSource {
  readonly durability: "session-local" | "persisted";
  readonly description: string;
}

export interface BakeryScope {
  readonly bakeryId: BakeryId;
}

export interface MutationScope extends BakeryScope {
  /** Caller-owned, stable across a safe retry of this mutation. */
  readonly operationId: string;
}

export interface CreateOrderItemInput {
  readonly recipeId: EntityId;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface CreateOrderInput extends MutationScope {
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly pickupDate: string;
  readonly pickupTime: string;
  readonly items: readonly CreateOrderItemInput[];
  readonly paid: number;
  readonly notes?: string;
}

/** Advances a manual order only when its current status matches the caller's snapshot. */
export interface TransitionOrderStatusInput extends MutationScope {
  readonly orderId: EntityId;
  readonly expectedStatus: OrderStatus;
  readonly targetStatus: OrderStatus;
}

export interface MarkOrderPaidInput extends MutationScope {
  readonly orderId: EntityId;
}

export interface UpdateTaskInput extends MutationScope {
  readonly taskId: EntityId;
  readonly patch: Partial<Pick<DomainTask, "status" | "scheduledAt" | "note" | "skipReason" | "timerRunning" | "timerStartedAt" | "elapsedSeconds" | "delayMinutes">>;
}

export interface CreateIngredientInput extends MutationScope {
  readonly ingredientId: EntityId;
  readonly name: string;
  readonly unit: string;
  readonly packageQuantity: number;
  readonly packagePrice: number;
  readonly minLevel: number;
  readonly kind: "ingredient" | "packaging";
}

export interface RecordMovementInput extends MutationScope {
  readonly movementId: EntityId;
  readonly ingredientId: EntityId;
  readonly quantityChange: number;
  readonly reason: "restock" | "waste" | "adjustment" | "task-deduction";
  readonly notes?: string;
}

export interface RestockInventoryInput extends MutationScope {
  readonly itemId: EntityId;
  readonly quantityAdded: number;
  readonly unitCost?: number;
  readonly notes?: string;
}

export interface AdjustInventoryInput extends MutationScope {
  readonly itemId: EntityId;
  readonly newOnHand: number;
  readonly notes?: string;
}

export interface RecipeIngredientInput {
  readonly inventoryItemId: EntityId;
  readonly quantity: number;
  readonly unitCost?: number;
}

export interface CreateRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
  readonly name: string;
  readonly yield: string;
  readonly sellingPrice: number;
  readonly flowId: EntityId;
  readonly ingredients: readonly RecipeIngredientInput[];
}

export interface UpdateRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
  readonly name?: string;
  readonly yield?: string;
  readonly sellingPrice?: number;
  readonly flowId?: EntityId;
  readonly ingredients?: readonly RecipeIngredientInput[];
}

export interface DuplicateRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
  readonly newRecipeId: EntityId;
}

export interface ArchiveRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
}

export interface RestoreRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
}

export interface CreateCustomerInput extends MutationScope {
  readonly customerId: EntityId;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly type: CustomerType;
  readonly address?: string;
  readonly notes?: string;
}

export interface UpdateCustomerInput extends MutationScope {
  readonly customerId: EntityId;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly address?: string;
  readonly notes?: string;
}

export interface DomainEntityChanges {
  readonly orders?: readonly DomainOrder[];
  readonly orderItems?: readonly DomainOrderItem[];
  readonly tasks?: readonly DomainTask[];
  readonly inventoryItems?: readonly DomainInventoryItem[];
  readonly inventoryTransactions?: readonly DomainInventoryTransaction[];
  readonly recipes?: readonly DomainRecipe[];
  readonly flows?: readonly DomainProductionFlow[];
  readonly customers?: readonly DomainCustomer[];
  readonly invoices?: readonly DomainInvoice[];
  readonly payments?: readonly DomainPayment[];
  readonly invoiceEvents?: readonly DomainInvoiceEvent[];
  readonly paymentMethods?: readonly DomainPaymentMethod[];
  readonly storefront?: DomainStorefront;
  readonly storefrontProducts?: readonly DomainStorefrontProduct[];
  readonly pickupWindows?: readonly DomainPickupWindow[];
  readonly closedDates?: readonly DomainClosedDate[];
}

export interface SaveProductionFlowInput extends MutationScope {
  readonly flow: DomainProductionFlow;
}

export interface DeleteProductionFlowInput extends MutationScope {
  readonly flowId: EntityId;
}

export interface ProductionFlowResult {
  readonly kind: "production-flow-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface CreateOrderResult {
  readonly kind: "order-created";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface TransitionOrderStatusResult {
  readonly kind: "order-status-transitioned";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface MarkOrderPaidResult {
  readonly kind: "order-marked-paid";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface UpdateTaskResult {
  readonly kind: "task-updated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface CreateIngredientResult {
  readonly kind: "ingredient-created";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface RecordMovementResult {
  readonly kind: "movement-recorded";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface RecipeResult {
  readonly kind: "recipe-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface CustomerResult {
  readonly kind: "customer-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface InventoryResult {
  readonly kind: "inventory-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface SnapshotPort {
  loadSnapshot(scope: BakeryScope): Promise<AdapterResult<BakeryDomainSnapshot>>;
}

export interface OrdersPort {
  createOrder(input: CreateOrderInput): Promise<AdapterResult<CreateOrderResult>>;
  transitionOrderStatus(input: TransitionOrderStatusInput): Promise<AdapterResult<TransitionOrderStatusResult>>;
  markOrderPaid(input: MarkOrderPaidInput): Promise<AdapterResult<MarkOrderPaidResult>>;
}

export interface ProductionPort {
  updateTask(input: UpdateTaskInput): Promise<AdapterResult<UpdateTaskResult>>;
  startTaskTimer?(input: StartTaskTimerInput): Promise<AdapterResult<UpdateTaskResult>>;
  stopTaskTimer?(input: StopTaskTimerInput): Promise<AdapterResult<UpdateTaskResult>>;
  delayTask?(input: DelayTaskInput): Promise<AdapterResult<UpdateTaskResult>>;
  skipTask?(input: SkipTaskInput): Promise<AdapterResult<UpdateTaskResult>>;
  saveProductionFlow(input: SaveProductionFlowInput): Promise<AdapterResult<ProductionFlowResult>>;
  deleteProductionFlow(input: DeleteProductionFlowInput): Promise<AdapterResult<ProductionFlowResult>>;
}

export interface InventoryPort {
  restockInventory?(input: RestockInventoryInput): Promise<AdapterResult<InventoryResult>>;
  adjustInventory?(input: AdjustInventoryInput): Promise<AdapterResult<InventoryResult>>;
}

export interface IngredientsPort {
  createIngredient?(input: CreateIngredientInput): Promise<AdapterResult<CreateIngredientResult>>;
  recordMovement?(input: RecordMovementInput): Promise<AdapterResult<RecordMovementResult>>;
}

export interface RecipePort {
  createRecipe(input: CreateRecipeInput): Promise<AdapterResult<RecipeResult>>;
  updateRecipe(input: UpdateRecipeInput): Promise<AdapterResult<RecipeResult>>;
  duplicateRecipe(input: DuplicateRecipeInput): Promise<AdapterResult<RecipeResult>>;
  archiveRecipe(input: ArchiveRecipeInput): Promise<AdapterResult<RecipeResult>>;
  restoreRecipe(input: RestoreRecipeInput): Promise<AdapterResult<RecipeResult>>;
}

export interface CustomerPort {
  createCustomer(input: CreateCustomerInput): Promise<AdapterResult<CustomerResult>>;
  updateCustomer(input: UpdateCustomerInput): Promise<AdapterResult<CustomerResult>>;
}

export interface CreateInvoiceItemInput {
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly recipeId?: EntityId;
}

export interface CreateInvoiceInput extends MutationScope {
  readonly invoiceId: EntityId;
  readonly customerId: EntityId;
  readonly orderId?: EntityId;
  readonly issueDate?: string;
  readonly dueDate: string;
  readonly items?: readonly CreateInvoiceItemInput[];
  readonly taxCents?: number;
  readonly discountCents?: number;
  readonly notes?: string;
}

export interface UpdateInvoiceInput extends MutationScope {
  readonly invoiceId: EntityId;
  readonly status?: InvoiceStatus;
  readonly dueDate?: string;
  readonly items?: readonly CreateInvoiceItemInput[];
  readonly taxCents?: number;
  readonly discountCents?: number;
  readonly notes?: string;
}

export interface RecordPaymentInput extends MutationScope {
  readonly paymentId: EntityId;
  readonly invoiceId: EntityId;
  readonly paymentMethodType: PaymentMethodType;
  readonly paymentMethodId?: EntityId;
  readonly amountCents: number;
  readonly paymentDate: string;
  readonly referenceNumber?: string;
  readonly notes?: string;
}

export interface CancelInvoiceInput extends MutationScope {
  readonly invoiceId: EntityId;
  readonly reason?: string;
}

export interface UpdatePaymentMethodInput extends MutationScope {
  readonly paymentMethods: readonly DomainPaymentMethod[];
}

export interface InvoiceResult {
  readonly kind: "invoice-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface InvoicingPort {
  createInvoice(input: CreateInvoiceInput): Promise<AdapterResult<InvoiceResult>>;
  updateInvoice(input: UpdateInvoiceInput): Promise<AdapterResult<InvoiceResult>>;
  recordPayment(input: RecordPaymentInput): Promise<AdapterResult<InvoiceResult>>;
  cancelInvoice(input: CancelInvoiceInput): Promise<AdapterResult<InvoiceResult>>;
  updatePaymentMethods(input: UpdatePaymentMethodInput): Promise<AdapterResult<InvoiceResult>>;
}

export interface UpdateStorefrontSettingsInput extends MutationScope {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly isEnabled?: boolean;
  readonly capacityRules?: Partial<StorefrontCapacityRules>;
  readonly pickupWindows?: readonly DomainPickupWindow[];
  readonly closedDates?: readonly DomainClosedDate[];
}

export interface PublishRecipeInput extends MutationScope {
  readonly recipeId: EntityId;
  readonly publicName: string;
  readonly publicDescription?: string;
  readonly onlinePriceCents: number;
  readonly isPublished: boolean;
  readonly isSoldOut?: boolean;
  readonly imagePath?: string;
}

export interface ValidateOnlineCheckoutInput {
  readonly slug: string;
  readonly fulfillmentDate: string;
  readonly fulfillmentTime?: string;
  readonly items?: readonly CartItem[];
  readonly pickupWindowId?: EntityId;
}

export interface ValidateOnlineCheckoutResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly code?: "STORE_DISABLED" | "CLOSED_DATE" | "LEAD_TIME_VIOLATION" | "DAILY_CAPACITY_REACHED" | "PRODUCT_UNAVAILABLE" | "INVALID_INPUT";
}

export interface StorefrontResult {
  readonly kind: "storefront-mutated";
  readonly operationId: string;
  readonly changes: DomainEntityChanges;
}

export interface OnlineOrderResult {
  readonly kind: "online-order-submitted";
  readonly operationId: string;
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly changes: DomainEntityChanges;
}

export interface StorefrontPort {
  getStorefrontBySlug(slug: string): Promise<AdapterResult<{
    storefront: DomainStorefront;
    products: readonly DomainStorefrontProduct[];
    pickupWindows: readonly DomainPickupWindow[];
    closedDates: readonly DomainClosedDate[];
  }>>;
  updateStorefrontSettings(input: UpdateStorefrontSettingsInput): Promise<AdapterResult<StorefrontResult>>;
  publishRecipeToStorefront(input: PublishRecipeInput): Promise<AdapterResult<StorefrontResult>>;
  validateOnlineCheckout(input: ValidateOnlineCheckoutInput): Promise<AdapterResult<ValidateOnlineCheckoutResult>>;
  submitOnlineOrder(input: OnlineCheckoutInput): Promise<AdapterResult<OnlineOrderResult>>;
}

export interface BakeryDomainPorts
  extends SnapshotPort,
    OrdersPort,
    ProductionPort,
    IngredientsPort,
    InventoryPort,
    RecipePort,
    CustomerPort,
    InvoicingPort,
    StorefrontPort {}

/** Feature ports stay small so later domain phases can replace one at a time. */
export interface BakeryDomainAdapter extends BakeryDomainPorts {
  readonly source: BakeryDomainDataSource;
}
