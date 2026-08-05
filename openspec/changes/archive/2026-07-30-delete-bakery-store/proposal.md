# Proposal: Delete Bakery Store in Settings (Phase F2 / B2)

## Motivation

Bakery owners currently have no way to remove or delete an old, inactive, or accidentally created bakery workspace from their account. As users create or test multiple bakery stores, having obsolete bakeries cluttering their workspace selector and store dropdowns creates friction.

This change introduces a secure, Owner-only "Delete Bakery Store" Danger Zone inside Settings, backed by workspace adapter RPC methods and safe name-confirmation modal safeguards.

## Scope

1. **Workspace Adapter Interface (`workspace.ts`)**:
   - Add `deleteBakery(bakeryId: string): Promise<void>` to `WorkspaceAdapter`.
   - Implement `deleteBakery` in `createMockWorkspaceAdapter` (removes membership from state).
   - Implement `deleteBakery` in `createSupabaseWorkspaceAdapter` (calls Supabase RPC / table delete).
2. **Settings UI (`SettingsScreen.tsx` / `TeamManagement.tsx` / `DeleteBakeryDialog.tsx`)**:
   - Add Danger Zone section in Settings visible to Owners.
   - Build `DeleteBakeryDialog` confirmation modal requiring typing the exact store name before enabling the delete action.
3. **App Workspace Integration (`App.tsx`)**:
   - On deletion, clear active bakery session state, reload memberships, and return to remaining store or `WorkspaceSelector`.
4. **Verification**:
   - Vitest unit tests in `workspace.test.tsx` verifying bakery deletion.
   - Playwright E2E tests verifying owner deletion flow.
