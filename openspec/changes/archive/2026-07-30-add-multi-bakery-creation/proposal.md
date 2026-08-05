# Proposal: Add Multi-Bakery Creation Capability (Phase F2 / B2)

## Motivation

Users logged into the Bakery App currently see a workspace selector to pick from their existing store memberships. However, if a user wants to expand their business, add a second store location, or set up another bakery workspace, there was no option on the login selection screen or inside the app toolbar to create an additional bakery when memberships already exist.

This change provides a complete end-to-end multi-bakery creation flow across database RPCs, workspace adapters, the login workspace selection screen, and in-app navigation.

## Scope

1. **Database & Postgres RPC**:
   - Verify and extend `public.create_default_bakery(bakery_name text)` or `public.create_bakery(bakery_name text)` migration to create a new `bakeries` record, add an `owner` membership for the caller, and set `default_bakery_id`.
2. **Workspace Adapters**:
   - Update `createMockWorkspaceAdapter` so `createDefaultBakery` appends the newly created bakery to the user's active membership list instead of replacing existing memberships.
   - Update `createSupabaseWorkspaceAdapter` to handle creating additional bakeries smoothly.
3. **Frontend UI Components**:
   - Update `WorkspaceSelector.tsx` to include an "+ Add a new bakery" toggle form/modal alongside the store selection radio list when memberships exist.
   - Update store switcher dropdowns in `Sidebar.tsx` and `MoreScreen.tsx` to include an "+ Add new bakery" action.
4. **Verification**:
   - Vitest unit tests in `workspace.test.tsx`.
   - Playwright E2E tests verifying multi-bakery creation and store switching.
