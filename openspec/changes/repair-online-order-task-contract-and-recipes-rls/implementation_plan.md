# Implementation Plan: Repair Online-Order Task Contract and Recipes RLS

request_feedback: false

## Objective

Repair the stale online-order database function and close the critical
`public.recipes` RLS gap with migration-first, membership-scoped changes. The
approved implementation must leave checkout idempotency intact, prevent
cross-bakery recipe access, and eliminate the known production-task lint
failure on a clean local rebuild.

## OpenSpec Change

`repair-online-order-task-contract-and-recipes-rls`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/supabase-backend-foundation/spec.md`
- `specs/bakery-tenant-isolation/spec.md`
- `tasks.md`

## Evidence-Based Scope

The issue is caused by migration ordering: the task-regeneration migration
recreated `production_tasks` after the online-storefront migration, but did
not replace the dependent checkout function. Separately, `recipes` has a
`bakery_id` owner and an existing membership helper but no RLS policy. The
plan therefore uses one new migration for both tightly coupled schema fixes,
with tests and verification kept separate from migration authorship.

## Workstream Assignments

### Workstream 1 - Database migration repair

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 1.1 and 2.1
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` (new migration only)
- Deliverable: one ordered migration created with the pinned Supabase CLI
  that replaces the checkout function against the final task schema and adds
  recipe membership RLS.
- Acceptance criteria: the migration applies after all existing migrations;
  the function preserves its supported signature/contract/idempotency and
  creates a current-schema production task; recipes RLS is enabled only with
  a complete membership policy; no historical migration is edited.
- Must not change: seed data, frontend code, generated types, tests, linked
  project state, or unrelated grants/policies.
- Stopping rule: stop if the function signature, public grants, seed fixtures,
  or intended recipe access boundary conflicts with the current schema; do
  not invent a new public API or weaken RLS.

### Workstream 2 - Database security and RPC tests

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 1.2 and 2.2
- Exclusive writable ownership:
  - `Front-end/supabase/tests/database/` (new pgTAP test file only)
- Deliverable: rollback-safe pgTAP coverage for online checkout task creation,
  retry idempotency, recipe membership access, cross-bakery denial, anonymous
  denial, and direct security assertions.
- Acceptance criteria: tests use synthetic records, exercise the supported
  roles/JWT claims, prove both allow and deny paths, and pass against the
  local database after the migration is applied.
- Must not change: migrations, seed data, application code, package scripts,
  or hosted/production state.
- Stopping rule: stop if the supported RPC invocation or local test runner
  cannot be established from the repository's current grants/configuration;
  report the mismatch instead of bypassing the public boundary.

### Workstream 3 - Integration and release verification

- Owner: orchestrator; serialized after Workstreams 1 and 2
- Task IDs: 3.1-3.3
- Exclusive writable ownership: OpenSpec artifacts and
  `openspec/PROGRAM_MAP.md` only
- Deliverable: integrated local database evidence, generated-type check,
  advisor/lint result, frontend quality result, and manually verified online
  checkout/recipe security behavior.
- Acceptance criteria: local reset succeeds from committed history; database
  lint has no stale online-order task dependency and no unresolved critical
  `recipes` RLS finding; relevant tests and baseline checks pass; delta specs
  and map agree with actual evidence.
- Must not change: linked/production data, historical migrations, or unrelated
  product behavior.
- Stopping rule: stop and report any new migration failure, authorization
  regression, or unrelated database finding rather than broadening scope.

The migration and test workstreams have disjoint writable directories. The
orchestrator must run `findOwnershipConflicts()` before spawning agents and
must serialize any generated output or package/configuration change that
would overlap these assignments.

## Verification Plan

From `Front-end` after implementation:

```text
pnpm exec supabase test db --help
pnpm run supabase:reset
pnpm exec supabase test db
pnpm exec supabase db lint --local --fail-on error
pnpm exec supabase db advisors
pnpm run supabase:types:check
pnpm exec vitest run
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test:e2e -- e2e/online-storefront.spec.ts
```

The exact database-test and advisor invocations must be confirmed from the
pinned CLI help before execution. If the named storefront Playwright file is
not present, run the repository's affected online-storefront test selection
and record the actual command. No linked reset or hosted push is part of this
plan.

## Ownership Validation

The intended writable ownership sets are:

```text
Workstream 1: Front-end/supabase/migrations/ (new migration only)
Workstream 2: Front-end/supabase/tests/database/ (new pgTAP test only)
Workstream 3: no source ownership; OpenSpec artifacts and PROGRAM_MAP only
```

Run `findOwnershipConflicts()` with these assignments. It must report zero
conflicts before `/orch` execution.

## Completion Evidence

- Migration applied during a clean local reset:
  `20260803155554_repair_online_order_task_contract_and_recipes_rls.sql`.
- Focused pgTAP suite passed: 30/30 checks covering online checkout
  task creation/idempotency and recipe RLS allow/deny paths.
- Local database lint passed with no schema errors.
- Local security advisors reported no issues.
- Seed verification passed; generated database types are current.
- Typecheck, lint, 138 Vitest tests, production build, and all 48 desktop/mobile
  Playwright tests passed.
- Full pgTAP run remains blocked by two pre-existing assertions in
  `multi_store_workspaces.test.sql` that still expect explicit bakery creation
  to be idempotent, contrary to the verified bakery-creation correction.
- Performance advisors still report existing warnings on older policies; no
  new warning was introduced for `recipes` by this change.
