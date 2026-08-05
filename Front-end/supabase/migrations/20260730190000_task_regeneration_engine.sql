-- Production Task Regeneration & Database Rescheduling Engine (Phase B8)

-- 1. Re-create production_tasks table with full schema and constraints
drop table if exists public.production_tasks cascade;

create table public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  recipe_id text,
  flow_id text,
  flow_step_id text,
  title text not null,
  category text not null check (category in ('prep', 'starter', 'mixing', 'shaping', 'ferment', 'baking', 'packaging')),
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'skipped')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes >= 0),
  urgency text default 'normal' check (urgency in ('normal', 'urgent', 'overdue', 'due-now')),
  delay_minutes integer default 0,
  skip_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_tasks_bakery_order_flow_step_key unique (bakery_id, order_id, flow_step_id)
);

-- 2. Indexes
create index production_tasks_bakery_id_idx on public.production_tasks (bakery_id);
create index production_tasks_order_id_idx on public.production_tasks (order_id);
create index production_tasks_scheduled_at_idx on public.production_tasks (scheduled_at);
create index production_tasks_status_idx on public.production_tasks (status);

-- 3. Triggers
create trigger production_tasks_set_updated_at
  before update on public.production_tasks
  for each row execute function private.set_updated_at();

-- 4. Row Level Security & Policies
alter table public.production_tasks enable row level security;

create policy production_tasks_select_members
  on public.production_tasks for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy production_tasks_insert_members
  on public.production_tasks for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy production_tasks_update_members
  on public.production_tasks for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy production_tasks_delete_members
  on public.production_tasks for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

grant select, insert, update, delete on public.production_tasks to authenticated, service_role;

-- 5. Postgres Task Generation & Rescheduling Function
create or replace function private.generate_order_production_tasks(
  p_bakery_id uuid,
  p_order_id text,
  p_fulfillment_date date
)
returns setof public.production_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_uuid uuid;
  v_item record;
begin
  -- Security check: caller must be member of bakery
  if not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  -- Parse order UUID safely if valid format
  begin
    v_order_uuid := p_order_id::uuid;
  exception when others then
    v_order_uuid := null;
  end;

  -- Update order pickup date if order exists
  if v_order_uuid is not null then
    update public.orders
    set pickup_date = p_fulfillment_date,
        updated_at = now()
    where id = v_order_uuid and bakery_id = p_bakery_id;
  end if;

  -- Recalculate scheduled dates for pending tasks linked to this order
  if v_order_uuid is not null then
    update public.production_tasks
    set scheduled_at = (p_fulfillment_date::timestamp + (scheduled_at::time))::timestamptz,
        updated_at = now()
    where bakery_id = p_bakery_id
      and order_id = v_order_uuid
      and status = 'pending';
  end if;

  -- Insert/update production steps for items in the order
  if v_order_uuid is not null then
    for v_item in
      select oi.id, oi.product_name, oi.recipe_id
      from public.order_items oi
      where oi.order_id = v_order_uuid
    loop
      -- Mix step
      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category, status,
        scheduled_at, duration_minutes, urgency, delay_minutes, skip_reason
      )
      values (
        p_bakery_id,
        v_order_uuid,
        v_item.recipe_id::text,
        'flow_' || v_item.id::text,
        'step_mix_' || v_item.id::text,
        'Mix ' || v_item.product_name,
        'mixing',
        'pending',
        (p_fulfillment_date::timestamp + interval '6 hours')::timestamptz,
        45,
        'normal',
        0,
        null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set scheduled_at = excluded.scheduled_at,
          title = excluded.title,
          category = excluded.category,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';

      -- Bake step
      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category, status,
        scheduled_at, duration_minutes, urgency, delay_minutes, skip_reason
      )
      values (
        p_bakery_id,
        v_order_uuid,
        v_item.recipe_id::text,
        'flow_' || v_item.id::text,
        'step_bake_' || v_item.id::text,
        'Bake ' || v_item.product_name,
        'baking',
        'pending',
        (p_fulfillment_date::timestamp + interval '9 hours')::timestamptz,
        60,
        'normal',
        0,
        null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set scheduled_at = excluded.scheduled_at,
          title = excluded.title,
          category = excluded.category,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';

      -- Package step
      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category, status,
        scheduled_at, duration_minutes, urgency, delay_minutes, skip_reason
      )
      values (
        p_bakery_id,
        v_order_uuid,
        v_item.recipe_id::text,
        'flow_' || v_item.id::text,
        'step_pack_' || v_item.id::text,
        'Package ' || v_item.product_name,
        'packaging',
        'pending',
        (p_fulfillment_date::timestamp + interval '11 hours')::timestamptz,
        30,
        'normal',
        0,
        null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set scheduled_at = excluded.scheduled_at,
          title = excluded.title,
          category = excluded.category,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';
    end loop;
  end if;

  -- Return updated task list for order
  return query
  select *
  from public.production_tasks
  where bakery_id = p_bakery_id
    and (v_order_uuid is null or order_id = v_order_uuid)
  order by scheduled_at asc;
end;
$$;

create or replace function public.generate_order_production_tasks(
  p_bakery_id uuid,
  p_order_id text,
  p_fulfillment_date date
)
returns setof public.production_tasks
language sql
security invoker
set search_path = ''
as $$
  select * from private.generate_order_production_tasks(p_bakery_id, p_order_id, p_fulfillment_date);
$$;

revoke all on function private.generate_order_production_tasks(uuid, text, date) from public, anon;
grant execute on function private.generate_order_production_tasks(uuid, text, date) to authenticated, service_role;

revoke all on function public.generate_order_production_tasks(uuid, text, date) from public, anon;
grant execute on function public.generate_order_production_tasks(uuid, text, date) to authenticated, service_role;
