# Task Ledger: Persist Starter Profiles & Inventory Movements (Phase B3 / B9 / B10)

## Workstream 1: Database Migration & RLS Security Policies
- [x] 1.1 Create SQL migration `Front-end/supabase/migrations/20260730180000_starter_and_inventory_movements.sql` creating `starter_profiles`, `starter_builds`, `inventory_transactions`, and `task_execution_logs`.
- [x] 1.2 Implement RLS security policies on all 4 tables scoped to `bakery_memberships`.
- [x] 1.3 Add foreign key constraints, indexes, and automated `updated_at` triggers.

## Workstream 2: Supabase Adapter & Unit Test Suite
- [x] 2.1 Build `Front-end/src/lib/supabase/starterInventoryAdapter.ts` for database CRUD operations on starter builds and inventory transactions.
- [x] 2.2 Add Vitest unit tests in `Front-end/src/lib/supabase/starterInventoryAdapter.test.ts`.
- [x] 2.3 Run typecheck and Vitest suite (`pnpm run typecheck && pnpm run test`).
