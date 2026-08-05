# Proposal: Build Production Flow Builder & Dynamic Task Scheduler (Phase F7 / B8)

## Motivation

Bakers follow specific multi-step baking schedules (e.g., Levain Build $\rightarrow$ Autolyse $\rightarrow$ Bulk Fermentation $\rightarrow$ Stretch & Fold $\rightarrow$ Cold Proof $\rightarrow$ Bake). Currently, the application uses hardcoded default flows for sourdough and focaccia.

This change introduces an interactive **Production Flow Builder** UI, domain persistence for custom recipe flows, and a dynamic task scheduling engine with dependency tracking and bulk task execution.

## Scope

1. **Domain & Adapter Layer (`types.ts`, `localAdapter.ts`)**:
   - Extend `BakeryDomainSnapshot` and domain ports with `flowsById` and production flow CRUD methods (`listProductionFlows`, `saveProductionFlow`, `deleteProductionFlow`).
2. **Production Flow Builder UI (`ProductionFlowBuilder.tsx`, `RecipeManager.tsx`)**:
   - Interactive flow editor modal allowing bakers to add, edit, reorder, and toggle steps (Step Name, Category, Day Offset, Time, Duration, Instructions, Dependencies).
   - Integrate flow editor inside `RecipeManager` and `ProductionScreen`.
3. **Dynamic Task Scheduling & Dependency Engine (`production.ts`, `App.tsx`)**:
   - `generatePlan` uses custom recipe flows whenever defined for a bakery workspace.
   - Computes step dependencies dynamically, setting `dependencyIncomplete: true` when upstream steps are pending.
   - Groupable task batching for shared mixing/starter steps across orders.
4. **Verification**:
   - Vitest unit tests in `production.test.ts` and `localAdapter.test.ts`.
   - Playwright E2E browser tests verifying flow creation and task schedule execution.
