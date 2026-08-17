import { getSupabaseBrowserClient } from "./client";

type DatabaseScalar = string | number | boolean | null | undefined;
type QueryError = { message: string };

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

interface RowQuery<T> extends PromiseLike<QueryResult<T[]>> {
  select(columns?: string): RowQuery<T>;
  delete(): RowQuery<T>;
  update(values: Record<string, DatabaseScalar>): RowQuery<T>;
  eq(column: string, value: DatabaseScalar): RowQuery<T>;
  in(column: string, values: readonly string[]): RowQuery<T>;
  order(column: string, options: { ascending: boolean }): RowQuery<T>;
}

interface ManualOrderClient {
  from(table: "customers"): RowQuery<CustomerRow>;
  from(table: "recipes"): RowQuery<RecipeRow>;
  from(table: "orders"): RowQuery<OrderRow>;
  from(table: "order_items"): RowQuery<OrderItemRow>;
  from(table: "production_tasks"): RowQuery<ProductionTaskRow>;
  rpc(functionName: "create_manual_order" | "mark_order_paid", args: Record<string, unknown>): Promise<QueryResult<ManualOrderRpcResult>>;
}

interface CustomerRow {
  id: DatabaseScalar;
  name: DatabaseScalar;
  email: DatabaseScalar;
  phone: DatabaseScalar;
  address: DatabaseScalar;
  notes: DatabaseScalar;
}

interface RecipeRow {
  id: DatabaseScalar;
  name: DatabaseScalar;
  yield: DatabaseScalar;
  selling_price_cents: DatabaseScalar;
}

interface OrderRow {
  id: DatabaseScalar;
  customer_id: DatabaseScalar;
  pickup_date: DatabaseScalar;
  pickup_time: DatabaseScalar;
  status: DatabaseScalar;
  total_cents: DatabaseScalar;
  amount_paid_cents: DatabaseScalar;
  payment_status: DatabaseScalar;
  notes: DatabaseScalar;
  created_at: DatabaseScalar;
}

interface OrderItemRow {
  id: DatabaseScalar;
  order_id: DatabaseScalar;
  recipe_id: DatabaseScalar;
  product_name: DatabaseScalar;
  quantity: DatabaseScalar;
  unit_price_cents: DatabaseScalar;
}

interface ProductionTaskRow {
  id: DatabaseScalar;
  order_id: DatabaseScalar;
  recipe_id: DatabaseScalar;
  flow_id: DatabaseScalar;
  flow_step_id: DatabaseScalar;
  title: DatabaseScalar;
  category: DatabaseScalar;
  status: DatabaseScalar;
  quantity: DatabaseScalar;
  scheduled_at: DatabaseScalar;
  duration_minutes: DatabaseScalar;
  urgency: DatabaseScalar;
  delay_minutes: DatabaseScalar;
  skip_reason: DatabaseScalar;
}

interface ManualOrderRpcResult {
  order_id: DatabaseScalar;
  idempotent: DatabaseScalar;
  total_cents: DatabaseScalar;
  amount_paid_cents: DatabaseScalar;
  payment_status: DatabaseScalar;
}

export interface ManualOrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export interface ManualOrderRecipe {
  id: string;
  name: string;
  yield: string;
  sellingPrice: number;
}

export interface ManualOrderItem {
  id: string;
  orderId: string;
  recipeId: string;
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface ManualOrderTask {
  id: string;
  orderId: string;
  recipeId: string;
  flowId: string;
  flowStepId: string;
  title: string;
  category: string;
  status: "pending" | "in-progress" | "completed" | "skipped";
  quantity: number;
  scheduledAt: string;
  duration: number;
  urgency?: string;
  delayMinutes?: number;
  skipReason?: string;
}

export interface ManualOrderSummary {
  id: string;
  customerId: string;
  pickupDate: string;
  pickupTime: string;
  status: "draft" | "confirmed" | "in-production" | "ready" | "completed" | "cancelled";
  total: number;
  paid: number;
  paymentStatus: "unpaid" | "partially-paid" | "paid" | "refunded";
  notes?: string;
  createdAt: string;
  items: ManualOrderItem[];
}

export interface ManualOrderSnapshot {
  customers: ManualOrderCustomer[];
  recipes: ManualOrderRecipe[];
  orders: ManualOrderSummary[];
  tasks: ManualOrderTask[];
}

export interface CreateManualOrderInput {
  bakeryId: string;
  orderId: string;
  customerId: string;
  pickupDate: string;
  pickupTime: string;
  paid: number;
  notes?: string;
  items: readonly { recipeId: string; quantity: number; unitPrice: number }[];
}

export interface TransitionManualOrderInput {
  bakeryId: string;
  operationId: string;
  orderId: string;
  expectedStatus: ManualOrderSummary["status"];
  targetStatus: ManualOrderSummary["status"];
}

export interface MarkManualOrderPaidInput {
  bakeryId: string;
  operationId: string;
  orderId: string;
}

export interface DeleteManualOrderInput {
  bakeryId: string;
  operationId: string;
  orderId: string;
}

export interface ManualOrderService {
  loadSnapshot(bakeryId: string): Promise<ManualOrderSnapshot>;
  createOrder(input: CreateManualOrderInput): Promise<ManualOrderSnapshot>;
  deleteOrder(input: DeleteManualOrderInput): Promise<ManualOrderSnapshot>;
  transitionOrder(input: TransitionManualOrderInput): Promise<ManualOrderSnapshot>;
  markOrderPaid(input: MarkManualOrderPaidInput): Promise<ManualOrderSnapshot>;
}

const text = (value: DatabaseScalar): string => value == null ? "" : String(value);
const number = (value: DatabaseScalar): number => Number(value ?? 0);
const centsToDollars = (value: DatabaseScalar): number => number(value) / 100;
const nextManualOrderStatus: Partial<Record<ManualOrderSummary["status"], ManualOrderSummary["status"]>> = {
  confirmed: "in-production",
  "in-production": "ready",
  ready: "completed",
};

function mapCustomer(row: CustomerRow): ManualOrderCustomer {
  return { id: text(row.id), name: text(row.name), email: text(row.email), phone: text(row.phone), address: text(row.address), notes: text(row.notes) };
}

function mapRecipe(row: RecipeRow): ManualOrderRecipe {
  return { id: text(row.id), name: text(row.name), yield: text(row.yield), sellingPrice: centsToDollars(row.selling_price_cents) };
}

function mapTask(row: ProductionTaskRow): ManualOrderTask {
  return {
    id: text(row.id), orderId: text(row.order_id), recipeId: text(row.recipe_id), flowId: text(row.flow_id),
    flowStepId: text(row.flow_step_id), title: text(row.title), category: text(row.category),
    status: (text(row.status) || "pending") as ManualOrderTask["status"], quantity: number(row.quantity) || 1,
    scheduledAt: text(row.scheduled_at), duration: number(row.duration_minutes), urgency: text(row.urgency) || undefined,
    delayMinutes: number(row.delay_minutes), skipReason: text(row.skip_reason) || undefined,
  };
}

function mapOrder(row: OrderRow, itemsByOrder: ReadonlyMap<string, ManualOrderItem[]>): ManualOrderSummary {
  return {
    id: text(row.id), customerId: text(row.customer_id), pickupDate: text(row.pickup_date), pickupTime: text(row.pickup_time),
    status: (text(row.status) || "confirmed") as ManualOrderSummary["status"], total: centsToDollars(row.total_cents),
    paid: centsToDollars(row.amount_paid_cents), paymentStatus: (text(row.payment_status) || "unpaid") as ManualOrderSummary["paymentStatus"],
    notes: text(row.notes) || undefined, createdAt: text(row.created_at), items: itemsByOrder.get(text(row.id)) ?? [],
  };
}

async function readRows<T>(query: RowQuery<T>, label: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ${label}: ${error.message}`);
  return data ?? [];
}

export function createManualOrderService(client: ManualOrderClient = getSupabaseBrowserClient() as unknown as ManualOrderClient): ManualOrderService {
  return {
    async loadSnapshot(bakeryId) {
      const [customerRows, recipeRows, orderRows, taskRows] = await Promise.all([
        readRows(client.from("customers").select("id,name,email,phone,address,notes").eq("bakery_id", bakeryId), "customers"),
        readRows(client.from("recipes").select("id,name,yield,selling_price_cents").eq("bakery_id", bakeryId), "recipes"),
        readRows(client.from("orders").select("id,customer_id,pickup_date,pickup_time,status,total_cents,amount_paid_cents,payment_status,notes,created_at").eq("bakery_id", bakeryId).order("created_at", { ascending: false }), "orders"),
        readRows(client.from("production_tasks").select("id,order_id,recipe_id,flow_id,flow_step_id,title,category,status,quantity,scheduled_at,duration_minutes,urgency,delay_minutes,skip_reason").eq("bakery_id", bakeryId).order("scheduled_at", { ascending: true }), "production tasks"),
      ]);

      const orderIds = orderRows.map(row => text(row.id)).filter(Boolean);
      const itemRows = orderIds.length === 0 ? [] : await readRows(client.from("order_items").select("id,order_id,recipe_id,product_name,quantity,unit_price_cents").in("order_id", orderIds), "order items");
      const itemsByOrder = new Map<string, ManualOrderItem[]>();
      itemRows.forEach(row => {
        const item: ManualOrderItem = { id: text(row.id), orderId: text(row.order_id), recipeId: text(row.recipe_id), product: text(row.product_name), quantity: number(row.quantity), unitPrice: centsToDollars(row.unit_price_cents) };
        itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
      });

      return {
        customers: customerRows.map(mapCustomer), recipes: recipeRows.map(mapRecipe),
        orders: orderRows.map(row => mapOrder(row, itemsByOrder)), tasks: taskRows.map(mapTask),
      };
    },

    async createOrder(input) {
      const { data, error } = await client.rpc("create_manual_order", {
        p_bakery_id: input.bakeryId,
        p_order_id: input.orderId,
        p_customer_id: input.customerId,
        p_pickup_date: input.pickupDate,
        p_pickup_time: input.pickupTime,
        p_amount_paid_cents: Math.round(input.paid * 100),
        p_notes: input.notes ?? null,
        p_items_json: input.items.map(item => ({ recipe_id: item.recipeId, quantity: item.quantity, unit_price_cents: Math.round(item.unitPrice * 100) })),
      });
      if (error) throw new Error(`Failed to create order: ${error.message}`);
      if (!data?.order_id) throw new Error("Order creation returned no order identifier.");
      return this.loadSnapshot(input.bakeryId);
    },

    async deleteOrder(input) {
      if (!input.operationId.trim()) throw new Error("An operation identifier is required to delete an order.");
      const { data, error } = await client
        .from("orders")
        .delete()
        .eq("bakery_id", input.bakeryId)
        .eq("id", input.orderId)
        .select("id");
      if (error) throw new Error(`Failed to delete order: ${error.message}`);
      if (!data?.some(row => text(row.id) === input.orderId)) {
        throw new Error("The order is not available in the active bakery. Refresh and try again.");
      }
      const snapshot = await this.loadSnapshot(input.bakeryId);
      if (snapshot.orders.some(order => order.id === input.orderId) || snapshot.tasks.some(task => task.orderId === input.orderId)) {
        throw new Error("The order deletion could not be confirmed from the refreshed bakery snapshot.");
      }
      return snapshot;
    },

    async transitionOrder(input) {
      if (!input.operationId.trim()) throw new Error("An operation identifier is required to transition an order.");
      if (nextManualOrderStatus[input.expectedStatus] !== input.targetStatus) {
        throw new Error("Orders can only advance to the next status in the manual lifecycle.");
      }

      const { data, error } = await client
        .from("orders")
        .update({ status: input.targetStatus })
        .eq("bakery_id", input.bakeryId)
        .eq("id", input.orderId)
        .eq("status", input.expectedStatus)
        .select("id,status");

      if (error) throw new Error(`Failed to transition order: ${error.message}`);
      if (data?.length !== 1) {
        throw new Error("The order status changed or the order is not available in the active bakery. Refresh and try again.");
      }

      const snapshot = await this.loadSnapshot(input.bakeryId);
      const refreshedOrder = snapshot.orders.find(order => order.id === input.orderId);
      if (refreshedOrder?.status !== input.targetStatus) {
        throw new Error("The order transition could not be confirmed from the refreshed bakery snapshot.");
      }
      return snapshot;
    },

    async markOrderPaid(input) {
      if (!input.operationId.trim()) throw new Error("An operation identifier is required to mark an order paid.");
      const { data, error } = await client.rpc("mark_order_paid", {
        p_bakery_id: input.bakeryId,
        p_order_id: input.orderId,
      });
      if (error) throw new Error(`Failed to mark order paid: ${error.message}`);
      if (!data?.order_id) throw new Error("Payment update returned no order identifier.");

      const snapshot = await this.loadSnapshot(input.bakeryId);
      const refreshedOrder = snapshot.orders.find(order => order.id === input.orderId);
      if (!refreshedOrder || refreshedOrder.paymentStatus !== "paid" || refreshedOrder.paid !== refreshedOrder.total) {
        throw new Error("The payment update could not be confirmed from the refreshed bakery snapshot.");
      }
      return snapshot;
    },
  };
}
