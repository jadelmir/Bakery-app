# Implementation Plan: Repair Idempotent Bakery Onboarding

request_feedback: false

## Objective

Separate idempotent default onboarding from explicit additional-bakery
creation. Existing members must see their bakery and must not receive a new
bakery from a retried default operation; an intentional additional-bakery
action must still create, display, and activate a new workspace.

## OpenSpec Change

`repair-idempotent-bakery-onboarding`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/bakery-workspace-selection/spec.md`
- `specs/supabase-backend-foundation/spec.md`
- `tasks.md`

## Workstream Assignments

### Workstream 1 - Versioned RPC contracts

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 1.1-1.3
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` (new migration only)
- Deliverable: one migration that restores idempotent default onboarding and
  adds a distinct authenticated additional-creation operation.
- Acceptance criteria: clean replay succeeds; repeated default calls return
  the same accessible ID without a duplicate membership; explicit additional
  creation returns a new ID and preserves the prior membership; grants,
  wrappers, validation, and security boundaries remain correct.
- Must not change: frontend files, tests, seed data, generated types, linked
  project state, or historical migrations.
- Stopping rule: stop if another caller requires the old overloaded behavior,
  if a public wrapper would need `SECURITY DEFINER`, or if the operation cannot
  preserve atomic owner membership creation without a product decision.

### Workstream 2 - Adapter and application state

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 2.1-2.3
- Exclusive writable ownership:
  - `Front-end/src/app/workspace.ts`
  - `Front-end/src/app/workspace.test.tsx`
  - `Front-end/src/app/App.tsx`
  - `Front-end/src/app/App.test.tsx`
- Deliverable: distinct adapter methods and conditional application routing
  that use default creation only for empty onboarding and additional creation
  for the explicit add form.
- Acceptance criteria: existing memberships remain visible; default retries
  do not append; explicit creation appends and activates; mock and Supabase
  RPC contracts are covered.
- Must not change: migrations, database SQL tests, browser specs, invitations,
  or unrelated workspace screens.
- Stopping rule: stop if the selector callback lacks enough state to distinguish
  first onboarding from explicit creation or if the adapter contract must be
  redesigned beyond these two operations.

### Workstream 3 - Database contract tests

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 3.1
- Exclusive writable ownership:
  - `Front-end/supabase/tests/database/multi_store_workspaces.test.sql`
  - `Front-end/supabase/tests/database/bakery_creation_contract.test.sql`
- Deliverable: rollback-safe pgTAP coverage for default retry idempotency and
  explicit additional creation, including owner membership and retained
  access assertions.
- Acceptance criteria: the corrected existing test passes; explicit creation
  gets a new bakery ID and leaves the original accessible; tests use synthetic
  claims and no linked credentials.
- Must not change: migrations, frontend files, seed data, or application
  tests.
- Stopping rule: stop if the supported RPC wrapper names or grants differ from
  the migration plan; do not bypass the public authenticated boundary.

### Workstream 4 - Browser journey coverage

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 4.1
- Exclusive writable ownership:
  - `Front-end/e2e/app.spec.ts`
- Deliverable: browser coverage for existing bakery visibility, no duplicate
  onboarding behavior, and explicit additional bakery activation.
- Acceptance criteria: desktop and mobile affected journeys pass with both
  original and newly created bakery names available.
- Must not change: application source, migrations, database tests, or seed
  behavior.
- Stopping rule: stop if the browser harness cannot distinguish mock default
  onboarding from explicit additional creation without changing product code;
  report the needed integration boundary.

### Workstream 5 - Integration and lifecycle

- Owner: orchestrator; serialized after implementation workstreams
- Task IDs: 5.1-5.3
- Exclusive writable ownership: OpenSpec artifacts, generated database types,
  and `openspec/PROGRAM_MAP.md` only
- Deliverable: integrated local reset, database/security evidence, full
  frontend/browser verification, and synchronized OpenSpec state.
- Acceptance criteria: all new and affected tests pass; no duplicate default
  bakery is created; explicit creation remains additive; no linked/production
  state is touched.

Run `findOwnershipConflicts()` before spawning agents. The ownership sets are
disjoint; generated type output and OpenSpec synchronization remain serialized
under the orchestrator.

## Verification Plan

From `Front-end` after implementation:

```text
pnpm exec supabase migration new repair_idempotent_bakery_onboarding
pnpm run supabase:reset
pnpm exec supabase test db --local
pnpm exec supabase db lint --local --fail-on error
pnpm exec supabase db advisors --local --type security --level warn --fail-on error
pnpm exec supabase db advisors --local --type performance --level warn --fail-on error
pnpm run supabase:verify-seed
pnpm run supabase:types
pnpm run supabase:types:check
pnpm exec vitest run src/app/workspace.test.tsx src/app/App.test.tsx
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e -- e2e/app.spec.ts
```

The exact migration/test/advisor commands must be confirmed from the pinned
CLI help before execution. No linked reset, hosted push, or production data
operation is in scope.

## Execution Gate (Completed)

The approved execution command was:

```text
/orch repair-idempotent-bakery-onboarding
```

## Completion Evidence

- Migration `20260803161712_repair_idempotent_bakery_onboarding.sql` was
  created through the pinned Supabase CLI and applied during a clean local
  reset.
- Complete local pgTAP suite passed: 78/78 tests, including idempotent
  default onboarding and additive explicit creation.
- Database lint and security advisors reported no errors; performance advisors
  retain existing warnings on older policies outside this change.
- Seed verification and generated database type drift checks passed.
- Typecheck, lint, 155 Vitest tests, production build, and the affected
  bakery-selection browser suite passed: 16/16 desktop/mobile tests.
- The full Playwright run had 49/52 passing; the three failures are unrelated
  authentication/account selectors and mobile logout timing, not bakery
  onboarding behavior.
