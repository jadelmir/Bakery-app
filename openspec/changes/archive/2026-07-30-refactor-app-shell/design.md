# Design: Refactor App.tsx into a Thin Shell

## Context

`App.tsx` is a 2,272-line monolith. All screens, shared components, navigation, types, and mock constants live in a single file. The refactor uses a **move-only, no-logic-change** strategy: every function and constant is relocated verbatim into a new dedicated module. `App.tsx` becomes the minimal root that handles auth bootstrap, public routing, and workspace mounting.

## Module Boundary Map

```
src/app/
├── App.tsx                         ← Thin shell (≤150 lines) — AUTH ONLY
├── BakeryWorkspace.tsx             ← BakeryWorkspaceInner + BakeryWorkspace
├── types.ts                        ← Screen, TaskStatus, Task, Order, ... interfaces
├── constants.ts                    ← TASKS, ORDERS, RECIPES, INVENTORY, CUSTOMERS, TASK_STATUS, ...
│                                     date helpers (dateKey, displayTime, etc.), toTask, planTasks
├── screens/
│   ├── HomeScreen.tsx              ← HomeScreen + TaskCard + OrderCard
│   ├── OrdersScreen.tsx            ← OrdersScreen
│   ├── ProductionScreen.tsx        ← ProductionScreen + ScheduleTaskCard + FlowBuilder
│   ├── RecipesScreen.tsx           ← RecipesScreen
│   ├── InventoryScreen.tsx         ← InventoryScreen + StarterScreen
│   ├── CustomersScreen.tsx         ← CustomersScreen
│   ├── FinancesScreen.tsx          ← FinancesScreen
│   ├── MoreScreen.tsx              ← MoreScreen
│   └── SettingsScreen.tsx          ← SettingsScreen
├── navigation/
│   ├── Sidebar.tsx                 ← Sidebar + SIDEBAR_NAV constant
│   ├── BottomNav.tsx               ← BottomNav + BOTTOM_NAV + FAB
│   └── dirtyFormGuard.tsx          ← already exists, unchanged
└── components/
    └── shared/
        ├── Chip.tsx                ← Chip
        └── SectionHeader.tsx       ← SectionHeader
```

## Key Design Decisions

1. **Verbatim move**: no logic, styling, or API changes. Every component moves byte-for-byte, only file and import locations change.
2. **`types.ts` owns all local interfaces** (`Task`, `Order`, `Recipe`, `InventoryItem`, `Customer`, status union types, `Screen`). This is separate from `domain/types.ts` which owns domain model types.
3. **`constants.ts` owns all mock data and style maps**: `TASKS`, `ORDERS`, `RECIPES`, `INVENTORY`, `CUSTOMERS`, `TASK_STATUS`, `TASK_URGENCY`, `ORDER_STATUS`, `PAYMENT_STATUS`, `INV_STATUS`, `CAT_COLORS`, `BAKERY_TIME_ZONE`, and all date/plan helpers.
4. **`BakeryWorkspace.tsx`** takes over the workspace-level state that currently lives inside `BakeryWorkspaceInner`: `screen`, `addOrderOpen`, `orders`, `productionTasks`, `starterProfile`, `starterOverrides`, `deductionTrigger`, `inventoryTransactions`, and the `createPlan` / `updateProductionTask` handlers.
5. **`App.test.tsx`** imports `App` (default) and `BakeryWorkspace` (named) — both remain exported from `App.tsx` by re-exporting from their new files, so the test file needs zero changes beyond a possible import path update.
6. **No agent writes the same file concurrently**: each workstream owns exclusive files. `App.tsx` is touched only in the final integration step by the orchestrator.

## Risk and Return Path

- **Risk**: broken circular import if `constants.ts` imports from `screens/` or vice versa. Mitigation: `constants.ts` is a leaf module — no imports from app screens.
- **Risk**: App.test.tsx expectations reference component internals. Mitigation: all component rendering behavior is preserved verbatim; only import paths change.
- **Return path on failed typecheck**: revert the failing file to its `App.tsx` source, fix import, re-run typecheck before proceeding.

## Verification Gates

1. `pnpm run typecheck` — zero errors.
2. `pnpm run lint` — zero new warnings.
3. `pnpm run test` — all 215 lines of App.test.tsx pass unchanged.
4. `pnpm run build` — clean bundle, no size regression beyond acceptable delta.
