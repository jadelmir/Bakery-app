import { getSupabaseBrowserClient } from "./client";

type QueryError = { message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null };
type DatabaseScalar = string | number | boolean | null | undefined;
type ProductionTaskRow = {
  id: DatabaseScalar; bakery_id: DatabaseScalar; order_id: DatabaseScalar;
  recipe_id: DatabaseScalar; flow_id: DatabaseScalar; flow_step_id: DatabaseScalar;
  title: DatabaseScalar; category: DatabaseScalar; status: DatabaseScalar;
  scheduled_at: DatabaseScalar; duration_minutes: DatabaseScalar; urgency: DatabaseScalar;
  delay_minutes: DatabaseScalar; skip_reason: DatabaseScalar; created_at: DatabaseScalar;
  updated_at: DatabaseScalar;
};

interface ProductionTaskQuery extends PromiseLike<QueryResult<ProductionTaskRow[]>> {
  select(columns?: string): ProductionTaskQuery;
  eq(column: string, value: string): ProductionTaskQuery;
  order(column: string, options: { ascending: boolean }): ProductionTaskQuery;
  limit(count: number): ProductionTaskQuery;
  insert(payload: object): ProductionTaskQuery;
  update(payload: object): ProductionTaskQuery;
  delete(): ProductionTaskQuery;
  single(): Promise<QueryResult<ProductionTaskRow>>;
  maybeSingle(): Promise<QueryResult<ProductionTaskRow>>;
}

export interface TaskRegenerationClient {
  from(table: "production_tasks"): ProductionTaskQuery;
  rpc(
    functionName: "generate_order_production_tasks",
    args: { p_bakery_id: string; p_order_id: string; p_fulfillment_date: string },
  ): Promise<QueryResult<ProductionTaskRow[]>>;
}

function getTaskRegenerationClient(): TaskRegenerationClient {
  // The generated client schema does not yet include this table or RPC.
  return getSupabaseBrowserClient() as unknown as TaskRegenerationClient;
}

export type TaskCategory =
  | "prep"
  | "starter"
  | "mixing"
  | "shaping"
  | "ferment"
  | "baking"
  | "packaging";

export type TaskStatus = "pending" | "in-progress" | "completed" | "skipped";

export type TaskUrgency = "normal" | "urgent" | "overdue" | "due-now";

export interface DbProductionTask {
  id: string;
  bakery_id: string;
  order_id: string;
  recipe_id: string | null;
  flow_id: string | null;
  flow_step_id: string | null;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  scheduled_at: string;
  duration_minutes: number;
  urgency: TaskUrgency;
  delay_minutes: number;
  skip_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDbTaskInput {
  bakery_id: string;
  order_id: string;
  title: string;
  category: TaskCategory;
  scheduled_at: string;
  recipe_id?: string | null;
  flow_id?: string | null;
  flow_step_id?: string | null;
  status?: TaskStatus;
  duration_minutes?: number;
  urgency?: TaskUrgency;
  delay_minutes?: number;
  skip_reason?: string | null;
}

export interface UpdateDbTaskInput {
  status?: TaskStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  urgency?: TaskUrgency;
  delay_minutes?: number;
  skip_reason?: string | null;
  title?: string;
  category?: TaskCategory;
  recipe_id?: string | null;
  flow_id?: string | null;
  flow_step_id?: string | null;
}

export interface FetchTasksOptions {
  orderId?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  limit?: number;
}

export function transformProductionTaskRow(row: ProductionTaskRow): DbProductionTask {
  return {
    id: String(row.id),
    bakery_id: String(row.bakery_id),
    order_id: String(row.order_id),
    recipe_id: row.recipe_id ? String(row.recipe_id) : null,
    flow_id: row.flow_id ? String(row.flow_id) : null,
    flow_step_id: row.flow_step_id ? String(row.flow_step_id) : null,
    title: String(row.title),
    category: row.category as TaskCategory,
    status: (row.status as TaskStatus) ?? "pending",
    scheduled_at: String(row.scheduled_at),
    duration_minutes: Number(row.duration_minutes ?? 30),
    urgency: (row.urgency as TaskUrgency) ?? "normal",
    delay_minutes: Number(row.delay_minutes ?? 0),
    skip_reason: row.skip_reason ? String(row.skip_reason) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function fetchProductionTasks(
  bakeryId: string,
  options?: FetchTasksOptions,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<DbProductionTask[]> {
  let query = client
    .from("production_tasks")
    .select("*")
    .eq("bakery_id", bakeryId);

  if (options?.orderId) {
    query = query.eq("order_id", options.orderId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  query = query.order("scheduled_at", { ascending: true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch production tasks: ${error.message}`);
  }

  return (data || []).map(transformProductionTaskRow);
}

export async function fetchProductionTaskById(
  taskId: string,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<DbProductionTask | null> {
  const { data, error } = await client
    .from("production_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch production task by ID: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return transformProductionTaskRow(data);
}

export async function insertProductionTask(
  input: CreateDbTaskInput,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<DbProductionTask> {
  const payload = {
    bakery_id: input.bakery_id,
    order_id: input.order_id,
    title: input.title,
    category: input.category,
    scheduled_at: input.scheduled_at,
    recipe_id: input.recipe_id ?? null,
    flow_id: input.flow_id ?? null,
    flow_step_id: input.flow_step_id ?? null,
    status: input.status ?? "pending",
    duration_minutes: input.duration_minutes ?? 30,
    urgency: input.urgency ?? "normal",
    delay_minutes: input.delay_minutes ?? 0,
    skip_reason: input.skip_reason ?? null,
  };

  const { data, error } = await client
    .from("production_tasks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert production task: ${error.message}`);
  }

  return transformProductionTaskRow(data);
}

export async function updateProductionTask(
  taskId: string,
  input: UpdateDbTaskInput,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<DbProductionTask> {
  const { data, error } = await client
    .from("production_tasks")
    .update(input)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update production task: ${error.message}`);
  }

  return transformProductionTaskRow(data);
}

export async function deleteProductionTask(
  taskId: string,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<void> {
  const { error } = await client
    .from("production_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to delete production task: ${error.message}`);
  }
}

export async function regenerateOrderTasks(
  bakeryId: string,
  orderId: string,
  fulfillmentDate: string,
  client: TaskRegenerationClient = getTaskRegenerationClient(),
): Promise<DbProductionTask[]> {
  const { data, error } = await client.rpc("generate_order_production_tasks", {
    p_bakery_id: bakeryId,
    p_order_id: orderId,
    p_fulfillment_date: fulfillmentDate,
  });

  if (error) {
    throw new Error(`Failed to regenerate order tasks: ${error.message}`);
  }

  return (data || []).map(transformProductionTaskRow);
}
