# Implementation Plan: Add Manual Order Status Transitions

request_feedback: true

## Objective

Add a safe, sequential, manually controlled order lifecycle for authenticated
bakery members: `confirmed -> in-production -> ready -> completed`. Persist
the transition for live manual orders, preserve mock-mode behavior, and expose
only the next valid action on the Orders detail view.

## OpenSpec Change

`add-manual-order-status-transitions`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/order-status-transitions/spec.md`
- `tasks.md`

## Execution Preconditions

- Resolve the active `persist-manual-orders` ownership overlap before editing
  `OrdersScreen.tsx`, `BakeryWorkspace.tsx`, or related order-flow tests.
- Confirm local-only synthetic data and do not use linked/production database
  state.
- Stop for a new product decision if the requested workflow is expanded to
  include cancellation, editing, refunds, automatic task-driven transitions,
  or public online-order behavior.

## Workstream 1 - Persisted transition boundary

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 1.1, 1.2, 2.3
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` (new migration only, if required)
  - `Front-end/supabase/tests/database/` (new status-transition test only)
  - `Front-end/src/lib/supabase/manualOrderAdapter.ts`
- Deliverable: a bakery-scoped persisted mutation that enforces the expected
  current status and next target status, returns the refreshed snapshot, and
  denies cross-bakery or invalid transitions.
- Must not change: public online checkout functions, historical migrations,
  seed data, or unrelated RLS policies.
- Verification: focused pgTAP/database tests and mocked persisted-adapter tests.
- Stop when: the existing order update/RLS contract cannot safely distinguish
  authenticated bakery-member mutation from public order creation.

## Workstream 2 - Shared domain and local adapter

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 2.1, 2.2
- Exclusive writable ownership:
  - `Front-end/src/app/domain/types.ts`
  - `Front-end/src/app/domain/adapters.ts` (re-exports only, if needed)
  - `Front-end/src/app/state/domainState.ts`
  - `Front-end/src/app/domain/localAdapter.ts`
  - focused domain/state tests for order transitions
- Deliverable: one shared order-status command contract and deterministic
  session-local implementation with sequential validation and retry-safe
  operation handling.
- Must not change: persisted SQL boundary, Orders UI, public checkout, or
  production-task semantics.
- Verification: focused local-adapter and state-controller Vitest tests.
- Dependency: serialize after Workstream 1 confirms the mutation shape.

## Workstream 3 - Orders UI and integration

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 3.1, 3.2, 3.3, 3.4
- Exclusive writable ownership:
  - `Front-end/src/app/screens/OrdersScreen.tsx`
  - `Front-end/src/app/BakeryWorkspace.tsx`
  - focused Orders/App tests
  - order-flow sections of `Front-end/e2e/app.spec.ts` or a new focused spec
- Deliverable: status-specific action labels, pending/error states,
  authoritative refresh, and complete desktop/mobile lifecycle coverage.
- Must not change: Add Order creation contract, production task controls,
  public storefront flows, or unrelated navigation.
- Verification: focused Vitest plus desktop/mobile Playwright transition and
  reload journeys.
- Dependency: serialize after Workstreams 1 and 2 stabilize the command.

## Workstream 4 - Integration and lifecycle evidence

- Owner: orchestrator; serialized after Workstreams 1-3
- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 4.1, 4.2
- Exclusive writable ownership:
  - OpenSpec artifacts for this change
  - `openspec/PROGRAM_MAP.md`
  - generated database types only if a migration/RPC changes them
- Deliverable: integrated verification, manual authenticated acceptance, task
  evidence, and archive-readiness assessment.
- Verification plan:

```text
pnpm exec supabase test db
pnpm run supabase:types:check
pnpm run test -- src/app/domain/localAdapter.test.ts src/app/state/state.test.ts
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test:e2e -- e2e/app.spec.ts
```

- Must not change: linked/production data, historical migrations, or unrelated
  active OpenSpec changes.
- Stop when: any required denial path, local transition, authoritative reload,
  or affected browser journey fails; record the blocker instead of weakening
  the transition contract.

## Ownership Validation

The planned ownership sets are disjoint. Workstreams 1 and 2 are serialized
on the mutation contract; Workstream 3 is serialized after the adapter and
controller contract; Workstream 4 owns integration and OpenSpec synchronization.
Run `findOwnershipConflicts()` before spawning implementation agents and require
zero conflicts.

## Approval Gate

This is a planning-only change. Stop here and wait for explicit approval before
running `/orch add-manual-order-status-transitions`.

