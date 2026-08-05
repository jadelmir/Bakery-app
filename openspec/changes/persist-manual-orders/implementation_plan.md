# Implementation Plan and Execution Record: Persist Manual Bakery Orders

request_feedback: true

## Objective

Turn the authenticated Add Order flow from a local prototype into a persisted,
retry-safe Supabase workflow for the active bakery, including order items and
generated production tasks, while keeping public online checkout and unrelated
prototype features outside this change.

## OpenSpec Change

`persist-manual-orders`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/manual-order-persistence/spec.md`
- `tasks.md`

## Workstream 1 - Manual-order database transaction

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 1.1
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` (new migration only)
- Deliverable: one ordered migration adding the authenticated manual-order RPC
  with integer-cent calculation, bakery membership checks, atomic order/item
  creation, task generation, and replay idempotency.
- Read first: `proposal.md`, `design.md`, `specs/manual-order-persistence/spec.md`,
  existing order/task migrations, and the active online-order repair change.
- Must not change: historical migrations, seed data, frontend code, generated
  types, online checkout functions, or linked/production state.
- Verification: pinned Supabase CLI help, migration application on local reset,
  and focused RPC execution once database tests are available.
- Stop when: the existing online-order repair changes the same function/table
  contract in a way that requires sequencing or a product/security decision.

## Workstream 2 - Database and adapter contract evidence

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 1.2, 2.1
- Exclusive writable ownership:
  - `Front-end/supabase/tests/database/` (new test file only)
  - `Front-end/src/lib/supabase/manualOrderAdapter.ts` (new file only)
  - `Front-end/src/app/domain/types.ts` (only the order-port contract section)
  - `Front-end/src/app/domain/adapters.ts` (only required re-exports)
- Deliverable: pgTAP coverage plus a typed persisted adapter that maps the
  active bakery catalog and order/task records into the existing domain
  contracts and exposes typed failure/idempotency behavior.
- Dependency: begin after Workstream 1's RPC signature is reviewed; database
  tests may be drafted earlier but must not finalize against an unapproved
  function contract.
- Must not change: UI components, `BakeryWorkspace.tsx`, local adapter logic,
  migrations, seed data, or generated database output.
- Verification: focused adapter tests with a mocked Supabase client and local
  pgTAP tests for allow/deny/rollback/retry paths.
- Stop when: the current full `BakeryDomainAdapter` contract would force
  unsupported local prototype features to be mislabeled as persisted.

## Workstream 3 - UI and workspace integration

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 3.1, 3.2, 3.3
- Exclusive writable ownership:
  - `Front-end/src/app/components/orders/AddOrderModal.tsx`
  - `Front-end/src/app/BakeryWorkspace.tsx`
  - `Front-end/src/app/screens/OrdersScreen.tsx`
  - `Front-end/src/app/App.test.tsx`
  - `Front-end/e2e/app.spec.ts` (order-flow tests only)
- Deliverable: the live Add Order flow submits persisted customer/recipe IDs,
  displays pending/error/success states, updates the shared Orders/Production
  projections, and passes the persisted reload journey. Mock-mode tests retain
  the local adapter behavior.
- Dependency: serialize after Workstream 2 so the adapter contract is stable.
- Must not change: database migrations/tests, online storefront checkout,
  unrelated navigation or payment/invoice behavior, or local adapter internals.
- Verification: focused Vitest tests, desktop/mobile Playwright order journey,
  and manual inspection of the confirmation and reload behavior.
- Stop when: the adapter wiring requires a new product decision about payment
  method persistence, invoice creation, or order editing/cancellation.

## Workstream 4 - Integration and release verification

- Owner: orchestrator; serialized after Workstreams 1-3
- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 2.2, 4.1, 4.2
- Exclusive writable ownership:
  - `Front-end/src/lib/supabase/database.types.ts` (generated output only)
  - OpenSpec artifacts for this change
  - `openspec/PROGRAM_MAP.md`
- Deliverable: generated types, clean local database evidence, integrated
  frontend/database verification, manual acceptance evidence, and synchronized
  OpenSpec records.
- Verification plan:

```text
pnpm exec supabase --help
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
pnpm run test:e2e -- e2e/app.spec.ts
```

- Must not change: linked/production data, historical migrations, or unrelated
  active OpenSpec changes.
- Stop when: a clean reset, security denial path, generated type check, or
  baseline fails for an unrelated reason; record the exact blocker rather than
  weakening the acceptance criteria.

## Ownership Validation

The planned concurrent ownership sets are disjoint:

```text
Workstream 1: Front-end/supabase/migrations/ (new migration only)
Workstream 2: Front-end/supabase/tests/database/ (new test),
              Front-end/src/lib/supabase/manualOrderAdapter.ts (new file),
              order-port sections in domain contract files
Workstream 3: AddOrderModal.tsx, BakeryWorkspace.tsx, OrdersScreen.tsx,
              App.test.tsx, order-flow sections in e2e/app.spec.ts
Workstream 4: generated database.types.ts, OpenSpec artifacts, PROGRAM_MAP.md
```

Run `findOwnershipConflicts()` against the assignment objects before spawning
agents. It must report zero conflicts. Workstreams 2 and 3 are serialized by
the adapter contract even though their writable files do not overlap.

## Approval Gate

The user approved this plan and started:

```text
/orch persist-manual-orders
```

## Execution status

Implementation and local verification are complete. The migrations, aggregate
recipe-level production plan, database tests, persisted adapter, generated
types, UI integration, focused order browser journey, and frontend quality
baseline are complete. Full browser
verification still reports three unrelated account-flow failures; live
authenticated manual acceptance is intentionally left before archive.
