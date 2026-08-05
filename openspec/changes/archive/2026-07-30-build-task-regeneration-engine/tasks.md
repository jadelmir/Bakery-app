# Task Ledger: Production Task Regeneration & Database Rescheduling Engine (Phase B8)

## Workstream 1: Database Migration & Postgres Functions
- [x] 1.1 Create SQL migration `Front-end/supabase/migrations/20260730190000_task_regeneration_engine.sql` creating `production_tasks` table and `private.generate_order_production_tasks` Postgres function.
- [x] 1.2 Implement RLS policies on `production_tasks` scoped to `bakery_memberships`.
- [x] 1.3 Add foreign key constraints, indexes on `(bakery_id, order_id, flow_step_id)`, and `updated_at` triggers.

## Workstream 2: Supabase Adapter & Unit Test Suite
- [x] 2.1 Build `Front-end/src/lib/supabase/taskRegenerationAdapter.ts` providing CRUD and RPC invocation functions for production tasks.
- [x] 2.2 Add Vitest unit tests in `Front-end/src/lib/supabase/taskRegenerationAdapter.test.ts`.
- [x] 2.3 Run typecheck and Vitest suite (`pnpm run typecheck && pnpm run test`).
