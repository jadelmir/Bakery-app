# Tasks: Add Recipe Management and Costing (Phase F4)

## 1. Domain Ports & Session-Local Adapter

- [x] 1.1 [Domain-Contract Lane: `Front-end/src/app/domain/types.ts`] Define `CreateRecipeInput`, `UpdateRecipeInput`, `ArchiveRecipeInput`, and `RecipePort` interfaces.
- [x] 1.2 [Domain-Contract Lane: `Front-end/src/app/domain/localAdapter.ts`] Implement `createRecipe`, `updateRecipe`, `duplicateRecipe`, `archiveRecipe`, and `restoreRecipe` in `createSessionLocalBakeryDomainAdapter`.
- [x] 1.3 [Verification Lane: `Front-end/src/app/domain/localAdapter.test.ts`] Add unit tests for recipe creation, margin calculation, duplication, and archive/restore toggle.

## 2. Recipe Management UI Components

- [x] 2.1 [UI Lane: `Front-end/src/app/components/recipes/RecipeEditorDialog.tsx`] Build modal editor for creating and updating recipes with dynamic ingredient selector lines, batch yield, and margin preview.
- [x] 2.2 [UI Lane: `Front-end/src/app/components/recipes/RecipeManager.tsx`] Build main Recipe Management view with search filter, active/archived tabs, margin badges, and quick action buttons.
- [x] 2.3 [Integration Lane: `Front-end/src/app/App.tsx`] Mount `RecipeManager` under the Recipes route in `App.tsx`.

## 3. Integrated Verification & Quality Gates

- [x] 3.1 [Verification Lane] Run `npm run typecheck`, `npm run lint`, and `npm run test` from `Front-end`.
- [x] 3.2 [Browser Verification Lane: `Front-end/e2e/recipe-management.spec.ts`] Add Playwright E2E journey for creating a recipe, computing margin, duplicating it, and archiving/restoring.
