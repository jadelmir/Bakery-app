# Stabilize Staging Data and Remove Runtime Mocks

## Problem

The deployed development application is connected to a staging Supabase project, but the repository's Supabase project is stored under `Front-end/supabase/` while the CI and staging deployment workflows execute Supabase CLI commands from the repository root and watch `supabase/**`. This means the schema/migrations are not reliably applied from the actual committed Supabase project, which can leave the staging database without the tables expected by the application.

The frontend also still contains prototype/mock runtime data. `Front-end/src/app/constants.ts` exports hard-coded customers, orders, tasks, recipes, and inventory, and `BakeryWorkspace` initializes runtime order state from those fixtures. A deployed authenticated application must not present synthetic customer/order records as if they were real persisted bakery data.

## Goal

Make the development/staging environment derive its database schema from the committed Supabase migrations and make deployed runtime screens render persisted Supabase data (or proper empty states), not prototype fixtures.

## Scope

- Correct CI and staging deployment paths/working directories so `Front-end/supabase` is the authoritative Supabase project.
- Ensure staging deployment applies all committed migrations before the frontend relies on the schema.
- Add verification that required application tables exist after migration/deployment.
- Remove prototype customer/order data from normal runtime paths.
- Audit other prototype fixtures (tasks, recipes, inventory) and prevent them from appearing in real Supabase-backed runtime flows; retain synthetic data only in tests, stories/fixtures, or an explicitly selected mock-development mode.
- Preserve empty-state UX when a real bakery has no customers/orders/etc.

## Non-goals

- Do not delete legitimate persisted staging/production user data.
- Do not expose service-role credentials to the frontend.
- Do not replace RLS/auth rules as part of this change unless a migration cannot be applied without a narrowly scoped correction.
- Do not remove test-only fixtures required by unit/E2E tests; isolate them from real runtime instead.

## Related OpenSpec Work

- `frontend-ci-cd`: remains the broader frontend deployment change; this corrective change focuses specifically on the Supabase project path/schema deployment contract and runtime data cleanliness.
- `clean-local-bakery-seed-state`: remains focused on local seed pollution and must not be duplicated here.

## OpenSpec Capabilities

- `deployment-playbook`
- `frontend-runtime-verification`
