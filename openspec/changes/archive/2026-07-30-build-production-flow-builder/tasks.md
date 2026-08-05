# Tasks - Build Production Flow Builder & Dynamic Task Scheduler

## 1. Domain & Adapter Layer

- [x] 1.1 Update `Front-end/src/app/domain/types.ts` to include `DomainProductionFlow`, `DomainFlowStep`, `saveProductionFlow`, `deleteProductionFlow`.
- [x] 1.2 Update `Front-end/src/app/domain/localAdapter.ts` to persist `flowsById` in domain snapshot and implement flow CRUD operations.
- [x] 1.3 Update `Front-end/src/app/production.ts` `generatePlan` to use custom domain flows and compute step dependencies.
- [x] 1.4 Add unit tests in `Front-end/src/app/production.test.ts` and `Front-end/src/app/domain/localAdapter.test.ts`.

## 2. Frontend UI Components

- [x] 2.1 Create `Front-end/src/app/components/production/ProductionFlowBuilder.tsx` modal for editing flow steps, day offsets, categories, and dependencies.
- [x] 2.2 Wire `ProductionFlowBuilder` inside `RecipeManager.tsx` and `ProductionScreen` in `Front-end/src/app/App.tsx`.
- [x] 2.3 Display dependency warning badges on task cards in `Front-end/src/app/App.tsx`.

## 3. End-to-End Verification

- [x] 3.1 Run `npm run typecheck`, `npm test`, and `npx playwright test` to verify 100% test pass rate.
