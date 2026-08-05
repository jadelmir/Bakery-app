# Implementation Plan: Clean Local Bakery Seed State

request_feedback: false

## Objective

Remove persisted local verification pollution from the admin bakery selector
by restoring the local database from committed seed data, while adding guards
that keep mock fixtures and future local verification honest. The application
must continue to show all authorized memberships and must not hide bakeries by
name.

## OpenSpec Change

`clean-local-bakery-seed-state`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/bakery-workspace-selection/spec.md`
- `tasks.md`

## Evidence-Based Assumption

The two `Runtime Check Bakery` entries are local database rows created during
runtime verification. They are absent from `Front-end/supabase/seed.sql`,
`Front-end/src/app/workspace.ts`, and the existing mock scenarios. No source
path should be added that filters this name; cleanup belongs in the local
reset, with a read-only guard to detect recurrence.

## Workstream Assignments

### Workstream 1 - Mock fixture regression

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.1
- Exclusive writable ownership:
  - `Front-end/src/app/workspace.test.tsx`
- Deliverable: focused test coverage proving the default mock membership set
  has no runtime verification bakery.
- Acceptance criteria: the test passes with the existing default mock and
  fails if a `Runtime Check Bakery` membership is added to that fixture.
- Must not change: application source, Supabase migrations, seed data, browser
  configuration, or other tests.
- Stopping rule: stop if the test requires changing the adapter contract or
  if a real product fixture is found to use the runtime-check name.

### Workstream 2 - Local seed verification guard

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.2
- Exclusive writable ownership:
  - `Front-end/scripts/verify-local-bakery-seed.mjs`
  - `Front-end/package.json`
- Deliverable: a read-only local PostgreSQL check and package entry point that
  verify the seeded admin's exact bakery membership and reject runtime-check
  rows.
- Acceptance criteria: the command succeeds immediately after a clean local
  reset, reports `J'adore Bakery`, reports no runtime-check rows, and uses no
  linked-project credentials or destructive SQL.
- Must not change: migrations, app selectors, RLS policies, or
  production/linked database configuration.
- Stopping rule: stop if the local connection cannot be made without adding a
  secret or if the query would bypass the repository's local-only boundary.

### Workstream 3 - Local reset and product verification

- Owner: orchestrator (serialized; no sub-agent write ownership)
- Task IDs: 1.2a, 1.3-1.5
- Exclusive writable ownership:
  - `Front-end/supabase/seed.sql` for the discovered schema-compatibility
    correction only
  - OpenSpec artifacts and `openspec/PROGRAM_MAP.md`
- Deliverable: a clean local reset, database evidence, and manual browser
  evidence using the actual local Supabase backend.
- Acceptance criteria: after reset, the admin selector contains only
  `J'adore Bakery`; no runtime-check rows exist; explicit creation adds and
  activates a new bakery while retaining the seeded one; focused and baseline
  checks pass or are recorded with their exact unrelated blocker.
- Must not change: linked/production data, ad-hoc deletion SQL, RLS policy
  behavior, or unrelated lint/migration defects.
- Stopping rule: stop immediately if the command resolves to a linked or
  production project, if reset fails, or if verification exposes an RLS or
  authorization regression.

The orchestrator owns OpenSpec artifacts, ownership validation, integration,
the destructive local reset, final verification, and task completion. The
three workstreams have disjoint writable file sets.

## Verification Plan

From `Front-end`:

```text
pnpm exec vitest run src/app/workspace.test.tsx
pnpm run supabase:reset
pnpm run supabase:verify-seed
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e -- e2e/app.spec.ts
```

For the manual persisted-backend journey, start the local frontend with
`VITE_USE_MOCK_BACKEND=false`, log in as the seeded admin, confirm the selector
contents, create one clearly named temporary bakery, confirm it becomes active,
then use the local-only cleanup/reset workflow to leave the environment at the
committed seed state.

The database lint command remains required where available. Its known
pre-existing `private.create_online_order` / `production_tasks.order_item_id`
mismatch and `public.recipes` RLS advisory must be reported, not silently fixed
under this change.

## Ownership Validation

The writable ownership sets are intentionally disjoint:

```text
Workstream 1: Front-end/src/app/workspace.test.tsx
Workstream 2: Front-end/scripts/verify-local-bakery-seed.mjs,
             Front-end/package.json
Workstream 3: Front-end/supabase/seed.sql for the schema-compatibility
             correction; reset and verification remain orchestrator-only
```

Run `findOwnershipConflicts()` before spawning implementation agents. It must
report zero conflicts.

## Completion

The approved implementation is complete. The local database was reset twice
from committed migrations and seed data (once for the clean-seed check and
once after the browser creation check), and it ends with the committed seed
state. The only remaining verification issue is the pre-existing database lint
error in `private.create_online_order`.
