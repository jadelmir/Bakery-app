- [x] 1.1 Create ordered Supabase migrations through the repository-pinned CLI
  that adds an authenticated, bakery-scoped manual-order RPC. The RPC must
  calculate totals in cents, validate customer/recipe ownership, insert the
  order and items atomically, invoke the existing task-generation RPC, preserve
  retry idempotency by order UUID, and expose only the required authenticated
  execution boundary. The task generator must aggregate repeated recipes into
  one quantity-scaled plan.
- [x] 1.2 Add rollback-safe database tests for manual-order success, total and
  payment-status calculation, invalid-input rollback, same-bakery success,
  cross-bakery denial, repeated-recipe aggregation, scaled quantities, and
  replay without duplicate items/tasks.
- [x] 2.1 Add the persisted manual-order adapter/port and mapping tests. Load
  active-bakery customers, recipes, orders, order items, and production tasks;
  map UUID/cents fields to the domain contracts; return authoritative changes;
  and translate Supabase failures into typed adapter failures.
- [x] 2.2 Regenerate/check Supabase database types after migration changes and
  keep generated output ownership with the orchestrator so concurrent agents do
  not overwrite it.
- [x] 3.1 Replace fixture-only Add Order inputs with persisted catalog records,
  wire the persisted adapter through the workspace boundary, await creation,
  show pending/error states, and replace local-prototype confirmation language.
  Preserve mock-mode behavior through the local adapter contract.
- [x] 3.2 Make the Orders view consume the persisted shared snapshot and verify
  that a newly created order and its task plan appear without refresh and after
  reload. Do not implement edit/cancel/refund behavior.
- [x] 3.3 Add focused frontend tests and desktop/mobile Playwright coverage for
  live-ID submission, successful creation, retry/error behavior, and persisted
  order visibility. Update existing prototype assertions to the persisted
  contract.
- [x] 4.1 Rebuild local Supabase from committed migrations, run database tests,
  lint/advisors, generated-type checks, focused Vitest, and the full frontend
  verification baseline. Manually verify the authenticated order journey and
  record any unrelated blocker without broadening scope.
- [x] 4.2 After verification, update delta specs, task evidence, and
  `openspec/PROGRAM_MAP.md`; do not archive before manual testing and all
  required evidence are complete.

## Evidence

- Database: `20260803160228_create_manual_order_rpc.sql`,
  `20260803165220_aggregate_order_production_plans.sql`, and
  `manual_orders.test.sql`; local reset, zero-error schema lint, and 79/79
  pgTAP checks pass.
- Frontend: `manualOrderAdapter.ts`, `AddOrderModal.tsx`, `BakeryWorkspace.tsx`,
  and `App.tsx`; generated-type check, typecheck, lint, focused scaling test
  6/6, and production build pass. The full suite currently has 8 unrelated
  OrdersScreen fixture failures in the shared workspace.
- Browser: the focused desktop/mobile order projection journey passes 4/4.
  The full suite passes 49/52; the three failures are unrelated account-flow
  assertions (password-label strictness and mobile logout timing).
- Lifecycle: the change is verified locally but intentionally not archived;
  live authenticated manual acceptance remains the final lifecycle gate.
