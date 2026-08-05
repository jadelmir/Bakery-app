# Design: Persist Starter Profiles & Inventory Movements (Phase B3 / B9 / B10)

## Schema Design

### 1. `starter_profiles` Table
- `id` uuid primary key default gen_random_uuid()
- `bakery_id` uuid references bakeries(id) on delete cascade
- `name` text not null (e.g., 'Levain Starter', 'Rye Preferment')
- `flour_ratio` numeric(5,2) not null
- `water_ratio` numeric(5,2) not null
- `seed_ratio` numeric(5,2) not null
- `build_duration_hours` numeric(4,1) not null default 8.0
- `is_default` boolean not null default false
- `created_at` timestamptz not null default now()

### 2. `starter_builds` Table
- `id` uuid primary key default gen_random_uuid()
- `bakery_id` uuid references bakeries(id) on delete cascade
- `profile_id` uuid references starter_profiles(id) on delete set null
- `target_date` date not null
- `seed_amount_g` numeric(10,2) not null
- `flour_amount_g` numeric(10,2) not null
- `water_amount_g` numeric(10,2) not null
- `total_build_g` numeric(10,2) not null
- `usable_amount_g` numeric(10,2) not null
- `retained_starter_g` numeric(10,2) not null
- `created_at` timestamptz not null default now()

### 3. `inventory_transactions` Table
- `id` uuid primary key default gen_random_uuid()
- `bakery_id` uuid references bakeries(id) on delete cascade
- `item_id` uuid references inventory_items(id) on delete cascade
- `transaction_type` text check (transaction_type in ('deduction', 'restock', 'adjustment'))
- `quantity_change` numeric(10,3) not null
- `unit_cost_cents` integer
- `invoice_reference` text
- `source_key` text
- `notes` text
- `created_at` timestamptz not null default now()

### 4. `task_execution_logs` Table
- `id` uuid primary key default gen_random_uuid()
- `bakery_id` uuid references bakeries(id) on delete cascade
- `task_id` text not null
- `action` text check (action in ('timer_start', 'timer_stop', 'delay', 'skip', 'complete'))
- `elapsed_seconds` integer default 0
- `delay_minutes` integer default 0
- `reason` text
- `created_at` timestamptz not null default now()

## RLS Security Policies
All 4 tables will enforce RLS:
- SELECT / INSERT / UPDATE / DELETE restricted to active `bakery_memberships` for `auth.uid()`.
