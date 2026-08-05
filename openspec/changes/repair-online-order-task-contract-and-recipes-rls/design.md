# Design: Repair Online-Order Task Contract and Recipes RLS

## Findings

- `20260729170000_online_storefront.sql` defines
  `private.create_online_order` against the original task columns.
- `20260730190000_task_regeneration_engine.sql` drops and recreates
  `public.production_tasks` with `flow_id`, `flow_step_id`, `urgency`,
  `delay_minutes`, and `skip_reason`; the old order-item and product snapshot
  columns no longer exist.
- The current task table is unique by `(bakery_id, order_id, flow_step_id)`,
  so the online-order bridge needs a deterministic flow/step identity and must
  retain the function's existing idempotency behavior.
- `public.recipes` has a `bakery_id` owner and the repository already provides
  `private.is_bakery_member(uuid)` for current persisted membership checks, but
  the recipes migration omitted `enable row level security` and its policies.
- The existing database test style uses pgTAP, authenticated JWT claims,
  transaction rollback, and two-bakery denial assertions.

## Decisions

1. Create one new ordered migration through the Supabase CLI. It will
   `create or replace function private.create_online_order(...)` with the
   exact current function signature and task columns, and will enable RLS on
   `public.recipes` only after installing its membership-scoped policy.
2. Generate deterministic online task identifiers from the order-item
   identity, use the final task lifecycle fields, and preserve the existing
   order/idempotency checks. The implementation agent must verify the exact
   current schema and function grants before finalizing SQL.
3. Use the existing membership helper for an authenticated `recipes` policy
   with both `using` and `with check`, so reads and mutations are bounded by
   current membership and cannot be moved across bakeries by the browser.
4. Keep recipe access member-only. Public storefront operations continue to
   use their purpose-built published-product boundary and must not gain direct
   access to recipe cost fields.
5. Add pgTAP coverage in a separate test file. Tests will create only
   synthetic records inside a rollback transaction and will prove both
   positive and negative paths, including retry idempotency and cross-bakery
   recipe denial.

## Risks and Mitigations

- A function replacement can accidentally change its public contract. The
  migration must preserve the existing signature, return shape, security
  definer posture, empty search path, and supported grants; database tests
  will exercise the public checkout call.
- Enabling RLS without a complete policy can break legitimate recipe editing.
  Install the membership policy first, then enable RLS, and test member select
  and mutation paths before testing cross-bakery denial.
- A clean reset may reveal another historical schema/seed mismatch. Stop and
  report any unrelated failure rather than expanding this change or editing
  old migrations.
- Hosted migration state is outside this local corrective task. Only the
  local Docker database may be reset or mutated during verification.

## Integration Boundary

The migration agent owns the new SQL migration directory. The database-test
agent owns only the pgTAP test directory. The orchestrator owns local reset,
lint/advisor/type generation checks, frontend verification, OpenSpec updates,
and any integration correction after both agents finish.
