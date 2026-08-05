# Tasks - Delete Bakery Store in Settings

## 1. Domain & Adapter Layer

- [x] 1.1 Add `deleteBakery(bakeryId: string): Promise<void>` to `WorkspaceAdapter` interface in `Front-end/src/app/workspace.ts`.
- [x] 1.2 Implement `deleteBakery` in `createMockWorkspaceAdapter` and `createSupabaseWorkspaceAdapter` in `Front-end/src/app/workspace.ts`.
- [x] 1.3 Add Vitest unit tests in `Front-end/src/app/workspace.test.tsx` verifying bakery deletion.

## 2. Frontend UI Components

- [x] 2.1 Create `Front-end/src/app/DeleteBakeryDialog.tsx` with name-confirmation safety check and destructive delete action.
- [x] 2.2 Add Danger Zone section to Settings in `Front-end/src/app/App.tsx` (or `TeamManagement.tsx` / `SettingsScreen.tsx`), gated to `owner` role.
- [x] 2.3 Wire deletion action in `Front-end/src/app/App.tsx` to clear active bakery session and reload accessible memberships upon deletion.

## 3. End-to-End Verification

- [x] 3.1 Run `npm run typecheck`, `npm test`, and `npx playwright test` to verify 100% test pass rate.
