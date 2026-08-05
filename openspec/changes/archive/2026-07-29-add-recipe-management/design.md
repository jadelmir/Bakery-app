# Design: Recipe Management and Costing (Phase F4)

## Architecture & Data Flow

```
[ UI Component: RecipeManager / RecipeEditor ]
                   │
                   ▼ (Calls domain ports / state hooks)
[ State Layer: selectRecipes / executeRecipeCommand ]
                   │
                   ▼ (Invokes feature adapter)
[ Domain Port: BakeryDomainAdapter.createRecipe / updateRecipe / archiveRecipe ]
                   │
                   ▼ (Updates snapshot / persistence)
[ Session-Local / Supabase Backend Domain Snapshot ]
```

## Core Models & Calculations

### Batch Cost Calculation
$$\text{Batch Cost} = \sum_{i=1}^{N} (\text{Ingredient Quantity}_i \times \text{Base Unit Cost}_i)$$

### Gross Profit Margin
$$\text{Margin \%} = \left( \frac{\text{Selling Price} - \text{Batch Cost}}{\text{Selling Price}} \right) \times 100$$

## Component Structure

1. `Front-end/src/app/domain/types.ts`: Define recipe ports (`CreateRecipeInput`, `UpdateRecipeInput`, `ArchiveRecipeInput`, `RecipeResult`).
2. `Front-end/src/app/domain/localAdapter.ts`: Implement `createRecipe`, `updateRecipe`, `duplicateRecipe`, `archiveRecipe`, `restoreRecipe`.
3. `Front-end/src/app/components/recipes/RecipeManager.tsx`: Main view with search, filter (Active/Archived), margin badges, and quick actions.
4. `Front-end/src/app/components/recipes/RecipeEditorDialog.tsx`: Modal form for editing recipe name, yield, selling price, production flow association, and dynamic ingredient lines.
5. `Front-end/src/app/App.tsx`: Mount `RecipeManager` under the Recipes navigation route.

## Security & Tenant Isolation

- All recipe operations are scoped by `bakeryId`.
- Cross-bakery recipe access is strictly denied by tenant boundary validation.
