import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type {
  AdapterFailure,
  AdapterResult,
  AdjustInventoryInput,
  BakeryDomainSnapshot,
  CreateIngredientInput,
  CreateIngredientResult,
  DeleteIngredientInput,
  DeleteIngredientResult,
  DomainInventoryItem,
  DomainInventoryTransaction,
  InventoryBaseUnit,
  InventoryResult,
  ReceiveInventoryInput,
  UpdateIngredientInput,
  UpdateIngredientResult,
} from "../../app/domain/types";

const INVENTORY_COLUMNS = "id,bakery_id,name,unit,package_quantity,package_price,cost_per_unit,on_hand,min_level,kind,recipe_id,reserved,average_unit_cost_cents,archived";
const TRANSACTION_COLUMNS = "id,bakery_id,item_id,transaction_type,quantity_change,base_unit,unit_cost_cents,total_cost_cents,source_key,source_type,source_id,actor_id,created_at";

type QueryError = { code?: string; message: string; status?: number };
type QueryResult<T> = { data: T | null; error: QueryError | null };

interface InventoryQuery<T> extends PromiseLike<QueryResult<T>> {
  select<TResult = T>(columns: string): InventoryQuery<TResult>;
  insert<TResult = T>(values: InventoryInsert): InventoryQuery<TResult>;
  update<TResult = T>(values: InventoryUpdate): InventoryQuery<TResult>;
  eq(column: string, value: string): InventoryQuery<T>;
  order(column: string, options: { ascending: boolean }): InventoryQuery<T>;
  single<TResult = T>(): InventoryQuery<TResult>;
}

interface InventoryClient {
  from(table: "ingredients" | "inventory_transactions"): InventoryQuery<unknown>;
  rpc(functionName: "receive_inventory_stock" | "adjust_inventory_stock", args: Record<string, unknown>): Promise<QueryResult<unknown>>;
}

interface InventoryInsert {
  id: string;
  bakery_id: string;
  name: string;
  unit: InventoryBaseUnit;
  package_quantity: number;
  package_price: number;
  min_level: number;
  kind: "ingredient" | "packaging";
}

interface InventoryUpdate {
  name?: string;
  unit?: InventoryBaseUnit;
  package_quantity?: number;
  package_price?: number;
  min_level?: number;
  kind?: "ingredient" | "packaging";
  archived?: boolean;
  updated_at: string;
}

interface InventoryRow {
  id: string | null;
  bakery_id: string | null;
  name: string | null;
  unit: string | null;
  package_quantity: number | string | null;
  package_price: number | string | null;
  cost_per_unit: number | string | null;
  on_hand: number | string | null;
  min_level: number | string | null;
  kind: string | null;
  recipe_id: string | null;
  reserved: number | string | null;
  average_unit_cost_cents: number | string | null;
  archived: boolean | null;
}

interface InventoryTransactionRow {
  id: string | null;
  bakery_id: string | null;
  item_id: string | null;
  transaction_type: string | null;
  quantity_change: number | string | null;
  base_unit: string | null;
  unit_cost_cents: number | string | null;
  total_cost_cents: number | string | null;
  source_key: string | null;
  source_type: string | null;
  source_id: string | null;
  actor_id: string | null;
  created_at: string | null;
}

export interface SupabaseInventoryData {
  readonly items: readonly DomainInventoryItem[];
  readonly transactions: readonly DomainInventoryTransaction[];
}

export interface SupabaseInventoryAdapter {
  loadInventory(bakeryId: string): Promise<AdapterResult<SupabaseInventoryData>>;
  createIngredient(input: CreateIngredientInput): Promise<AdapterResult<CreateIngredientResult>>;
  updateIngredient(input: UpdateIngredientInput): Promise<AdapterResult<UpdateIngredientResult>>;
  deleteIngredient(input: DeleteIngredientInput): Promise<AdapterResult<DeleteIngredientResult>>;
  receiveInventory(input: ReceiveInventoryInput): Promise<AdapterResult<InventoryResult>>;
  adjustInventory(input: AdjustInventoryInput): Promise<AdapterResult<InventoryResult>>;
}

const failure = (error: AdapterFailure): AdapterResult<never> => ({ ok: false, error });

const validation = (message: string, field?: string): AdapterResult<never> => failure({
  kind: "validation",
  message,
  retryable: false,
  ...(field ? { field } : {}),
});

const requiredText = (value: string | null, field: string): string => {
  if (!value || !value.trim()) throw new Error(`Inventory row is missing ${field}.`);
  return value;
};

const numeric = (value: number | string | null, field: string): number => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`Inventory row has an invalid ${field}.`);
  return result;
};

const baseUnit = (value: string | null): InventoryBaseUnit => {
  if (value === "g" || value === "ml" || value === "unit") return value;
  throw new Error("Inventory row has an invalid base unit.");
};

const itemKind = (value: string | null): DomainInventoryItem["kind"] => {
  if (value === "ingredient" || value === "packaging" || value === "finished_good") return value;
  throw new Error("Inventory row has an invalid item category.");
};

function mapInventoryRow(row: InventoryRow, bakeryId: string): DomainInventoryItem {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned an inventory item outside the active bakery.");
  const itemUnit = baseUnit(row.unit);
  const kind = itemKind(row.kind);
  const onHand = numeric(row.on_hand, "on_hand");
  const minLevel = numeric(row.min_level, "min_level");
  const packageQuantity = numeric(row.package_quantity, "package_quantity");
  const packagePrice = numeric(row.package_price, "package_price");
  const unitCost = row.cost_per_unit == null ? packagePrice / packageQuantity : numeric(row.cost_per_unit, "cost_per_unit");
  const reserved = row.reserved == null ? 0 : numeric(row.reserved, "reserved");

  return {
    id: requiredText(row.id, "id"),
    name: requiredText(row.name, "name"),
    unit: itemUnit,
    onHand,
    minLevel,
    kind,
    reserved,
    recipeId: row.recipe_id ?? undefined,
    averageUnitCost: row.average_unit_cost_cents == null ? unitCost : numeric(row.average_unit_cost_cents, "average_unit_cost_cents") / 100,
    packageQuantity,
    packagePrice,
    unitCost,
    archived: row.archived ?? false,
    status: onHand <= 0 ? "out-of-stock" : onHand <= minLevel ? "low" : "in-stock",
  };
}

function mapTransactionRow(row: InventoryTransactionRow, bakeryId: string): DomainInventoryTransaction | null {
  if (row.bakery_id !== bakeryId || !row.item_id || !row.id) return null;
  const transactionType = row.transaction_type;
  const reason: DomainInventoryTransaction["reason"] = transactionType === "purchase"
    ? "purchase"
    : transactionType === "production_usage"
      ? "production-usage"
      : transactionType === "production_output"
        ? "production-output"
        : transactionType === "reservation"
          ? "reservation"
          : "adjustment";

  return {
    id: row.id,
    sourceKey: row.source_key ?? row.id,
    itemId: row.item_id,
    quantityChange: numeric(row.quantity_change, "quantity_change"),
    reason,
    transactionType: transactionType === "purchase" || transactionType === "manual_adjustment" || transactionType === "production_usage" || transactionType === "production_output" ? transactionType : undefined,
    baseUnit: row.base_unit ? baseUnit(row.base_unit) : undefined,
    unitCost: row.unit_cost_cents == null ? undefined : numeric(row.unit_cost_cents, "unit_cost_cents") / 100,
    totalCost: row.total_cost_cents == null ? undefined : numeric(row.total_cost_cents, "total_cost_cents") / 100,
    actorId: row.actor_id ?? undefined,
    sourceType: row.source_type ?? undefined,
    sourceId: row.source_id ?? undefined,
    createdAt: row.created_at ?? undefined,
  };
}

function mapError(error: QueryError, operation: string): AdapterFailure {
  const code = error.code?.toUpperCase();
  const message = `${operation}: ${error.message}`;
  if (error.status === 401 || error.status === 403 || code === "42501" || code === "PGRST301") return { kind: "authorization", message, retryable: false };
  if (code?.startsWith("22") || code?.startsWith("23") || error.status === 400) return { kind: "validation", message, retryable: false };
  if (code?.startsWith("08") || code === "PGRST000" || /failed to fetch|network|timeout|connection/i.test(error.message)) return { kind: "connection", message, retryable: true };
  return { kind: "unknown", message, retryable: false };
}

function mappedError(operation: string, cause: unknown): AdapterResult<never> {
  return failure({ kind: "unknown", message: `${operation}: ${cause instanceof Error ? cause.message : "Supabase returned invalid inventory data."}`, retryable: false });
}

export function createSupabaseInventoryAdapter(
  client: InventoryClient = getSupabaseBrowserClient() as unknown as InventoryClient,
): SupabaseInventoryAdapter {
  const loadInventory = async (bakeryId: string): Promise<AdapterResult<SupabaseInventoryData>> => {
    if (!bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
    const [itemsResult, transactionsResult] = await Promise.all([
      client.from("ingredients").select<InventoryRow[]>(INVENTORY_COLUMNS).eq("bakery_id", bakeryId).eq("archived", "false").order("name", { ascending: true }),
      client.from("inventory_transactions").select<InventoryTransactionRow[]>(TRANSACTION_COLUMNS).eq("bakery_id", bakeryId).order("created_at", { ascending: false }),
    ]);
    if (itemsResult.error) return failure(mapError(itemsResult.error, "Failed to load inventory items"));
    if (transactionsResult.error) return failure(mapError(transactionsResult.error, "Failed to load inventory history"));

    try {
      return {
        ok: true,
        data: {
          items: (itemsResult.data ?? []).map(row => mapInventoryRow(row, bakeryId)),
          transactions: (transactionsResult.data ?? []).map(row => mapTransactionRow(row, bakeryId)).filter((row): row is DomainInventoryTransaction => row !== null),
        },
      };
    } catch (cause) {
      return mappedError("Failed to load inventory", cause);
    }
  };

  return {
    loadInventory,

    async createIngredient(input) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.ingredientId.trim()) return validation("An inventory item ID is required.", "ingredientId");
      if (!input.name.trim()) return validation("An inventory item name is required.", "name");

      const { data, error } = await client.from("ingredients")
        .insert<InventoryRow>({
          id: input.ingredientId,
          bakery_id: input.bakeryId,
          name: input.name.trim(),
          unit: input.unit as InventoryBaseUnit,
          package_quantity: input.packageQuantity,
          package_price: input.packagePrice,
          min_level: input.minLevel,
          kind: input.kind,
        })
        .select<InventoryRow>(INVENTORY_COLUMNS)
        .single();
      if (error) return failure(mapError(error, "Failed to save inventory item"));
      if (!data) return failure({ kind: "unknown", message: "Failed to save inventory item: Supabase returned no row.", retryable: false });

      try {
        return {
          ok: true,
          data: {
            kind: "ingredient-created",
            operationId: input.operationId,
            changes: { inventoryItems: [mapInventoryRow(data, input.bakeryId)] },
          },
        };
      } catch (cause) {
        return mappedError("Failed to save inventory item", cause);
      }
    },

    async updateIngredient(input) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.ingredientId.trim()) return validation("An inventory item ID is required.", "ingredientId");
      if (!input.name.trim()) return validation("An inventory item name is required.", "name");

      const { data, error } = await client.from("ingredients")
        .update<InventoryRow>({
          name: input.name.trim(),
          unit: input.unit,
          package_quantity: input.packageQuantity,
          package_price: input.packagePrice,
          min_level: input.minLevel,
          kind: input.kind,
          updated_at: new Date().toISOString(),
        })
        .eq("bakery_id", input.bakeryId)
        .eq("id", input.ingredientId)
        .select<InventoryRow>(INVENTORY_COLUMNS)
        .single();
      if (error) return failure(mapError(error, "Failed to update inventory item"));
      if (!data) return failure({ kind: "unknown", message: "Failed to update inventory item: Supabase returned no row.", retryable: false });

      try {
        return {
          ok: true,
          data: {
            kind: "ingredient-updated",
            operationId: input.operationId,
            changes: { inventoryItems: [mapInventoryRow(data, input.bakeryId)] },
          },
        };
      } catch (cause) {
        return mappedError("Failed to update inventory item", cause);
      }
    },

    async deleteIngredient(input) {
      if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
      if (!input.ingredientId.trim()) return validation("An inventory item ID is required.", "ingredientId");

      const { error } = await client.from("ingredients")
        .update<InventoryRow>({ archived: true, updated_at: new Date().toISOString() })
        .eq("bakery_id", input.bakeryId)
        .eq("id", input.ingredientId);
      if (error) return failure(mapError(error, "Failed to delete inventory item"));

      return {
        ok: true,
        data: {
          kind: "ingredient-deleted",
          operationId: input.operationId,
          changes: { inventoryItems: [] },
        },
      };
    },

    async receiveInventory(input) {
      const { data, error } = await client.rpc("receive_inventory_stock", {
        p_bakery_id: input.bakeryId,
        p_item_id: input.itemId,
        p_package_count: input.packageCount,
        p_package_quantity: input.packageQuantity,
        p_package_unit: input.packageUnit,
        p_package_price_cents: input.packagePriceCents,
        p_source_key: input.sourceKey,
        p_invoice_reference: input.invoiceReference ?? null,
        p_notes: input.notes ?? null,
      });
      if (error) return failure(mapError(error, "Failed to record inventory purchase"));
      if (!data) return failure({ kind: "unknown", message: "Failed to record inventory purchase: Supabase returned no result.", retryable: false });
      const loaded = await loadInventory(input.bakeryId);
      if (!loaded.ok) return loaded;
      return { ok: true, data: { kind: "inventory-mutated", operationId: input.operationId, changes: { inventoryItems: loaded.data.items, inventoryTransactions: loaded.data.transactions } } };
    },

    async adjustInventory(input) {
      const { data, error } = await client.rpc("adjust_inventory_stock", {
        p_bakery_id: input.bakeryId,
        p_item_id: input.itemId,
        p_adjustment_mode: "physical_count",
        p_quantity: input.newOnHand,
        p_source_key: input.operationId,
        p_reason: "physical_count",
        p_notes: input.notes ?? null,
      });
      if (error) return failure(mapError(error, "Failed to record inventory adjustment"));
      if (!data) return failure({ kind: "unknown", message: "Failed to record inventory adjustment: Supabase returned no result.", retryable: false });
      const loaded = await loadInventory(input.bakeryId);
      if (!loaded.ok) return loaded;
      return { ok: true, data: { kind: "inventory-mutated", operationId: input.operationId, changes: { inventoryItems: loaded.data.items, inventoryTransactions: loaded.data.transactions } } };
    },
  };
}
