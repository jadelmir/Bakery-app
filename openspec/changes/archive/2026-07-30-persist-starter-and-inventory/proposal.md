# Proposal: Persist Starter Profiles & Inventory Movements (Phase B3 / B9 / B10)

## Executive Summary
This change establishes persistent database tables, RLS security policies, and Supabase client integration for Starter Build Profiles (`starter_profiles`, `starter_builds`), Inventory Transactions (`inventory_transactions`), and Task Execution Logs (`task_execution_logs`) in Supabase Postgres.

## User Value & Use Cases
1. **Durable Inventory Audit Log**: Every ingredient deduction, restock shipment, and stock count adjustment is stored durably in `inventory_transactions` linked to `bakery_id`, item, source task/invoice, unit cost, and timestamp.
2. **Starter Build Persistence**: Bakery starter profiles (hydration %, seed ratio, build hours) and daily build records are persisted per bakery workspace instead of residing only in memory.
3. **Multi-Device Live Sync**: Inventory balances and starter builds sync live across desktop and mobile devices via Supabase Realtime/Postgres.

## Proposed Scope
- `Front-end/supabase/migrations/20260730180000_starter_and_inventory_movements.sql` `[NEW]`: SQL migration creating `starter_profiles`, `starter_builds`, `inventory_transactions`, `task_execution_logs` with RLS policies scoped to `bakery_memberships`.
- `Front-end/src/lib/supabase/starterInventoryAdapter.ts` `[NEW]`: Supabase database adapter for fetching and inserting starter builds, inventory transactions, and task execution logs.
- `Front-end/src/lib/supabase/starterInventoryAdapter.test.ts` `[NEW]`: Vitest test suite for database operations.

## Non-Goals
- Third-party ERP / QuickBooks accounting sync (handled in future integrations).
