# Tasks - Add Multi-Bakery Creation Capability

## 1. Domain & Adapter Layer

- [x] 1.1 Update `createMockWorkspaceAdapter` in `Front-end/src/app/workspace.ts` to append new bakeries to `memberships` rather than replacing them.
- [x] 1.2 Add unit tests in `Front-end/src/app/workspace.test.tsx` verifying creating multiple bakeries sequentially.

## 2. Frontend UI Components

- [x] 2.1 Update `Front-end/src/app/WorkspaceSelector.tsx` to display an "+ Add a new bakery" toggle button and form alongside existing stores.
- [x] 2.2 Update `Front-end/src/app/App.tsx` workspace selector handler to automatically switch to the newly created bakery upon creation.

## 3. End-to-End Verification

- [x] 3.1 Run `npm run typecheck`, `npm test`, and `npx playwright test` to verify 100% test pass rate.
