# Design: Production Task Regeneration & Database Rescheduling Engine (Phase B8)

## Database Schema & Functions

### `production_tasks` Table
- `id` uuid primary key default gen_random_uuid()
- `bakery_id` uuid references bakeries(id) on delete cascade
- `order_id` text not null
- `recipe_id` text
- `flow_id` text
- `flow_step_id` text
- `title` text not null
- `category` text not null check (category in ('prep', 'starter', 'mixing', 'shaping', 'ferment', 'baking', 'packaging'))
- `status` text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'skipped'))
- `scheduled_at` timestamptz not null
- `duration_minutes` integer not null default 30
- `urgency` text default 'normal' check (urgency in ('normal', 'urgent', 'overdue', 'due-now'))
- `delay_minutes` integer default 0
- `skip_reason` text
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Postgres Function `private.generate_order_production_tasks`
- **Inputs**: `p_bakery_id uuid`, `p_order_id text`, `p_fulfillment_date date`
- **Behavior**:
  1. Locates order items and linked recipe production flows.
  2. For each flow step, calculates target scheduled time (`p_fulfillment_date` - `day_offset` + `step_time`).
  3. Inserts or updates tasks in `production_tasks` using `(bakery_id, order_id, flow_step_id)` composite key to guarantee idempotency.
  4. Preserves completed tasks so history is never overwritten.

## RLS Security Policies
- Scoped to active `bakery_memberships` using `private.is_bakery_member(bakery_id)`.
