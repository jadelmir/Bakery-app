# Design: Clean Local Bakery Seed State

## Findings

- `Front-end/supabase/seed.sql` seeds one admin bakery, `J'adore Bakery`, and
  contains no `Runtime Check Bakery` text.
- `Front-end/src/app/workspace.ts` contains one default mock membership for
  `J'adore Bakery`; its alternate `empty` and `multiple` scenarios also do
  not contain the runtime-check name.
- A read-only local query found two `Runtime Check Bakery` rows at
  `2026-08-03T14:58:56Z` and `2026-08-03T14:59:14Z`, both owned by the seeded
  admin. This is persisted local test data, not committed seed or mock data.
- The latest committed migration is `20260803145416`; the runtime rows were
  created afterward and are not attributable to a seed migration.
- The first approved local reset exposed a separate committed-fixture issue:
  `seed.sql` used the older `production_tasks` columns `product_name`,
  `quantity`, and `instructions`, but the later task-regeneration migration
  replaces that table with `flow_id`, `flow_step_id`, `urgency`, and related
  columns. The reset must repair this seed/schema mismatch before seed
  verification can pass.

## Approach

1. Add a narrow mock regression assertion that the default mock admin
   membership set contains the seeded bakery and no runtime-check entry.
2. Add a local-only seed verification script and package command. It will
   query the admin's accessible memberships and fail unless the clean seed
   contains exactly `J'adore Bakery`; it will separately fail if any
   `Runtime Check Bakery` row exists. The script is a guard, not a data
   deletion mechanism.
3. Align the committed production-task seed rows with the final
   task-regeneration schema without editing historical migrations or adding a
   cleanup migration.
4. The orchestrator will run the repository's local reset command, which
   replays committed migrations and seed data. It will then run the
   verification script and manually exercise admin login.
5. The manual check will confirm that existing seeded membership appears
   before onboarding, that no extra runtime-check entry appears, and that a
   user-created bakery appears and becomes active without removing the seeded
   bakery.

## Safety and Boundaries

- The reset is intentionally limited to the local Docker Supabase instance;
  the linked reset command is prohibited.
- No name-based filtering will be introduced in `App.tsx` or the Supabase
  adapter, because the selector must display all memberships authorized for
  the current user.
- If a reset fails because of an unrelated migration or lint problem, stop and
  report it rather than deleting rows with ad-hoc SQL.
- Existing database lint findings remain separate: `public.recipes` has an
  RLS advisory, and `private.create_online_order` references the existing
  `production_tasks.order_item_id` mismatch. This change does not silently
  alter either issue.
