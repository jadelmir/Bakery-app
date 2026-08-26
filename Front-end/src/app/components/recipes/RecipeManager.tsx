import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Archive,
  RotateCcw,
  Edit3,
  Scale,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { RecipeEditorDialog, type RecipeEditorDialogProps } from "./RecipeEditorDialog";
import { ProductionFlowBuilder } from "../production/ProductionFlowBuilder";
import { DEFAULT_FLOWS as DOMAIN_DEFAULT_FLOWS, type FlowStep, type ProductionFlow } from "../../production";

export interface RecipeIngredient {
  readonly inventoryItemId: string;
  readonly quantity: number;
  readonly cost: number;
}

export interface DomainRecipeItem {
  readonly id: string;
  readonly name: string;
  readonly yield: string;
  readonly batchCost: number;
  readonly sellingPrice: number;
  readonly flowId: string;
  readonly ingredients: readonly RecipeIngredient[];
  readonly archived?: boolean;
}

export interface DomainInventoryItem {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly packageQuantity?: number;
  readonly packagePrice?: number;
  readonly unitCost?: number;
}

export interface DomainFlowItem {
  readonly id: string;
  readonly name: string;
  readonly recipe?: string;
  readonly steps?: readonly FlowStep[] | readonly unknown[];
}

export interface RecipeManagerProps {
  recipes?: readonly DomainRecipeItem[];
  inventoryItems?: readonly DomainInventoryItem[];
  productionFlows?: readonly ProductionFlow[] | readonly DomainFlowItem[];
  onAddRecipe?: (recipe: Omit<DomainRecipeItem, "id">) => void;
  onUpdateRecipe?: (id: string, patch: Partial<DomainRecipeItem>) => void;
  onDuplicateRecipe?: (recipeId: string) => void;
  onArchiveRecipe?: (recipeId: string) => void;
  onRestoreRecipe?: (recipeId: string) => void;
  onSaveProductionFlow?: (flow: ProductionFlow) => void;
}

const DEFAULT_INVENTORY: readonly DomainInventoryItem[] = [
  { id: "flour", name: "Kirkland Organic Flour", unit: "g", unitCost: 0.002 },
  { id: "water", name: "Water", unit: "ml", unitCost: 0.000057 },
  { id: "salt", name: "Salt", unit: "g", unitCost: 0.003 },
  { id: "oil", name: "Olive Oil", unit: "ml", unitCost: 0.008 },
  { id: "bag", name: "Bakery Bags", unit: "pcs", unitCost: 0.15 },
];

const DEFAULT_FLOWS: readonly DomainFlowItem[] = [
  { id: "flow-sourdough", name: "Standard Sourdough Loaf" },
  { id: "flow-focaccia", name: "Standard Focaccia" },
];

const INITIAL_RECIPES: readonly DomainRecipeItem[] = [
  {
    id: "r1",
    name: "Sourdough Loaf",
    yield: "1 loaf · 850g",
    batchCost: 3.2,
    sellingPrice: 14.0,
    flowId: "flow-sourdough",
    archived: false,
    ingredients: [
      { inventoryItemId: "flour", quantity: 500, cost: 1.0 },
      { inventoryItemId: "water", quantity: 350, cost: 0.02 },
      { inventoryItemId: "salt", quantity: 10, cost: 0.03 },
    ],
  },
  {
    id: "r2",
    name: "Focaccia",
    yield: "1 tray",
    batchCost: 2.4,
    sellingPrice: 8.0,
    flowId: "flow-focaccia",
    archived: false,
    ingredients: [
      { inventoryItemId: "flour", quantity: 1000, cost: 2.0 },
      { inventoryItemId: "water", quantity: 500, cost: 0.02 },
      { inventoryItemId: "salt", quantity: 20, cost: 0.06 },
      { inventoryItemId: "oil", quantity: 50, cost: 0.4 },
    ],
  },
];

function getMargin(sellingPrice: number, batchCost: number): number {
  if (sellingPrice <= 0) return 0;
  return Math.round((((sellingPrice - batchCost) / sellingPrice) * 100) * 100) / 100;
}

function getMarginBadgeClass(margin: number): string {
  if (margin >= 70) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (margin >= 50) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-rose-50 text-rose-800 border-rose-200";
}

export function RecipeManager({
  recipes: externalRecipes,
  inventoryItems = DEFAULT_INVENTORY,
  productionFlows = DEFAULT_FLOWS,
  onAddRecipe,
  onUpdateRecipe,
  onDuplicateRecipe,
  onArchiveRecipe,
  onRestoreRecipe,
  onSaveProductionFlow,
}: RecipeManagerProps) {
  const [internalRecipes, setInternalRecipes] = useState<readonly DomainRecipeItem[]>(
    () => (externalRecipes ? [...externalRecipes] : INITIAL_RECIPES)
  );

  useEffect(() => {
    if (externalRecipes) {
      setInternalRecipes([...externalRecipes]);
    }
  }, [externalRecipes]);

  const recipes = internalRecipes;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [editingRecipe, setEditingRecipe] = useState<DomainRecipeItem | null | undefined>(undefined);
  // undefined = modal closed, null = creating new recipe, object = editing recipe

  const [builderFlow, setBuilderFlow] = useState<ProductionFlow | null>(null);
  const [isFlowBuilderOpen, setIsFlowBuilderOpen] = useState(false);
  const [builderRecipeName, setBuilderRecipeName] = useState<string>("");

  const handleOpenFlowBuilder = (recipe: DomainRecipeItem) => {
    setBuilderRecipeName(recipe.name);
    const flows = productionFlows as ProductionFlow[];
    const existing = Array.isArray(flows)
      ? flows.find((f) => f.id === recipe.flowId || f.recipe === recipe.name)
      : DOMAIN_DEFAULT_FLOWS.find((f) => f.id === recipe.flowId || f.recipe === recipe.name);

    if (existing && "steps" in existing && Array.isArray(existing.steps)) {
      setBuilderFlow(existing as ProductionFlow);
    } else {
      const fallbackFlow = DOMAIN_DEFAULT_FLOWS.find((f) => f.recipe === recipe.name) || {
        id: recipe.flowId || `flow-${recipe.id}`,
        name: `${recipe.name} Flow`,
        recipe: recipe.name,
        steps: [],
      };
      setBuilderFlow(fallbackFlow as ProductionFlow);
    }
    setIsFlowBuilderOpen(true);
  };

  const inventoryMap = useMemo(() => {
    const map = new Map<string, DomainInventoryItem>();
    inventoryItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [inventoryItems]);

  const flowMap = useMemo(() => {
    const map = new Map<string, DomainFlowItem>();
    productionFlows.forEach((flow) => map.set(flow.id, flow));
    return map;
  }, [productionFlows]);

  // Tab filtering & search
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const isArchived = Boolean(r.archived);
      if (activeTab === "active" && isArchived) return false;
      if (activeTab === "archived" && !isArchived) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchesName = r.name.toLowerCase().includes(query);
      const matchesIngredient = r.ingredients.some((ing) => {
        const item = inventoryMap.get(ing.inventoryItemId);
        return item ? item.name.toLowerCase().includes(query) : false;
      });
      return matchesName || matchesIngredient;
    });
  }, [recipes, activeTab, searchQuery, inventoryMap]);

  const activeCount = useMemo(() => recipes.filter((r) => !r.archived).length, [recipes]);
  const archivedCount = useMemo(() => recipes.filter((r) => Boolean(r.archived)).length, [recipes]);

  // Calculations
  const calculateMarginPercent = (sellingPrice: number, batchCost: number) => {
    if (!sellingPrice || sellingPrice <= 0) return 0;
    const profit = sellingPrice - batchCost;
    return Math.round((profit / sellingPrice) * 100);
  };

  const getMarginBadgeClass = (margin: number) => {
    if (margin >= 60) {
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    }
    if (margin >= 40) {
      return "bg-amber-50 text-amber-700 border-amber-300";
    }
    return "bg-rose-50 text-rose-700 border-rose-300";
  };

  // Quick Action Handlers
  const handleOpenCreate = () => {
    setEditingRecipe(null);
  };

  const handleOpenEdit = (recipe: DomainRecipeItem) => {
    setEditingRecipe(recipe);
  };

  const handleDuplicate = (recipe: DomainRecipeItem) => {
    const copy: DomainRecipeItem = {
      ...recipe,
      id: `r-${Date.now()}`,
      name: `${recipe.name} (Copy)`,
      archived: false,
    };
    setInternalRecipes((prev) => [...prev, copy]);
    if (onDuplicateRecipe) {
      onDuplicateRecipe(recipe.id);
    }
  };

  const handleArchive = (recipe: DomainRecipeItem) => {
    setInternalRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, archived: true } : r))
    );
    if (onArchiveRecipe) {
      onArchiveRecipe(recipe.id);
    }
  };

  const handleRestore = (recipe: DomainRecipeItem) => {
    setInternalRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, archived: false } : r))
    );
    if (onRestoreRecipe) {
      onRestoreRecipe(recipe.id);
    }
  };

  const handleSaveRecipe = (recipeData: {
    id?: string;
    name: string;
    yield: string;
    sellingPrice: number;
    batchCost: number;
    flowId: string;
    ingredients: { inventoryItemId: string; quantity: number; cost: number }[];
  }) => {
    if (recipeData.id) {
      // Update existing
      setInternalRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeData.id
            ? {
                ...r,
                name: recipeData.name,
                yield: recipeData.yield,
                sellingPrice: recipeData.sellingPrice,
                batchCost: recipeData.batchCost,
                flowId: recipeData.flowId,
                ingredients: recipeData.ingredients,
              }
            : r
        )
      );
      if (onUpdateRecipe) {
        onUpdateRecipe(recipeData.id, recipeData);
      }
    } else {
      // Add new
      const newRecipe: DomainRecipeItem = {
        id: `r-${Date.now()}`,
        name: recipeData.name,
        yield: recipeData.yield,
        sellingPrice: recipeData.sellingPrice,
        batchCost: recipeData.batchCost,
        flowId: recipeData.flowId || "flow-sourdough",
        ingredients: recipeData.ingredients,
        archived: false,
      };
      setInternalRecipes((prev) => [...prev, newRecipe]);
      if (onAddRecipe) {
        onAddRecipe(recipeData);
      }
    }
    setEditingRecipe(undefined);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-28 lg:pb-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5DDD3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F6F0E8] flex items-center justify-center text-[#7A3E24]">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2F2925] tracking-tight">
              Recipe Management
            </h1>
            <p className="text-xs text-[#6F655E]">
              Configure batch recipes, calculate ingredient costs, and track gross profit margins
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#7A3E24] text-white font-extrabold text-xs rounded-xl hover:bg-[#934E2E] transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} /> Add Recipe
        </button>
      </div>

      {/* Control Bar: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Active / Archived Tabs */}
        <div className="flex bg-[#F6F0E8] p-1 rounded-xl border border-[#E5DDD3] self-start" role="tablist">
          <button
            type="button"
            role="tab"
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-white text-[#2F2925] shadow-sm"
                : "text-[#6F655E] hover:text-[#2F2925]"
            }`}
          >
            Active Recipes
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "active"
                  ? "bg-[#7A3E24] text-white"
                  : "bg-[#E5DDD3] text-[#6F655E]"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("archived")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "archived"
                ? "bg-white text-[#2F2925] shadow-sm"
                : "text-[#6F655E] hover:text-[#2F2925]"
            }`}
          >
            Archived
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "archived"
                  ? "bg-[#7A3E24] text-white"
                  : "bg-[#E5DDD3] text-[#6F655E]"
              }`}
            >
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-3 text-[#988D84]" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes or ingredients..."
            className="w-full h-10 pl-9 pr-3 border border-[#E5DDD3] rounded-xl text-xs bg-white text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
          />
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5DDD3] p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F6F0E8] flex items-center justify-center text-[#988D84]">
            <BookOpen size={24} />
          </div>
          <h3 className="text-base font-extrabold text-[#2F2925]">
            {activeTab === "active" ? "No Active Recipes Found" : "No Archived Recipes"}
          </h3>
          <p className="text-xs text-[#6F655E] max-w-sm mx-auto">
            {searchQuery
              ? `No recipes match your search "${searchQuery}".`
              : activeTab === "active"
              ? "Get started by creating your first recipe to track batch costs and profit margins."
              : "Archived recipes will appear here when you soft-archive existing recipes."}
          </p>
          {activeTab === "active" && !searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A3E24] text-white font-bold text-xs rounded-xl hover:bg-[#934E2E] transition-colors"
            >
              <Plus size={16} /> Create Recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const margin = getMargin(recipe.sellingPrice, recipe.batchCost);
            const flow = flowMap.get(recipe.flowId);

            return (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl border border-[#E5DDD3] shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-5 border-b border-[#E5DDD3] space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[#2F2925] group-hover:text-[#7A3E24] transition-colors">
                        {recipe.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#6F655E]">
                        <span className="inline-flex items-center gap-1 bg-[#F6F0E8] px-2 py-0.5 rounded-md font-medium">
                          <Scale size={12} className="text-[#988D84]" /> {recipe.yield}
                        </span>
                      </div>
                    </div>

                    {/* Margin Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${getMarginBadgeClass(
                        margin
                      )}`}
                    >
                      {margin.toFixed(1)}%
                    </div>
                  </div>

                  {/* Flow Tag & Edit Production Flow Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A3E24] bg-[#FBF8F3] px-2.5 py-1 rounded-lg border border-[#E5DDD3]">
                      <Layers size={12} /> {flow ? flow.name : "Custom Flow"}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenFlowBuilder(recipe)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#7A3E24] hover:bg-[#FAF1EB] px-2.5 py-1 rounded-lg transition-colors border border-[#E5DDD3]"
                    >
                      <Clock size={12} /> Edit Production Flow
                    </button>
                  </div>

                  {/* Price & Cost Breakdown */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#FBF8F3] rounded-xl border border-[#E5DDD3] text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#988D84] block">
                        Price
                      </span>
                      <span className="text-sm font-extrabold text-[#2F2925]">
                        ${recipe.sellingPrice.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#988D84] block">
                        Batch Cost
                      </span>
                      <span className="text-sm font-extrabold text-[#7A3E24]">
                        ${recipe.batchCost.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#988D84] block">
                        Profit
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        ${(recipe.sellingPrice - recipe.batchCost).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Ingredient Preview Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#6F655E] uppercase block">
                      Ingredients ({recipe.ingredients.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients.map((ing, idx) => {
                        const item = inventoryMap.get(ing.inventoryItemId);
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#F6F0E8] text-[#2F2925] px-2 py-0.5 rounded-md border border-[#E5DDD3]"
                          >
                            {item?.name ?? ing.inventoryItemId}: {ing.quantity}
                            {item?.unit ?? ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-[#FBF8F3] flex items-center justify-between gap-2 border-t border-[#E5DDD3]">
                  <button
                    onClick={() => handleOpenEdit(recipe)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#6F655E] hover:text-[#2F2925] hover:bg-white transition-colors border border-transparent hover:border-[#E5DDD3]"
                  >
                    <Edit3 size={14} /> Edit
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(recipe)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#6F655E] hover:text-[#7A3E24] hover:bg-white transition-colors border border-transparent hover:border-[#E5DDD3]"
                      title="Duplicate recipe"
                    >
                      <Copy size={14} /> Duplicate
                    </button>

                    {activeTab === "active" ? (
                      <button
                        onClick={() => handleArchive(recipe)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#988D84] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Archive recipe"
                      >
                        <Archive size={14} /> Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(recipe)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Restore recipe"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal Dialog */}
      {editingRecipe !== undefined && (
        <RecipeEditorDialog
          recipe={editingRecipe}
          inventoryItems={inventoryItems}
          productionFlows={productionFlows}
          onClose={() => setEditingRecipe(undefined)}
          onSave={handleSaveRecipe}
        />
      )}

      {/* Production Flow Builder Modal */}
      {isFlowBuilderOpen && (
        <ProductionFlowBuilder
          isOpen={isFlowBuilderOpen}
          flow={builderFlow || undefined}
          recipeName={builderRecipeName}
          onClose={() => {
            setIsFlowBuilderOpen(false);
            setBuilderFlow(null);
          }}
          onSave={(savedFlow) => {
            if (onSaveProductionFlow) {
              onSaveProductionFlow(savedFlow);
            }
            setIsFlowBuilderOpen(false);
            setBuilderFlow(null);
          }}
        />
      )}
    </div>
  );
}
