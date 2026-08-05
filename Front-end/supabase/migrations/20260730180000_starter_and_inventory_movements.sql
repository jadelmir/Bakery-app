-- Starter Profiles, Starter Builds, Inventory Transactions, and Task Execution Logs Schema (Phase B3 / B9 / B10)

-- 1. Create Tables

create table if not exists public.starter_profiles (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  name text not null,
  flour_ratio numeric(5,2) not null,
  water_ratio numeric(5,2) not null,
  seed_ratio numeric(5,2) not null,
  build_duration_hours numeric(4,1) not null default 8.0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.starter_builds (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  profile_id uuid references public.starter_profiles(id) on delete set null,
  target_date date not null,
  seed_amount_g numeric(10,2) not null,
  flour_amount_g numeric(10,2) not null,
  water_amount_g numeric(10,2) not null,
  total_build_g numeric(10,2) not null,
  usable_amount_g numeric(10,2) not null,
  retained_starter_g numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  item_id uuid references public.ingredients(id) on delete cascade,
  transaction_type text check (transaction_type in ('deduction', 'restock', 'adjustment')),
  quantity_change numeric(10,3) not null,
  unit_cost_cents integer,
  invoice_reference text,
  source_key text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.task_execution_logs (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  task_id text not null,
  action text check (action in ('timer_start', 'timer_stop', 'delay', 'skip', 'complete')),
  elapsed_seconds integer default 0,
  delay_minutes integer default 0,
  reason text,
  created_at timestamptz not null default now()
);

-- 2. Indexes

create index if not exists starter_profiles_bakery_id_idx on public.starter_profiles (bakery_id);

create index if not exists starter_builds_bakery_id_idx on public.starter_builds (bakery_id);
create index if not exists starter_builds_target_date_idx on public.starter_builds (target_date);
create index if not exists starter_builds_profile_id_idx on public.starter_builds (profile_id);

create index if not exists inventory_transactions_bakery_id_idx on public.inventory_transactions (bakery_id);
create index if not exists inventory_transactions_item_id_idx on public.inventory_transactions (item_id);

create index if not exists task_execution_logs_bakery_id_idx on public.task_execution_logs (bakery_id);
create index if not exists task_execution_logs_task_id_idx on public.task_execution_logs (task_id);

-- 3. Triggers

create trigger starter_profiles_set_updated_at
  before update on public.starter_profiles
  for each row execute function private.set_updated_at();

-- 4. Row Level Security (RLS)

alter table public.starter_profiles enable row level security;
alter table public.starter_builds enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.task_execution_logs enable row level security;

-- Starter Profiles policies
create policy starter_profiles_select_members
  on public.starter_profiles for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy starter_profiles_insert_members
  on public.starter_profiles for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy starter_profiles_update_members
  on public.starter_profiles for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy starter_profiles_delete_members
  on public.starter_profiles for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- Starter Builds policies
create policy starter_builds_select_members
  on public.starter_builds for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy starter_builds_insert_members
  on public.starter_builds for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy starter_builds_update_members
  on public.starter_builds for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy starter_builds_delete_members
  on public.starter_builds for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- Inventory Transactions policies
create policy inventory_transactions_select_members
  on public.inventory_transactions for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy inventory_transactions_insert_members
  on public.inventory_transactions for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy inventory_transactions_update_members
  on public.inventory_transactions for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy inventory_transactions_delete_members
  on public.inventory_transactions for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- Task Execution Logs policies
create policy task_execution_logs_select_members
  on public.task_execution_logs for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy task_execution_logs_insert_members
  on public.task_execution_logs for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy task_execution_logs_update_members
  on public.task_execution_logs for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy task_execution_logs_delete_members
  on public.task_execution_logs for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- 5. Grants

grant select, insert, update, delete on public.starter_profiles to authenticated;
grant select, insert, update, delete on public.starter_builds to authenticated;
grant select, insert, update, delete on public.inventory_transactions to authenticated;
grant select, insert, update, delete on public.task_execution_logs to authenticated;
