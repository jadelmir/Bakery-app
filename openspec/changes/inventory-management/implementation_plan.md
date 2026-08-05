# Implementation Plan: Inventory Management

request_feedback: true

## Objective

Make inventory an authoritative, persisted operating system for ingredients,
retail supplies, and finished goods, with prep-day reservations, packaging-
checkpoint consumption/output, and finance reporting for both purchase spend and
consumed product cost.

## OpenSpec Change

`inventory-management`

## Product and backend placement

- Frontend phases: F3 Ingredients and Stock Entry, F9 Starter and Inventory
  Planning, and F11 Finances and Invoices.
- Backend phases: B3 Ingredients and Costing, B10 Inventory Requirements, and
  B11 Reporting.
- Dependencies: existing bakery tenancy/authentication, recipes and recipe
  ingredients, orders/order items, production tasks, starter requirements, and
  the current finance/reporting shell.
- This is a corrective expansion of the synchronized
  `ingredients-and-stock-entry`, `inventory-requirements-management`, and
  `bakery-reporting` capabilities. It does not rewrite archived changes.

## Decisions carried into implementation

- Prep-day demand creates reservations; it does not reduce physical on-hand.
- The final enabled packaging checkpoint is the consumption/output checkpoint.
- Raw ingredients and retail supplies decrease once at that checkpoint.
- Finished goods increase at that checkpoint; made-to-order output is allocated,
  while made-ahead output remains available.
- Negative on-hand is allowed with a visible shortage warning.
- Package inputs convert to canonical base units.
- Any active bakery member may record actions; ledger events are append-only.
- Finance separates purchase cash spend, inventory value, and COGS.

## Workstream 1 - Database model, migrations, and RPCs

- Model: high-reasoning architecture model, high effort.
- Task IDs: 1.1, 1.2, 1.3.
- Exclusive writable ownership:
  - `Front-end/supabase/migrations/` inventory migrations only
  - `Front-end/supabase/tests/` inventory database tests only
  - generated `Front-end/src/lib/supabase/database.types.ts`
- Deliverable: one authoritative ledger, reservation/allocation persistence,
  atomic mutations, RLS, idempotency constraints, and legacy reconciliation.
- Must not change: unrelated auth, workspace, customer, order, invoice, or
  storefront migrations.
- Verification: `supabase db reset`, `supabase db lint`, generated-type check,
  pgTAP happy/denial/retry paths, and security-advisor review.

## Workstream 2 - Domain model and persisted adapters

- Model: bounded implementation model, high effort.
- Task IDs: 2.1, 2.2, 2.3, 2.4.
- Exclusive writable ownership:
  - `Front-end/src/app/domain/types.ts`
  - `Front-end/src/app/domain/localAdapter.ts`
  - `Front-end/src/app/domain/localAdapter.test.ts`
  - `Front-end/src/app/state/domainState.ts`
  - `Front-end/src/app/state/selectors.ts`
  - new inventory-specific Supabase adapter files and tests
- Deliverable: shared commands/results for local and Supabase inventory,
  authoritative state application, weighted-average cost, reservations,
  packaging checkpoint idempotency, and negative-stock semantics.
- Must not change: inventory screen layout, unrelated customer/order adapters,
  or database migration files owned by Workstream 1.
- Dependency: Workstream 1 contract and generated types must stabilize first.
- Verification: domain/unit tests, adapter tests, typecheck, and focused retry
  and tenant-isolation cases.

## Workstream 3 - Inventory UI and interaction tests

- Model: bounded implementation model, medium effort.
- Task IDs: 3.1, 3.2, 3.3, 3.4.
- Exclusive writable ownership:
  - `Front-end/src/app/screens/InventoryScreen.tsx`
  - `Front-end/src/app/components/inventory/`
  - focused inventory component/screen tests
- Deliverable: actionable inventory overview, receive/count flows, history,
  shortage explanations, and accessible pending/error/success feedback.
- Must not change: domain contracts, migrations, production task integration,
  or finance selectors.
- Dependency: Workstream 2 command contracts must be available before wiring
  mutations.
- Verification: focused Vitest, accessibility assertions, and responsive visual
  checks.

## Workstream 4 - Production, workspace, and finance integration

- Model: high-reasoning integration model, high effort.
- Task IDs: 4.1, 4.2, 4.3, 4.4.
- Exclusive writable ownership:
  - `Front-end/src/app/BakeryWorkspace.tsx`
  - production/task integration files that own completion checkpoints
  - `Front-end/src/app/reporting.ts`
  - `Front-end/src/app/screens/FinancesScreen.tsx`
  - focused integration tests
- Deliverable: prep-day reservation lifecycle, packaging output/usage, and
  financial measures connected to shared authoritative data.
- Serialization: `BakeryWorkspace.tsx` overlaps the active
  `persist-customer-directory` change. Start only after that change releases
  the file or have the orchestrator integrate the changes sequentially.
  Coordinate finance surface changes with any active payment/reporting work.
- Must not change: customer persistence behavior, order status semantics, or
  archived specs.
- Verification: integration tests, financial reconciliation examples, and
  production task retry coverage.

## Workstream 5 - Browser acceptance

- Model: bounded implementation model, medium effort.
- Task IDs: 5.1.
- Exclusive writable ownership:
  - new `Front-end/e2e/inventory-management.spec.ts` or inventory sections of
    the existing inventory E2E spec
- Deliverable: desktop/mobile journey covering receive, reservation, shortage,
  packaging completion, finished-good allocation, and finance visibility.
- Must not change application source or unrelated E2E suites.
- Dependency: Workstreams 2-4 complete and locally integrated.
- Verification: affected Playwright projects, followed by full browser suite
  when the shared application foundation is stable.

## Workstream 6 - Orchestrator verification and lifecycle

- Owner: orchestrator.
- Task IDs: 5.2, 6.1, 6.2.
- Exclusive writable ownership:
  - OpenSpec artifacts for this change
  - `openspec/PROGRAM_MAP.md`
  - final integration-only conflict resolution
- Deliverable: complete verification evidence, manual acceptance record,
  synchronized deltas, and archive readiness decision.
- Verification baseline:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e -- e2e/inventory-management.spec.ts
supabase db reset
supabase db lint
openspec validate inventory-management
```

Manual authenticated acceptance is required before synchronization/archive.

## Ownership validation

Workstreams have no concurrent writable-file overlap. Workstream 4 is
serialized against the active customer-directory change and any active
payment/reporting edits. The orchestrator owns all cross-workstream integration
and OpenSpec lifecycle updates.

## Approval gate

This is planning only. Stop and wait for explicit user approval before running
`/orch inventory-management`.
