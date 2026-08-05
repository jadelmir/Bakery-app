# Proposal: Production Task Regeneration & Database Rescheduling Engine (Phase B8)

## Executive Summary
This change implements Phase B8 (Task Lifecycle & Regeneration Engine), establishing persistent database schema for `production_tasks`, RLS policies, and server-side Postgres functions for automatically generating, updating, and regenerating production schedule tasks when orders are created or modified without duplicate tasks or lost history.

## User Value & Use Cases
1. **Automated Order Task Generation**: When an order is placed (via storefront or admin order entry), the database engine automatically maps order items to recipe production flows and inserts scheduled tasks.
2. **Idempotent Schedule Regeneration**: Rescheduling orders or changing order quantities updates or regenerates tasks safely without leaving duplicate tasks or losing completed step execution records.
3. **Cross-Device Task Persistence**: Tasks, timers, and delay status sync across desktop and mobile devices via Supabase Realtime.

## Proposed Scope
- `Front-end/supabase/migrations/20260730190000_task_regeneration_engine.sql` `[NEW]`: SQL migration creating `production_tasks` table, RLS policies, indexes, and `private.generate_order_production_tasks` Postgres function.
- `Front-end/src/lib/supabase/taskRegenerationAdapter.ts` `[NEW]`: Supabase database adapter for fetching and regenerating production tasks.
- `Front-end/src/lib/supabase/taskRegenerationAdapter.test.ts` `[NEW]`: Vitest unit test suite for task regeneration mapping.

## Non-Goals
- Native mobile push notification dispatch (handled in future notification extensions).
