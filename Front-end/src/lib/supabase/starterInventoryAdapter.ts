import { getSupabaseBrowserClient } from "./client";

type QueryError = { message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null };
type DatabaseScalar = string | number | boolean | null | undefined;
type StarterProfileRow = {
  id: DatabaseScalar; bakery_id: DatabaseScalar; name: DatabaseScalar;
  flour_ratio: DatabaseScalar; water_ratio: DatabaseScalar; seed_ratio: DatabaseScalar;
  build_duration_hours: DatabaseScalar; is_default: DatabaseScalar; created_at: DatabaseScalar;
};
type StarterBuildRow = {
  id: DatabaseScalar; bakery_id: DatabaseScalar; profile_id: DatabaseScalar;
  target_date: DatabaseScalar; seed_amount_g: DatabaseScalar; flour_amount_g: DatabaseScalar;
  water_amount_g: DatabaseScalar; total_build_g: DatabaseScalar; usable_amount_g: DatabaseScalar;
  retained_starter_g: DatabaseScalar; created_at: DatabaseScalar;
};
type InventoryTransactionRow = {
  id: DatabaseScalar; bakery_id: DatabaseScalar; item_id: DatabaseScalar;
  transaction_type: DatabaseScalar; quantity_change: DatabaseScalar; unit_cost_cents: DatabaseScalar;
  invoice_reference: DatabaseScalar; source_key: DatabaseScalar; notes: DatabaseScalar;
  created_at: DatabaseScalar;
};
type TaskExecutionLogRow = {
  id: DatabaseScalar; bakery_id: DatabaseScalar; task_id: DatabaseScalar; action: DatabaseScalar;
  elapsed_seconds: DatabaseScalar; delay_minutes: DatabaseScalar; reason: DatabaseScalar;
  created_at: DatabaseScalar;
};
type StarterInventoryTableRows = {
  starter_profiles: StarterProfileRow;
  starter_builds: StarterBuildRow;
  inventory_transactions: InventoryTransactionRow;
  task_execution_logs: TaskExecutionLogRow;
};

interface StarterInventoryQuery<Row> extends PromiseLike<QueryResult<Row[]>> {
  select(columns?: string): StarterInventoryQuery<Row>;
  eq(column: string, value: string): StarterInventoryQuery<Row>;
  order(column: string, options: { ascending: boolean }): StarterInventoryQuery<Row>;
  limit(count: number): StarterInventoryQuery<Row>;
  insert(payload: object): StarterInventoryQuery<Row>;
  single(): Promise<QueryResult<Row>>;
}

export interface StarterInventoryClient {
  from<Table extends keyof StarterInventoryTableRows>(
    table: Table,
  ): StarterInventoryQuery<StarterInventoryTableRows[Table]>;
}

function getStarterInventoryClient(): StarterInventoryClient {
  // The generated client schema does not yet include these tables.
  return getSupabaseBrowserClient() as unknown as StarterInventoryClient;
}

export type InventoryTransactionType = "deduction" | "restock" | "adjustment";
export type TaskExecutionAction =
  | "timer_start"
  | "timer_stop"
  | "delay"
  | "skip"
  | "complete";

export interface StarterProfile {
  id: string;
  bakery_id: string;
  name: string;
  flour_ratio: number;
  water_ratio: number;
  seed_ratio: number;
  build_duration_hours: number;
  is_default: boolean;
  created_at: string;
}

export interface CreateStarterProfileInput {
  bakery_id: string;
  name: string;
  flour_ratio: number;
  water_ratio: number;
  seed_ratio: number;
  build_duration_hours?: number;
  is_default?: boolean;
}

export interface StarterBuild {
  id: string;
  bakery_id: string;
  profile_id: string | null;
  target_date: string;
  seed_amount_g: number;
  flour_amount_g: number;
  water_amount_g: number;
  total_build_g: number;
  usable_amount_g: number;
  retained_starter_g: number;
  created_at: string;
}

export interface CreateStarterBuildInput {
  bakery_id: string;
  profile_id?: string | null;
  target_date: string;
  seed_amount_g: number;
  flour_amount_g: number;
  water_amount_g: number;
  total_build_g: number;
  usable_amount_g: number;
  retained_starter_g: number;
}

export interface InventoryTransaction {
  id: string;
  bakery_id: string;
  item_id: string;
  transaction_type: InventoryTransactionType;
  quantity_change: number;
  unit_cost_cents: number | null;
  invoice_reference: string | null;
  source_key: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateInventoryTransactionInput {
  bakery_id: string;
  item_id: string;
  transaction_type: InventoryTransactionType;
  quantity_change: number;
  unit_cost_cents?: number | null;
  invoice_reference?: string | null;
  source_key?: string | null;
  notes?: string | null;
}

export interface TaskExecutionLog {
  id: string;
  bakery_id: string;
  task_id: string;
  action: TaskExecutionAction;
  elapsed_seconds: number;
  delay_minutes: number;
  reason: string | null;
  created_at: string;
}

export interface CreateTaskExecutionLogInput {
  bakery_id: string;
  task_id: string;
  action: TaskExecutionAction;
  elapsed_seconds?: number;
  delay_minutes?: number;
  reason?: string | null;
}

// Data Transformers
export function transformStarterProfileRow(row: StarterProfileRow): StarterProfile {
  return {
    id: String(row.id),
    bakery_id: String(row.bakery_id),
    name: String(row.name),
    flour_ratio: Number(row.flour_ratio),
    water_ratio: Number(row.water_ratio),
    seed_ratio: Number(row.seed_ratio),
    build_duration_hours: Number(row.build_duration_hours ?? 8.0),
    is_default: Boolean(row.is_default),
    created_at: String(row.created_at),
  };
}

export function transformStarterBuildRow(row: StarterBuildRow): StarterBuild {
  return {
    id: String(row.id),
    bakery_id: String(row.bakery_id),
    profile_id: row.profile_id ? String(row.profile_id) : null,
    target_date: String(row.target_date),
    seed_amount_g: Number(row.seed_amount_g),
    flour_amount_g: Number(row.flour_amount_g),
    water_amount_g: Number(row.water_amount_g),
    total_build_g: Number(row.total_build_g),
    usable_amount_g: Number(row.usable_amount_g),
    retained_starter_g: Number(row.retained_starter_g),
    created_at: String(row.created_at),
  };
}

export function transformInventoryTransactionRow(
  row: InventoryTransactionRow,
): InventoryTransaction {
  return {
    id: String(row.id),
    bakery_id: String(row.bakery_id),
    item_id: String(row.item_id),
    transaction_type: row.transaction_type as InventoryTransactionType,
    quantity_change: Number(row.quantity_change),
    unit_cost_cents:
      row.unit_cost_cents != null ? Number(row.unit_cost_cents) : null,
    invoice_reference: row.invoice_reference
      ? String(row.invoice_reference)
      : null,
    source_key: row.source_key ? String(row.source_key) : null,
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
  };
}

export function transformTaskExecutionLogRow(row: TaskExecutionLogRow): TaskExecutionLog {
  return {
    id: String(row.id),
    bakery_id: String(row.bakery_id),
    task_id: String(row.task_id),
    action: row.action as TaskExecutionAction,
    elapsed_seconds: Number(row.elapsed_seconds ?? 0),
    delay_minutes: Number(row.delay_minutes ?? 0),
    reason: row.reason ? String(row.reason) : null,
    created_at: String(row.created_at),
  };
}

// Starter Profiles Database Functions
export async function fetchStarterProfiles(
  bakeryId: string,
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<StarterProfile[]> {
  const { data, error } = await client
    .from("starter_profiles")
    .select("*")
    .eq("bakery_id", bakeryId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch starter profiles: ${error.message}`);
  }

  return (data || []).map(transformStarterProfileRow);
}

export async function insertStarterProfile(
  input: CreateStarterProfileInput,
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<StarterProfile> {
  const payload = {
    bakery_id: input.bakery_id,
    name: input.name,
    flour_ratio: input.flour_ratio,
    water_ratio: input.water_ratio,
    seed_ratio: input.seed_ratio,
    build_duration_hours: input.build_duration_hours ?? 8.0,
    is_default: input.is_default ?? false,
  };

  const { data, error } = await client
    .from("starter_profiles")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert starter profile: ${error.message}`);
  }

  return transformStarterProfileRow(data);
}

// Starter Builds Database Functions
export async function fetchStarterBuilds(
  bakeryId: string,
  options?: { targetDate?: string; limit?: number },
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<StarterBuild[]> {
  let query = client
    .from("starter_builds")
    .select("*")
    .eq("bakery_id", bakeryId);

  if (options?.targetDate) {
    query = query.eq("target_date", options.targetDate);
  }

  query = query.order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch starter builds: ${error.message}`);
  }

  return (data || []).map(transformStarterBuildRow);
}

export async function insertStarterBuild(
  input: CreateStarterBuildInput,
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<StarterBuild> {
  const payload = {
    bakery_id: input.bakery_id,
    profile_id: input.profile_id ?? null,
    target_date: input.target_date,
    seed_amount_g: input.seed_amount_g,
    flour_amount_g: input.flour_amount_g,
    water_amount_g: input.water_amount_g,
    total_build_g: input.total_build_g,
    usable_amount_g: input.usable_amount_g,
    retained_starter_g: input.retained_starter_g,
  };

  const { data, error } = await client
    .from("starter_builds")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert starter build: ${error.message}`);
  }

  return transformStarterBuildRow(data);
}

// Inventory Transactions Database Functions
export async function fetchInventoryTransactions(
  bakeryId: string,
  options?: { itemId?: string; limit?: number },
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<InventoryTransaction[]> {
  let query = client
    .from("inventory_transactions")
    .select("*")
    .eq("bakery_id", bakeryId);

  if (options?.itemId) {
    query = query.eq("item_id", options.itemId);
  }

  query = query.order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch inventory transactions: ${error.message}`);
  }

  return (data || []).map(transformInventoryTransactionRow);
}

export async function insertInventoryTransaction(
  input: CreateInventoryTransactionInput,
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<InventoryTransaction> {
  const payload = {
    bakery_id: input.bakery_id,
    item_id: input.item_id,
    transaction_type: input.transaction_type,
    quantity_change: input.quantity_change,
    unit_cost_cents: input.unit_cost_cents ?? null,
    invoice_reference: input.invoice_reference ?? null,
    source_key: input.source_key ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await client
    .from("inventory_transactions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert inventory transaction: ${error.message}`);
  }

  return transformInventoryTransactionRow(data);
}

// Task Execution Logs Database Functions
export async function fetchTaskExecutionLogs(
  bakeryId: string,
  options?: { taskId?: string; limit?: number },
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<TaskExecutionLog[]> {
  let query = client
    .from("task_execution_logs")
    .select("*")
    .eq("bakery_id", bakeryId);

  if (options?.taskId) {
    query = query.eq("task_id", options.taskId);
  }

  query = query.order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch task execution logs: ${error.message}`);
  }

  return (data || []).map(transformTaskExecutionLogRow);
}

export async function insertTaskExecutionLog(
  input: CreateTaskExecutionLogInput,
  client: StarterInventoryClient = getStarterInventoryClient(),
): Promise<TaskExecutionLog> {
  const payload = {
    bakery_id: input.bakery_id,
    task_id: input.task_id,
    action: input.action,
    elapsed_seconds: input.elapsed_seconds ?? 0,
    delay_minutes: input.delay_minutes ?? 0,
    reason: input.reason ?? null,
  };

  const { data, error } = await client
    .from("task_execution_logs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert task execution log: ${error.message}`);
  }

  return transformTaskExecutionLogRow(data);
}
