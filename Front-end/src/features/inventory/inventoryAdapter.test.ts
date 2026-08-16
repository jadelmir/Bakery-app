import { describe, expect, it, vi } from "vitest";
import { createSupabaseInventoryAdapter } from "./inventoryAdapter";

const itemRow = {
  id: "11111111-1111-4111-8111-111111111111",
  bakery_id: "bakery-1",
  name: "Bread flour",
  unit: "g",
  package_quantity: 10000,
  package_price: 17,
  cost_per_unit: 0.0017,
  on_hand: 0,
  min_level: 5000,
  kind: "ingredient",
  recipe_id: null,
  reserved: 0,
  average_unit_cost_cents: 0.17,
};

describe("Supabase inventory adapter", () => {
  it("saves a priced inventory item through the ingredients table", async () => {
    const query = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: itemRow, error: null }),
    };
    const client = {
      from: vi.fn().mockReturnValue(query),
      rpc: vi.fn(),
    } as unknown as Parameters<typeof createSupabaseInventoryAdapter>[0];
    const adapter = createSupabaseInventoryAdapter(client);

    const result = await adapter.createIngredient({
      bakeryId: "bakery-1",
      operationId: "create-flour-1",
      ingredientId: itemRow.id,
      name: "Bread flour",
      unit: "g",
      packageQuantity: 10000,
      packagePrice: 17,
      minLevel: 5000,
      kind: "ingredient",
    });

    expect(query.insert).toHaveBeenCalledWith({
      id: itemRow.id,
      bakery_id: "bakery-1",
      name: "Bread flour",
      unit: "g",
      package_quantity: 10000,
      package_price: 17,
      min_level: 5000,
      kind: "ingredient",
    });
    expect(result).toMatchObject({ ok: true, data: { changes: { inventoryItems: [{ id: itemRow.id, packagePrice: 17, packageQuantity: 10000, onHand: 0 }] } } });
  });

  it("archives an inventory item without deleting its history", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: (value: { data: null; error: null }) => unknown) => resolve({ data: null, error: null }),
    };
    const client = {
      from: vi.fn().mockReturnValue(query),
      rpc: vi.fn(),
    } as unknown as Parameters<typeof createSupabaseInventoryAdapter>[0];
    const adapter = createSupabaseInventoryAdapter(client);

    const result = await adapter.deleteIngredient({ bakeryId: "bakery-1", operationId: "delete-flour-1", ingredientId: itemRow.id });

    expect(query.update).toHaveBeenCalledWith({ archived: true, updated_at: expect.any(String) });
    expect(query.eq).toHaveBeenNthCalledWith(1, "bakery_id", "bakery-1");
    expect(query.eq).toHaveBeenNthCalledWith(2, "id", itemRow.id);
    expect(result).toMatchObject({ ok: true, data: { kind: "ingredient-deleted" } });
  });
});
