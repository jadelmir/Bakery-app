# Tasks - Add Ingredients and Stock Entry (Phase F3 / B3)

## 1. Database Schema & RLS Policies (Backend B3)

- [x] 1.1 Add Supabase migration `Front-end/supabase/migrations/20260729150000_ingredients_and_costing.sql` creating `ingredients` and `inventory_movements` tables with foreign keys and constraints.
- [x] 1.2 Enable RLS on `ingredients` and `inventory_movements` with SELECT, INSERT, UPDATE, DELETE policies scoped to `bakery_memberships`.
- [x] 1.3 Add RPC or database triggers for updating `on_hand` inventory levels when movements are recorded.

## 2. Domain Types & Adapter Extension

- [x] 2.1 Update `Front-end/src/app/domain/types.ts` with `CreateIngredientInput`, `UpdateIngredientInput`, `RecordMovementInput`, and domain ports.
- [x] 2.2 Extend `Front-end/src/app/domain/localAdapter.ts` to support local ingredient creation, updates, cost-per-unit calculation, and movement logs.
- [x] 2.3 Add unit tests in `Front-end/src/app/domain/localAdapter.test.ts` verifying cost calculation ($15 / 5000g = $0.003/g) and stock adjustment logic.

## 3. Application State & Selectors

- [x] 3.1 Update `Front-end/src/app/state/domainState.ts` with `createIngredient`, `updateIngredient`, and `recordMovement` commands.
- [x] 3.2 Update `selectInventory` in `Front-end/src/app/state/selectors.ts` to derive available stock, low-stock warnings, and base-unit costs.

## 4. Frontend UI Components (Frontend F3)

- [x] 4.1 Build `AddIngredientModal` in `Front-end/src/app/components/AddIngredientModal.tsx` for entering ingredient name, unit, package quantity, package price, and minimum alert level.
- [x] 4.2 Build `RecordMovementModal` in `Front-end/src/app/components/RecordMovementModal.tsx` for logging restocks, manual adjustments, or waste.
- [x] 4.3 Update `InventoryScreen` in `Front-end/src/app/App.tsx` to display ingredient list, base-unit cost badge, stock levels, and movement history.

## 5. Verification & Quality Gates

- [x] 5.1 Run TypeScript typecheck (`npm run typecheck` in `Front-end`) and Vitest test suite (`npm test`).
- [x] 5.2 Add Playwright E2E journey in `Front-end/e2e/ingredients-and-stock-entry.spec.ts` testing ingredient creation, package cost calculation, and stock entry.
- [x] 5.3 Update `openspec/PROGRAM_MAP.md` marking Phase F3 / B3 as verified.
