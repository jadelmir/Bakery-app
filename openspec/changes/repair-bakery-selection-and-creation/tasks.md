# Task Ledger: Repair Bakery Discovery and Creation Flow

## 1. Persisted Workspace Operation and Adapter

- [x] 1.1 Create a corrective Supabase migration using the repository’s
  migration workflow so explicit bakery creation always creates the requested
  bakery and owner membership atomically, while preserving authenticated
  execution and membership RLS boundaries.
- [x] 1.2 Verify/update `Front-end/src/app/workspace.ts` so existing accessible
  memberships map to bakery names and default state, and the create call
  returns the newly created bakery ID.
- [x] 1.3 Extend `Front-end/src/app/workspace.test.tsx` with focused coverage for
  existing memberships, appended additional memberships, and the create
  contract.

## 2. Application Selection State

- [x] 2.1 Update `Front-end/src/app/App.tsx` so membership loading preserves and
  renders accessible existing bakeries, and creation reloads, finds, remembers,
  and activates the returned bakery membership.
- [x] 2.2 Update `Front-end/src/app/WorkspaceSelector.tsx` only if needed to
  represent the existing-membership and post-creation states clearly without
  weakening the membership-only boundary.
- [x] 2.3 Extend `Front-end/src/app/App.test.tsx` for seeded-style existing
  bakery visibility, preservation of the original bakery, and immediate entry
  into a newly created bakery.

## 3. Browser Verification

- [x] 3.1 Extend `Front-end/e2e/app.spec.ts` with the existing accessible
  bakery journey; the browser harness uses the deterministic mock adapter,
  while the seeded admin membership is verified separately against local SQL.
- [x] 3.2 Add a browser journey that creates a second bakery and verifies both
  bakery names are available while the new bakery is active.

## 4. Integrated Verification and Lifecycle

- [x] 4.1 Run focused Vitest checks for workspace and app selection behavior.
- [x] 4.2 Run the focused Playwright bakery-selection journeys.
- [x] 4.3 Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and
  `pnpm run build`.
- [x] 4.4 For the migration, apply committed migrations without data loss,
  run `supabase db lint`, and record membership allow/deny evidence when local
  Supabase is available.
- [x] 4.5 Synchronize the verified delta into the main workspace-selection spec
  and update `openspec/PROGRAM_MAP.md`; archive only through a separate
  explicitly requested archive workflow after manual testing.

## Open Questions / Stopping Rules

- Stop if “existing bakery” means a bakery row without a membership; product
  direction is required because exposing it would violate tenant isolation.
- Stop if the existing RPC must remain first-only for another caller; use a
  separate explicit-create operation rather than changing behavior implicitly.

## Verification Notes

- Migration `20260803145416_repair_bakery_creation_atomicity.sql` was created
  through the ephemeral Supabase CLI, applied locally with `db push --local`,
  and appears in local migration status.
- Local seeded-admin query returned `admin@jadorebakery.com` with owner access
  to `J'adore Bakery`.
- Focused workspace and application tests passed; full Vitest passed with 17
  files and 137 tests.
- Typecheck, lint, and build passed.
- Full Playwright suite passed with 48 tests across desktop and mobile.
- `supabase db lint --local --fail-on error` remains blocked by an unrelated
  existing `private.create_online_order` reference to missing
  `production_tasks.order_item_id`. It also reports the pre-existing critical
  advisory that `public.recipes` has RLS disabled; no unrelated remediation
  was applied.
