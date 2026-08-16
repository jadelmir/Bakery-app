import React, { useMemo, useState, useId } from "react";
import { X, Plus, Trash2, BookOpen, DollarSign, Scale, Layers } from "lucide-react";
import {
  InventoryItemCreateDialog,
  type InventoryItemDraft,
} from "../inventory/InventoryItemCreateDialog";

export interface RecipeIngredientInput {
  inventoryItemId: string;
  quantity: number;
  cost?: number;
}

export interface RecipeEditorDialogProps {
  recipe?: {
    id?: string;
    name: string;
    yield: string;
    sellingPrice: number;
    batchCost?: number;
    flowId?: string | null;
    ingredients: readonly RecipeIngredientInput[];
  } | null;
  inventoryItems?: readonly {
    id: string;
    name: string;
    unit: string;
    kind?: "ingredient" | "packaging" | "finished_good";
    packageQuantity?: number;
    packagePrice?: number;
    unitCost?: number;
  }[];
  productionFlows?: readonly {
    id: string;
    name: string;
  }[];
  onClose: () => void;
  onSave: (recipeData: {
    id?: string;
    name: string;
    yield: string;
    sellingPrice: number;
    batchCost: number;
    flowId: string | null;
    ingredients: { inventoryItemId: string; quantity: number; cost: number }[];
  }) => void | Promise<void>;
  onCreateInventoryItem?: (
    draft: InventoryItemDraft,
  ) => Promise<{
    id: string;
    name: string;
    unit: string;
    kind?: "ingredient" | "packaging" | "finished_good";
    packageQuantity?: number;
    packagePrice?: number;
    unitCost?: number;
  } | void> | {
    id: string;
    name: string;
    unit: string;
    kind?: "ingredient" | "packaging" | "finished_good";
    packageQuantity?: number;
    packagePrice?: number;
    unitCost?: number;
  } | void;
}

const DEFAULT_FLOWS = [
  { id: "flow-sourdough", name: "Standard Sourdough Loaf" },
  { id: "flow-focaccia", name: "Standard Focaccia" },
];

export function RecipeEditorDialog({
  recipe,
  inventoryItems = [],
  productionFlows = DEFAULT_FLOWS,
  onClose,
  onSave,
  onCreateInventoryItem,
}: RecipeEditorDialogProps) {
  const titleId = useId();
  const [createdItems, setCreatedItems] = useState<NonNullable<RecipeEditorDialogProps["inventoryItems"]>>([]);
  const availableItems = useMemo(() => [...inventoryItems, ...createdItems], [inventoryItems, createdItems]);
  const availableFlows = productionFlows.length > 0 ? productionFlows : DEFAULT_FLOWS;

  const [name, setName] = useState(recipe?.name ?? "");
  const [recipeYield, setRecipeYield] = useState(recipe?.yield ?? "1 batch");
  const [sellingPrice, setSellingPrice] = useState<number | "">(recipe?.sellingPrice ?? 12.0);
  const [flowId, setFlowId] = useState<string | null>(recipe?.flowId ?? null);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createItemForRow, setCreateItemForRow] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [ingredients, setIngredients] = useState<
    { inventoryItemId: string; quantity: number; customUnitCost?: number }[]
  >(() => {
    if (recipe?.ingredients && recipe.ingredients.length > 0) {
      return recipe.ingredients.map((ing) => ({
        inventoryItemId: ing.inventoryItemId,
        quantity: ing.quantity,
        customUnitCost: ing.quantity > 0 && ing.cost !== undefined ? ing.cost / ing.quantity : undefined,
      }));
    }
    return [];
  });

  const getItemUnitCost = (itemId: string): number => {
    const item = availableItems.find((i) => i.id === itemId);
    if (!item) return 0;
    if (item.unitCost !== undefined) return item.unitCost;
    if ("packageQuantity" in item && item.packageQuantity && item.packageQuantity > 0 && "packagePrice" in item && item.packagePrice !== undefined) {
      return item.packagePrice / item.packageQuantity;
    }
    return 0;
  };

  const getLineCost = (line: { inventoryItemId: string; quantity: number; customUnitCost?: number }): number => {
    const unitCost = line.customUnitCost ?? getItemUnitCost(line.inventoryItemId);
    return line.quantity * unitCost;
  };

  const totalBatchCost = ingredients.reduce((sum, line) => sum + getLineCost(line), 0);
  const numericPrice = typeof sellingPrice === "number" ? sellingPrice : 0;
  const marginPercent = numericPrice > 0 ? ((numericPrice - totalBatchCost) / numericPrice) * 100 : 0;

  const getMarginBadgeStyle = (margin: number) => {
    if (margin >= 60) {
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    }
    if (margin >= 40) {
      return "bg-amber-50 text-amber-700 border-amber-300";
    }
    return "bg-rose-50 text-rose-700 border-rose-300";
  };

  const handleAddIngredient = () => {
    if (availableItems.length === 0) {
      setCreateItemForRow(null);
      setCreateItemOpen(true);
      return;
    }
    const nextItem = availableItems.find(
      (item) => !ingredients.some((ing) => ing.inventoryItemId === item.id)
    );
    setIngredients([...ingredients, { inventoryItemId: nextItem?.id ?? "", quantity: 100 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleCreateItem = async (draft: InventoryItemDraft) => {
    if (!onCreateInventoryItem) {
      throw new Error("Add this item from Inventory first, then return to the recipe.");
    }
    const created = await onCreateInventoryItem(draft);
    if (!created) return;
    setCreatedItems((current) => [...current, created]);
    setIngredients((current) => {
      const emptyIndex = createItemForRow ?? current.findIndex((line) => !line.inventoryItemId);
      if (emptyIndex >= 0 && emptyIndex < current.length) {
        return current.map((line, index) =>
          index === emptyIndex ? { ...line, inventoryItemId: created.id } : line,
        );
      }
      return [...current, { inventoryItemId: created.id, quantity: 100 }];
    });
    setCreateItemOpen(false);
    setCreateItemForRow(null);
  };

  const handleUpdateIngredient = (
    index: number,
    field: "inventoryItemId" | "quantity",
    value: string | number
  ) => {
    setIngredients(
      ingredients.map((ing, i) => {
        if (i !== index) return ing;
        if (field === "inventoryItemId") {
          return { ...ing, inventoryItemId: String(value), customUnitCost: undefined };
        }
        return { ...ing, quantity: Math.max(0, Number(value)) };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (ingredients.some((line) => !line.inventoryItemId)) {
      setFormError("Select an inventory item for each ingredient line, or remove the empty line.");
      return;
    }
    setFormError("");

    const compiledIngredients = ingredients.map((line) => ({
      inventoryItemId: line.inventoryItemId,
      quantity: line.quantity,
      cost: Number(getLineCost(line).toFixed(4)),
    }));

    setIsSaving(true);
    try {
      await onSave({
        id: recipe?.id,
        name: name.trim(),
        yield: recipeYield.trim() || "1 batch",
        sellingPrice: numericPrice,
        batchCost: Number(totalBatchCost.toFixed(2)),
        flowId,
        ingredients: compiledIngredients,
      });
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save recipe.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E5DDD3] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DDD3]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F6F0E8] flex items-center justify-center text-[#7A3E24]">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-extrabold text-[#2F2925]">
                {recipe ? "Edit Recipe" : "Create New Recipe"}
              </h2>
              <p className="text-xs text-[#6F655E]">
                Configure recipe details, ingredient quantities, and cost metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#988D84] hover:text-[#2F2925] hover:bg-[#F6F0E8] transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-5">
          {/* Main Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipe-name-input" className="block text-xs font-bold text-[#6F655E] uppercase mb-1">
                Recipe Name *
              </label>
              <input
                id="recipe-name-input"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sourdough Artisan Loaf"
                className="w-full h-10 px-3 border border-[#E5DDD3] rounded-xl text-sm focus:outline-none focus:border-[#7A3E24] text-[#2F2925]"
              />
            </div>

            <div>
              <label htmlFor="recipe-yield-input" className="block text-xs font-bold text-[#6F655E] uppercase mb-1">
                Batch Yield
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-2.5 text-[#988D84]" size={16} />
                <input
                  id="recipe-yield-input"
                  type="text"
                  value={recipeYield}
                  onChange={(e) => setRecipeYield(e.target.value)}
                  placeholder="e.g. 1 loaf · 850g or 12 rolls"
                  className="w-full h-10 pl-9 pr-3 border border-[#E5DDD3] rounded-xl text-sm focus:outline-none focus:border-[#7A3E24] text-[#2F2925]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipe-price-input" className="block text-xs font-bold text-[#6F655E] uppercase mb-1">
                Selling Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 text-[#988D84]" size={16} />
                <input
                  id="recipe-price-input"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full h-10 pl-9 pr-3 border border-[#E5DDD3] rounded-xl text-sm focus:outline-none focus:border-[#7A3E24] text-[#2F2925]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="recipe-flow-select" className="block text-xs font-bold text-[#6F655E] uppercase mb-1">
                Production Flow
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 text-[#988D84]" size={16} />
                <select
                  id="recipe-flow-select"
                  value={flowId ?? ""}
                  onChange={(e) => setFlowId(e.target.value || null)}
                  className="w-full h-10 pl-9 pr-3 border border-[#E5DDD3] rounded-xl text-sm bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                >
                  <option value="">Assign later</option>
                  {availableFlows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Ingredients Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#6F655E] uppercase">
                Recipe Ingredients ({ingredients.length})
              </label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#7A3E24] hover:text-[#934E2E] transition-colors"
              >
                <Plus size={14} /> Add Ingredient
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateItemForRow(null);
                setCreateItemOpen(true);
              }}
              className="text-xs font-bold text-[#6F655E] underline decoration-[#D9CEC4] underline-offset-2 hover:text-[#7A3E24]"
            >
              Create new inventory item
            </button>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ingredients.map((line, index) => {
                const matchedItem = availableItems.find((i) => i.id === line.inventoryItemId);
                const unitCost = getItemUnitCost(line.inventoryItemId);
                const lineTotal = getLineCost(line);

                return (
                  <div
                    key={index}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 bg-[#FBF8F3] border border-[#E5DDD3] rounded-xl"
                  >
                    {/* Item Select */}
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={line.inventoryItemId}
                        onChange={(e) => handleUpdateIngredient(index, "inventoryItemId", e.target.value)}
                        className="w-full h-9 px-2.5 border border-[#E5DDD3] rounded-lg text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                      >
                        <option value="">Select inventory item</option>
                        {(["ingredient", "packaging"] as const).map((kind) => {
                          const items = availableItems.filter((item) => (item.kind ?? "ingredient") === kind);
                          if (items.length === 0) return null;
                          return (
                            <optgroup key={kind} label={kind === "ingredient" ? "Ingredients" : "Retail supplies"}>
                              {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quantity input */}
                    <div className="w-24 sm:w-28 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => handleUpdateIngredient(index, "quantity", e.target.value)}
                        className="w-full h-9 px-2 border border-[#E5DDD3] rounded-lg text-xs focus:outline-none focus:border-[#7A3E24] text-right"
                      />
                      <span className="text-xs font-medium text-[#6F655E]">
                        {matchedItem?.unit ?? "units"}
                      </span>
                    </div>

                    {/* Unit cost & total preview */}
                    <div className="text-right min-w-[90px] px-1">
                      <div className="text-xs font-extrabold text-[#2F2925]">
                        ${lineTotal.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#988D84]">
                        (${unitCost < 0.01 ? unitCost.toFixed(4) : unitCost.toFixed(2)}/{matchedItem?.unit ?? "u"})
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="p-1.5 rounded-lg text-[#988D84] transition-colors hover:text-rose-600 hover:bg-rose-50"
                      aria-label="Remove ingredient line"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {formError && <p role="alert" className="rounded-lg bg-[#FCE9E7] p-3 text-xs font-semibold text-[#B8443C]">{formError}</p>}

          {/* Live Cost & Margin Preview Badges */}
          <div className="p-4 bg-[#F6F0E8] rounded-xl border border-[#E5DDD3] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-xs font-bold text-[#6F655E] uppercase block mb-0.5">
                Calculated Batch Cost
              </span>
              <span className="text-xl font-extrabold text-[#7A3E24]">
                ${totalBatchCost.toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#6F655E] uppercase block mb-1">
                Gross Profit Margin %
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${getMarginBadgeStyle(
                    marginPercent
                  )}`}
                >
                  {marginPercent.toFixed(1)}% Margin
                </span>
                <span className="text-[11px] text-[#6F655E]">
                  (${numericPrice > 0 ? (numericPrice - totalBatchCost).toFixed(2) : "0.00"} profit)
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#E5DDD3]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 h-11 border border-[#E5DDD3] rounded-xl text-xs font-bold text-[#6F655E] hover:bg-[#F6F0E8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-11 bg-[#7A3E24] text-white rounded-xl text-xs font-bold hover:bg-[#934E2E] transition-colors shadow-sm"
            >
              {isSaving ? "Saving..." : recipe ? "Save Changes" : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>
      <InventoryItemCreateDialog
        isOpen={createItemOpen}
        onClose={() => {
          setCreateItemOpen(false);
          setCreateItemForRow(null);
        }}
        onSubmit={handleCreateItem}
        title="Create inventory item"
        description="Add an ingredient or retail supply, then use it in this recipe."
      />
    </div>
  );
}
