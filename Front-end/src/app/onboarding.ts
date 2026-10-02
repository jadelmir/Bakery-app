import type { BakeryDomainSnapshot } from "./domain/types";

export type OnboardingStepId = "product" | "materials" | "order";

export interface OnboardingProgress {
  readonly product: boolean;
  readonly materials: boolean;
  readonly order: boolean;
  readonly completedCount: number;
  readonly isComplete: boolean;
}

export interface OnboardingState {
  readonly dismissedAt: string | null;
  readonly completedAt: string | null;
  readonly prepListViewedAt: string | null;
}

export interface OnboardingStatePatch {
  readonly dismissedAt?: string | null;
  readonly completedAt?: string | null;
  readonly prepListViewedAt?: string | null;
}

export function deriveOnboardingProgress(
  snapshot: BakeryDomainSnapshot | undefined,
): OnboardingProgress {
  if (!snapshot) {
    return { product: false, materials: false, order: false, completedCount: 0, isComplete: false };
  }

  const activeRecipes = Object.values(snapshot.recipesById).filter(recipe => !recipe.archived);
  const product = activeRecipes.length > 0;
  const materials = activeRecipes.some(recipe => recipe.ingredients.some(line => {
    const item = snapshot.inventoryById[line.inventoryItemId];
    return Boolean(item && !item.archived && (item.kind === "ingredient" || item.kind === "packaging"));
  }));
  const order = Object.values(snapshot.ordersById).some(candidate => {
    if (["cancelled", "completed"].includes(candidate.status)) return false;
    return candidate.itemIds.some(itemId => Boolean(snapshot.orderItemsById[itemId]));
  });
  const completedCount = [product, materials, order].filter(Boolean).length;

  return { product, materials, order, completedCount, isComplete: product && materials && order };
}
