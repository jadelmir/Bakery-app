# Design: Repair Bakery Discovery and Creation Flow

## Current Evidence

- `Front-end/supabase/seed.sql` creates the admin account
  `admin@jadorebakery.com`, the `J'adore Bakery` record, the admin profile with
  that bakery as default, and an owner membership.
- `Front-end/src/app/workspace.ts` lists accessible memberships through
  `bakery_memberships` joined to `bakeries`, then decorates each row with the
  profile default. This is the correct tenant boundary for existing bakery
  visibility.
- `Front-end/src/app/App.tsx` loads memberships after session restoration, but
  the create handler currently discards the ID returned by
  `createDefaultBakery()` and only reloads the list. With no remembered
  bakery, the active membership remains null after creation.
- The current `create_default_bakery` implementation returns the first
  existing membership before inserting anything. That is valid for an
  idempotent first-onboarding helper but conflicts with the selector’s explicit
  “Add another bakery” action.
- The existing mock adapter already appends a new membership, so its behavior
  is useful regression evidence for the intended frontend contract but does not
  prove the Supabase RPC path.

## Decisions

1. Keep bakery visibility membership-scoped. “Existing bakery” means an
   accessible bakery membership for the authenticated user, not any bakery row
   in the database.
2. Preserve the current `WorkspaceAdapter` shape unless implementation review
   shows that a separate explicit-create RPC is required. The smallest expected
   correction is to make the versioned creation operation create the requested
   bakery transactionally and return its ID, while keeping first-onboarding
   selection guarded by the empty-membership UI state.
3. Make the application treat the returned bakery ID as authoritative: reload
   memberships, find the matching membership, store it under the existing
   `bakery:<userId>` session key, and set it active before rendering the
   workspace.
4. Add a regression case for the seeded admin membership and a separate case
   proving an existing membership remains visible after a second bakery is
   created.

## Workstream Boundaries

### Workstream 1 — Persisted workspace operation and adapter evidence

Exclusive writable ownership:

- `Front-end/supabase/migrations/` (new corrective migration only)
- `Front-end/src/app/workspace.ts`
- `Front-end/src/app/workspace.test.tsx`

Responsibilities:

- Correct the versioned create operation’s semantics for explicit additional
  bakery creation while preserving owner membership and default profile rules.
- Verify the Supabase adapter maps existing accessible memberships, bakery
  names, roles, and default state.
- Add focused adapter/RPC-contract coverage and stop if migration semantics or
  RLS require a broader security decision.

Model: `gemini-3.6-flash`; reasoning effort: `medium`.

### Workstream 2 — Application selection state

Exclusive writable ownership:

- `Front-end/src/app/App.tsx`
- `Front-end/src/app/WorkspaceSelector.tsx`
- `Front-end/src/app/App.test.tsx`

Responsibilities:

- Ensure loaded existing memberships remain visible in the selector.
- Consume the created bakery ID, reload the membership list, select the new
  membership, and persist the active bakery key before entering the workspace.
- Add focused coverage for existing membership visibility and post-creation
  active selection.

Model: `gemini-3.6-flash`; reasoning effort: `medium`.

### Workstream 3 — Browser journey coverage

Exclusive writable ownership:

- `Front-end/e2e/app.spec.ts`

Responsibilities:

- Add browser coverage using the seeded admin path for an existing bakery.
- Add a multi-bakery journey proving the original bakery remains listed and
  the new bakery is entered after creation.

Model: `gemini-3.6-flash`; reasoning effort: `medium`.

The orchestrator owns all OpenSpec artifacts, `openspec/PROGRAM_MAP.md`,
integration fixes, and final verification. No workstream may edit another
workstream’s files, unrelated domain screens, invitation flows, or archived
OpenSpec content.

## Risks and Return Paths

- If the seeded admin membership is absent in the running database, stop and
  report the environment/seed state rather than weakening membership RLS.
- If the joined Supabase query returns an error instead of an empty result,
  preserve the error state and fix the adapter/query contract; do not silently
  fall back to global bakery rows.
- If changing the existing RPC would break an external caller that depends on
  first-only behavior, introduce a separately named explicit-create RPC and
  update the adapter contract instead.

## Verification Strategy

1. Run focused workspace adapter and application-shell tests.
2. Run the seeded-admin and multi-bakery Playwright journey.
3. Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and
   `pnpm run build` from `Front-end`.
4. For the migration, rebuild/apply committed migrations incrementally, run
   `supabase db lint`, and verify both allowed membership reads and denied
   cross-bakery access where the local Supabase environment is available.
