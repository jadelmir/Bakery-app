# Implementation Plan: Repair Bakery Discovery and Creation Flow

request_feedback: false

## Objective

Repair the F2/B2 authenticated workspace boundary so the signed-in admin sees
the existing accessible bakery and explicit creation produces, displays, and
enters the newly created bakery without hiding prior memberships.

## OpenSpec Change

`repair-bakery-selection-and-creation`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/bakery-workspace-selection/spec.md`
- `tasks.md`

## Approved Planning Assumption

“Existing bakery” means a bakery connected to the current authenticated user
through `bakery_memberships`. The plan does not expose unrelated bakery rows.

## Workstream Assignments

### Workstream 1 — Persisted workspace operation and adapter

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.1–1.3
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` (new corrective migration only)
  - `Front-end/src/app/workspace.ts`
  - `Front-end/src/app/workspace.test.tsx`
- Deliverable: a verified persisted create contract and membership mapping.
- Acceptance criteria: existing accessible memberships are returned; explicit
  creation adds a new bakery and owner membership without removing prior ones;
  focused adapter tests pass.
- Must not change: `App.tsx`, `WorkspaceSelector.tsx`, browser tests, domain
  tables, invitation behavior, or archived changes.
- Stopping rule: stop for an RLS, migration, or external-RPC compatibility
  conflict.

### Workstream 2 — Application selection state

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 2.1–2.3
- Exclusive writable ownership:
  - `Front-end/src/app/App.tsx`
  - `Front-end/src/app/WorkspaceSelector.tsx`
  - `Front-end/src/app/App.test.tsx`
- Deliverable: existing bakery visibility and immediate post-creation active
  selection in the application shell.
- Acceptance criteria: existing memberships render before onboarding; the
  returned created bakery ID is resolved to a membership, stored, and entered;
  failure leaves existing state intact; focused app tests pass.
- Must not change: Supabase migrations, workspace adapter contract, domain
  screens, authentication, or browser specs.
- Stopping rule: stop if the adapter cannot guarantee a membership for the
  returned ID or if a shared contract change is required.

### Workstream 3 — Browser journey coverage

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 3.1–3.2
- Exclusive writable ownership: `Front-end/e2e/app.spec.ts`
- Deliverable: browser evidence for seeded admin discovery and multi-bakery
  creation.
- Acceptance criteria: the original bakery is visible on login, the new bakery
  is visible after creation, and the new bakery is active when the workspace
  opens.
- Must not change: source code, migrations, or unit tests.
- Stopping rule: distinguish environment/seed failures from product failures
  and report them to the orchestrator.

The orchestrator owns OpenSpec artifacts, `openspec/PROGRAM_MAP.md`, ownership
validation, integration, and final verification. No concurrent assignment
overlaps these writable file sets.

## Verification Plan

From `Front-end`:

```text
pnpm exec vitest run src/app/workspace.test.tsx src/app/App.test.tsx
pnpm exec playwright test e2e/app.spec.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

For the database work, use the repository migration workflow, then run
`supabase db push` against the local database without resetting user data and
`supabase db lint`. Verify the seeded admin can read its own membership and a
non-member cannot read another bakery.

## Ownership Validation

The three writable ownership sets are intentionally disjoint:

```text
Workstream 1: Front-end/supabase/migrations/, Front-end/src/app/workspace.ts,
             Front-end/src/app/workspace.test.tsx
Workstream 2: Front-end/src/app/App.tsx,
             Front-end/src/app/WorkspaceSelector.tsx,
             Front-end/src/app/App.test.tsx
Workstream 3: Front-end/e2e/app.spec.ts
```

The repository ownership validator must report zero conflicts before
implementation agents are spawned.

## Approval Gate

Execution is complete. All scoped implementation and browser acceptance
criteria pass. The local database migration applies successfully; the
repository-wide database lint command still reports the pre-existing
`private.create_online_order` / `production_tasks.order_item_id` mismatch and
the separate `public.recipes` RLS advisory. Those unrelated database issues
remain recorded in `tasks.md`; no archive was performed.
