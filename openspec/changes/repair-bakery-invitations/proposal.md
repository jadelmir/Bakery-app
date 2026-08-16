## Why

The Team access screen reports “Invitation sent” in the current browser journey, but that journey runs with the mock workspace adapter and does not prove that the production Supabase path creates a persisted invitation, delivers a usable Auth link, or grants the invitee access. This corrective change closes that evidence and integration gap before invitation delivery is treated as working.

## What Changes

- Exercise and repair the real `WorkspaceAdapter.inviteMember` path through the authenticated `send-bakery-invite` Edge Function.
- Verify the privileged invitation RPC, email redirect construction, Auth handoff, and invitee acceptance as one local Supabase journey.
- Replace mock-only invitation assertions with required real-backend coverage while retaining deterministic mock tests for UI-only states.
- Preserve role authorization, duplicate prevention, verified-email matching, one-time consumption, expiry, tenant isolation, and accessible success/error feedback.
- Document the local Mailpit and hosted Auth/Edge Function configuration gates needed for invitation delivery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bakery-team-membership`: Require invitation delivery and acceptance to be verified through the persisted Supabase/Auth flow, not only through a mock adapter or UI message.

## Impact

- Frontend: `TeamManagement`, the workspace adapter, invitation landing, app session/redirect handling, focused tests, and Playwright coverage.
- Supabase: the `send-bakery-invite` Edge Function, invitation RPC boundary, Auth email redirect configuration, local Mailpit verification, and database invitation tests. No new tables are planned.
- Documentation: the multi-store workspace operations guide and OpenSpec evidence/task ledger will record the real-flow verification boundary and hosted rollout gate.
- Dependencies: existing Supabase Auth, Edge Functions, local Supabase stack, and Playwright/Vitest tooling. No new runtime dependency.
- Related work: `repair-authentication-account-flows` owns password recovery/account-password behavior; this change may consume its Auth/session boundary but does not modify that change’s scope. The archived `add-multi-store-workspaces` change remains immutable.
