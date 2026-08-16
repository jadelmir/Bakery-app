import { describe, expect, it, vi } from "vitest";
import { createSupabaseRecipeAdapter } from "./recipeAdapter";

const bakeryId = "11111111-1111-4111-8111-111111111111";
const recipeId = "22222222-2222-4222-8222-222222222222";
const flourId = "33333333-3333-4333-8333-333333333333";
const waterId = "44444444-4444-4444-8444-444444444444";

const recipeRow = {
  id: recipeId,
  bakery_id: bakeryId,
  name: "Sourdough",
  yield: "1 loaf",
  batch_cost_cents: 125,
  selling_price_cents: 900,
  flow_id: "flow-uuid-from-production-flows",
  created_at: "2026-08-15T00:00:00Z",
  updated_at: "2026-08-15T00:00:00Z",
};

function query(data: unknown, error: null | { message: string; code?: string } = null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(async () => ({ data, error })),
    then: (resolve: (value: { data: unknown; error: null | { message: string; code?: string } }) => unknown) =>
      Promise.resolve({ data, error }).then(resolve),
  };
  return chain;
}

describe("Supabase recipe adapter", () => {
  it("loads recipes and derives ingredient costs from current inventory", async () => {
    const client = {
      from: vi.fn((table: string) => table === "recipes"
        ? query([recipeRow])
        : query([
          {
            recipe_id: recipeId,
            inventory_item_id: flourId,
            quantity: 500,
            created_at: null,
            updated_at: null,
          },
          {
            recipe_id: recipeId,
            inventory_item_id: waterId,
            quantity: 350,
            created_at: null,
            updated_at: null,
          },
        ])),
      rpc: vi.fn(),
    };
    const adapter = createSupabaseRecipeAdapter(client as never);

    const result = await adapter.loadRecipes(
      { bakeryId },
      [
        { id: flourId, name: "Flour", unit: "g", unitCost: 0.002, onHand: 0, minLevel: 0, kind: "ingredient", status: "in-stock" },
        { id: waterId, name: "Water", unit: "g", unitCost: 0.0001, onHand: 0, minLevel: 0, kind: "ingredient", status: "in-stock" },
      ],
    );

    expect(result).toEqual({
      ok: true,
      data: [{
        id: recipeId,
        name: "Sourdough",
        yield: "1 loaf",
        batchCost: 1.03,
        sellingPrice: 9,
        flowId: "flow-uuid-from-production-flows",
        ingredients: [
          { inventoryItemId: flourId, quantity: 500, cost: 1 },
          { inventoryItemId: waterId, quantity: 350, cost: 0.035 },
        ],
        archived: false,
        marginPercent: 88.56,
      }],
    });
  });

  it("saves through the atomic RPC and returns authoritative persisted costs", async () => {
    const client = {
      from: vi.fn(),
      rpc: vi.fn(async () => ({
        data: {
          recipe: recipeRow,
          ingredients: [
            { recipe_id: recipeId, inventory_item_id: flourId, quantity: 500, cost: 1.25, created_at: null, updated_at: null },
          ],
        },
        error: null,
      })),
    };
    const adapter = createSupabaseRecipeAdapter(client as never);

    const result = await adapter.createRecipe({
      bakeryId,
      operationId: "create-recipe-operation",
      recipeId,
      name: "Sourdough",
      yield: "1 loaf",
      sellingPrice: 9,
      flowId: "flow-uuid-from-production-flows",
      ingredients: [{ inventoryItemId: flourId, quantity: 500 }],
    });

    expect(client.rpc).toHaveBeenCalledWith("save_recipe", expect.objectContaining({
      p_bakery_id: bakeryId,
      p_recipe_id: recipeId,
      p_flow_id: "flow-uuid-from-production-flows",
      p_ingredients_json: [{ inventory_item_id: flourId, quantity: 500 }],
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.kind).toBe("recipe-mutated");
      expect(result.data.changes.recipes[0]).toMatchObject({ batchCost: 1.25, sellingPrice: 9 });
    }
  });

  it("rejects non-UUID persisted IDs before calling Supabase", async () => {
    const client = { from: vi.fn(), rpc: vi.fn() };
    const adapter = createSupabaseRecipeAdapter(client as never);

    const result = await adapter.createRecipe({
      bakeryId,
      operationId: "create-recipe-operation",
      recipeId: "r-local-id",
      name: "Sourdough",
      yield: "1 loaf",
      sellingPrice: 9,
      flowId: null,
      ingredients: [],
    });

    expect(result).toMatchObject({ ok: false, error: { kind: "validation" } });
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
