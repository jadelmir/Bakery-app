-- Aggregate production work by recipe, so one order for five loaves creates
-- one recipe plan with quantity five instead of one plan per line-item copy.

alter table public.production_tasks
  add column if not exists quantity numeric not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'production_tasks_quantity_positive'
      and conrelid = 'public.production_tasks'::regclass
  ) then
    alter table public.production_tasks
      add constraint production_tasks_quantity_positive check (quantity > 0);
  end if;
end;
$$;

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
  v_plan_key text;
  v_flow_id text;
  v_mix_step_id text;
  v_bake_step_id text;
  v_pack_step_id text;
begin
  if not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  begin
    v_order_uuid := p_order_id::uuid;
  exception when others then
    v_order_uuid := null;
  end;

  if v_order_uuid is not null then
    update public.orders
    set pickup_date = p_fulfillment_date,
        updated_at = now()
    where id = v_order_uuid and bakery_id = p_bakery_id;

    -- Remove tasks created by the previous per-line-item generator. New tasks
    -- use recipe-stable keys, so retries update one plan rather than append it.
    delete from public.production_tasks
    where bakery_id = p_bakery_id
      and order_id = v_order_uuid
      and (
        flow_step_id like 'step_mix_%'
        or flow_step_id like 'step_bake_%'
        or flow_step_id like 'step_pack_%'
      );

    update public.production_tasks
    set scheduled_at = (p_fulfillment_date::timestamp + (scheduled_at::time))::timestamptz,
        updated_at = now()
    where bakery_id = p_bakery_id
      and order_id = v_order_uuid
      and status = 'pending';
  end if;

  if v_order_uuid is not null then
    for v_item in
      select oi.recipe_id,
             max(oi.product_name) as product_name,
             sum(oi.quantity)::numeric as quantity
      from public.order_items oi
      where oi.order_id = v_order_uuid
      group by oi.recipe_id
    loop
      v_plan_key := coalesce(v_item.recipe_id::text, md5(v_item.product_name));
      v_flow_id := 'flow_manual_' || v_plan_key;
      v_mix_step_id := 'mix:' || v_plan_key;
      v_bake_step_id := 'bake:' || v_plan_key;
      v_pack_step_id := 'package:' || v_plan_key;

      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category,
        status, quantity, scheduled_at, duration_minutes, urgency, delay_minutes,
        skip_reason
      )
      values (
        p_bakery_id, v_order_uuid, v_item.recipe_id::text, v_flow_id, v_mix_step_id,
        'Mix ' || v_item.product_name, 'mixing', 'pending', v_item.quantity,
        (p_fulfillment_date::timestamp + interval '6 hours')::timestamptz,
        45, 'normal', 0, null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set recipe_id = excluded.recipe_id,
          flow_id = excluded.flow_id,
          title = excluded.title,
          category = excluded.category,
          quantity = excluded.quantity,
          scheduled_at = excluded.scheduled_at,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';

      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category,
        status, quantity, scheduled_at, duration_minutes, urgency, delay_minutes,
        skip_reason
      )
      values (
        p_bakery_id, v_order_uuid, v_item.recipe_id::text, v_flow_id, v_bake_step_id,
        'Bake ' || v_item.product_name, 'baking', 'pending', v_item.quantity,
        (p_fulfillment_date::timestamp + interval '9 hours')::timestamptz,
        60, 'normal', 0, null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set recipe_id = excluded.recipe_id,
          flow_id = excluded.flow_id,
          title = excluded.title,
          category = excluded.category,
          quantity = excluded.quantity,
          scheduled_at = excluded.scheduled_at,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';

      insert into public.production_tasks (
        bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category,
        status, quantity, scheduled_at, duration_minutes, urgency, delay_minutes,
        skip_reason
      )
      values (
        p_bakery_id, v_order_uuid, v_item.recipe_id::text, v_flow_id, v_pack_step_id,
        'Package ' || v_item.product_name, 'packaging', 'pending', v_item.quantity,
        (p_fulfillment_date::timestamp + interval '11 hours')::timestamptz,
        30, 'normal', 0, null
      )
      on conflict (bakery_id, order_id, flow_step_id) do update
      set recipe_id = excluded.recipe_id,
          flow_id = excluded.flow_id,
          title = excluded.title,
          category = excluded.category,
          quantity = excluded.quantity,
          scheduled_at = excluded.scheduled_at,
          duration_minutes = excluded.duration_minutes,
          updated_at = now()
      where public.production_tasks.status = 'pending';
    end loop;
  end if;

  return query
  select *
  from public.production_tasks
  where bakery_id = p_bakery_id
    and (v_order_uuid is null or order_id = v_order_uuid)
  order by scheduled_at asc;
end;
$$;
