import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import type {
  AdapterFailure,
  AdapterResult,
  BakeryScope,
  CreateRecipeInput,
  DomainInventoryItem,
  DomainRecipe,
  DomainRecipeIngredient,
  RecipePort,
  RecipeResult,
  UpdateRecipeInput,
} from "../../app/domain/types";

const RECIPE_COLUMNS = "id,bakery_id,name,yield,batch_cost_cents,selling_price_cents,flow_id,created_at,updated_at";
const RECIPE_INGREDIENT_COLUMNS = "recipe_id,inventory_item_id,quantity,created_at,updated_at";

type QueryError = { code?: string; message: string; status?: number };
type QueryResult<T> = { data: T | null; error: QueryError | null };

export interface RecipeRow {
  id: string | null;
  bakery_id: string | null;
  name: string | null;
  yield: string | null;
  batch_cost_cents: number | string | null;
  selling_price_cents: number | string | null;
  flow_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RecipeIngredientRow {
  recipe_id: string | null;
  inventory_item_id: string | null;
  quantity: number | string | null;
  cost?: number | string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface RecipeQuery<T> extends PromiseLike<QueryResult<T>> {
  select<TResult = T>(columns: string): RecipeQuery<TResult>;
  eq(column: "bakery_id" | "recipe_id", value: string): RecipeQuery<T>;
  in(column: "recipe_id", values: readonly string[]): RecipeQuery<T>;
  order(column: "name", options: { ascending: boolean }): RecipeQuery<T>;
}

interface RecipeClient {
  from(table: "recipes" | "recipe_ingredients"): RecipeQuery<unknown>;
  rpc(functionName: "save_recipe", args: Record<string, unknown>): Promise<QueryResult<unknown>>;
}

export interface SupabaseRecipeAdapter extends Pick<RecipePort, "createRecipe" | "updateRecipe"> {
  loadRecipes(
    scope: BakeryScope,
    inventoryItems?: readonly DomainInventoryItem[],
  ): Promise<AdapterResult<readonly DomainRecipe[]>>;
}

type RecipeIngredientDraft = {
  inventoryItemId: string;
  quantity: number;
  unitCost?: number;
};

const failure = (error: AdapterFailure): AdapterResult<never> => ({ ok: false, error });

const validation = (message: string, field?: string): AdapterResult<never> => failure({
  kind: "validation",
  message,
  retryable: false,
  ...(field ? { field } : {}),
});

const text = (value: string | null, field: string): string => {
  if (value == null || value.trim() === "") throw new Error(`Recipe row is missing ${field}.`);
  return value;
};

const numberValue = (value: number | string | null, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Recipe row has an invalid ${field}.`);
  return parsed;
};

const optionalNumber = (value: number | string | null | undefined): number | undefined => {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function mapError(error: QueryError, operation: string): AdapterFailure {
  const code = error.code?.toUpperCase();
  const message = `${operation}: ${error.message}`;
  if (error.status === 401 || error.status === 403 || code === "42501" || code === "PGRST301") {
    return { kind: "authorization", message, retryable: false };
  }
  if (code?.startsWith("22") || code?.startsWith("23") || error.status === 400) {
    return { kind: "validation", message, retryable: false };
  }
  if (code?.startsWith("08") || code === "PGRST000" || /failed to fetch|network|timeout|connection/i.test(error.message)) {
    return { kind: "connection", message, retryable: true };
  }
  return { kind: "unknown", message, retryable: false };
}

function marginPercent(sellingPrice: number, batchCost: number): number {
  if (sellingPrice <= 0) return 0;
  return Math.round(((sellingPrice - batchCost) / sellingPrice) * 10000) / 100;
}

function mapIngredientRows(
  rows: readonly RecipeIngredientRow[],
  inventoryById: ReadonlyMap<string, DomainInventoryItem>,
): readonly DomainRecipeIngredient[] {
  return rows.map((row) => {
    const inventoryItemId = text(row.inventory_item_id, "ingredient inventory item id");
    const quantity = numberValue(row.quantity, "ingredient quantity");
    const inventoryItem = inventoryById.get(inventoryItemId);
    const unitCost = inventoryItem?.unitCost ?? inventoryItem?.averageUnitCost ?? 0;
    const persistedCost = optionalNumber(row.cost);
    return {
      inventoryItemId,
      quantity,
      cost: persistedCost ?? Math.round(quantity * unitCost * 10000) / 10000,
    };
  });
}

function mapRecipeRow(
  row: RecipeRow,
  ingredientRows: readonly RecipeIngredientRow[],
  bakeryId: string,
  inventoryById: ReadonlyMap<string, DomainInventoryItem>,
): DomainRecipe {
  if (row.bakery_id !== bakeryId) throw new Error("Supabase returned a recipe outside the active bakery.");
  const id = text(row.id, "id");
  const name = text(row.name, "name");
  const sellingPrice = numberValue(row.selling_price_cents, "selling_price_cents") / 100;
  const persistedBatchCost = numberValue(row.batch_cost_cents, "batch_cost_cents") / 100;
  const ingredients = mapIngredientRows(ingredientRows, inventoryById);
  const derivedBatchCost = ingredients.reduce((total, ingredient) => total + ingredient.cost, 0);
  const batchCost = ingredients.length > 0 ? Math.round(derivedBatchCost * 100) / 100 : persistedBatchCost;
  return {
    id,
    name,
    yield: row.yield?.trim() || "1 batch",
    batchCost,
    sellingPrice,
    flowId: row.flow_id,
    ingredients,
    archived: false,
    marginPercent: marginPercent(sellingPrice, batchCost),
  };
}

function mapRpcPayload(
  payload: unknown,
  bakeryId: string,
  inventoryById: ReadonlyMap<string, DomainInventoryItem>,
  operation: string,
): AdapterResult<DomainRecipe> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return failure({ kind: "unknown", message: `${operation}: Supabase returned an invalid recipe payload.`, retryable: false });
  }
  const value = payload as { recipe?: RecipeRow; ingredients?: RecipeIngredientRow[] };
  if (!value.recipe || !Array.isArray(value.ingredients)) {
    return failure({ kind: "unknown", message: `${operation}: Supabase returned an incomplete recipe payload.`, retryable: false });
  }
  try {
    return { ok: true, data: mapRecipeRow(value.recipe, value.ingredients, bakeryId, inventoryById) };
  } catch (error) {
    return failure({
      kind: "unknown",
      message: `${operation}: ${error instanceof Error ? error.message : "Supabase returned invalid recipe data."}`,
      retryable: false,
    });
  }
}

function result(operationId: string, recipe: DomainRecipe): AdapterResult<RecipeResult> {
  return {
    ok: true,
    data: {
      kind: "recipe-mutated",
      operationId,
      changes: { recipes: [recipe] },
    },
  };
}

function ingredientsJson(ingredients: readonly { inventoryItemId: string; quantity: number }[]): readonly Record<string, unknown>[] {
  return ingredients.map((ingredient) => ({
    inventory_item_id: ingredient.inventoryItemId,
    quantity: ingredient.quantity,
  }));
}

export function createSupabaseRecipeAdapter(
  client: RecipeClient = getSupabaseBrowserClient() as unknown as RecipeClient,
): SupabaseRecipeAdapter {
  const loadRecipes = async (
    scope: BakeryScope,
    inventoryItems: readonly DomainInventoryItem[] = [],
  ): Promise<AdapterResult<readonly DomainRecipe[]>> => {
    if (!scope.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");

    const recipeResult = await client
      .from("recipes")
      .select<RecipeRow[]>(RECIPE_COLUMNS)
      .eq("bakery_id", scope.bakeryId)
      .order("name", { ascending: true });
    if (recipeResult.error) return failure(mapError(recipeResult.error, "Failed to load recipes"));

    const rows = recipeResult.data ?? [];
    const recipeIds = rows.map((row) => row.id).filter((id): id is string => Boolean(id));
    const ingredientResult = recipeIds.length === 0
      ? { data: [] as RecipeIngredientRow[], error: null }
      : await client
        .from("recipe_ingredients")
        .select<RecipeIngredientRow[]>(RECIPE_INGREDIENT_COLUMNS)
        .in("recipe_id", recipeIds);
    if (ingredientResult.error) return failure(mapError(ingredientResult.error, "Failed to load recipe ingredients"));

    const inventoryById = new Map(inventoryItems.map((item) => [item.id, item]));
    const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();
    for (const row of ingredientResult.data ?? []) {
      if (!row.recipe_id) continue;
      const current = ingredientsByRecipe.get(row.recipe_id) ?? [];
      current.push(row);
      ingredientsByRecipe.set(row.recipe_id, current);
    }

    try {
      return {
        ok: true,
        data: rows
          .filter((row) => row.bakery_id === scope.bakeryId)
          .map((row) => mapRecipeRow(row, ingredientsByRecipe.get(row.id ?? "") ?? [], scope.bakeryId, inventoryById)),
      };
    } catch (error) {
      return failure({
        kind: "unknown",
        message: `Failed to load recipes: ${error instanceof Error ? error.message : "Supabase returned invalid recipe data."}`,
        retryable: false,
      });
    }
  };

  const saveRecipe = async (
    input: CreateRecipeInput | UpdateRecipeInput,
    current: { name: string; yield: string; sellingPrice: number; flowId: string | null; ingredients: readonly RecipeIngredientDraft[] },
  ): Promise<AdapterResult<RecipeResult>> => {
    if (!input.operationId.trim()) return validation("An operation ID is required for a safe retry.", "operationId");
    if (!input.bakeryId.trim()) return validation("A bakery ID is required.", "bakeryId");
    if (!isUuid(input.recipeId)) return validation("A persisted recipe ID must be a UUID.", "recipeId");
    if (!Number.isFinite(current.sellingPrice) || current.sellingPrice < 0) return validation("Selling price cannot be negative.", "sellingPrice");

    const { data, error } = await client.rpc("save_recipe", {
      p_bakery_id: input.bakeryId,
      p_recipe_id: input.recipeId,
      p_name: current.name,
      p_yield: current.yield,
      p_selling_price_cents: Math.round(current.sellingPrice * 100),
      p_flow_id: current.flowId,
      p_ingredients_json: ingredientsJson(current.ingredients),
    });
    if (error) return failure(mapError(error, "Failed to save recipe"));

    const inventoryById = new Map<string, DomainInventoryItem>();
    for (const ingredient of current.ingredients) {
      if (ingredient.unitCost !== undefined) {
        inventoryById.set(ingredient.inventoryItemId, {
          id: ingredient.inventoryItemId,
          name: ingredient.inventoryItemId,
          unit: "unit",
          onHand: 0,
          minLevel: 0,
          kind: "ingredient",
          unitCost: ingredient.unitCost,
          status: "in-stock",
        });
      }
    }
    const mapped = mapRpcPayload(data, input.bakeryId, inventoryById, "Failed to save recipe");
    return mapped.ok ? result(input.operationId, mapped.data) : mapped;
  };

  return {
    loadRecipes,

    async createRecipe(input) {
      return saveRecipe(input, {
        name: input.name,
        yield: input.yield,
        sellingPrice: input.sellingPrice,
        flowId: input.flowId,
        ingredients: input.ingredients,
      });
    },

    async updateRecipe(input) {
      if (input.name === undefined || input.yield === undefined || input.sellingPrice === undefined || input.flowId === undefined || input.ingredients === undefined) {
        return validation("Recipe updates must include the complete authoritative recipe payload.");
      }
      return saveRecipe(input, {
        name: input.name,
        yield: input.yield,
        sellingPrice: input.sellingPrice,
        flowId: input.flowId,
        ingredients: input.ingredients,
      });
    },
  };
}

export const createSupabaseRecipePort = createSupabaseRecipeAdapter;
