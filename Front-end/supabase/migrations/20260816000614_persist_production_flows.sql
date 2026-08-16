-- Persist bakery-owned production flows while preserving the string IDs used by
-- the existing frontend scheduler and production task rows.

create table public.production_flows (
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  id text not null,
  name text not null,
  recipe text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_flows_pkey primary key (bakery_id, id),
  constraint production_flows_id_not_blank check (char_length(btrim(id)) > 0),
  constraint production_flows_name_not_blank check (char_length(btrim(name)) > 0)
);

create table public.production_flow_steps (
  bakery_id uuid not null,
  flow_id text not null,
  id text not null,
  name text not null,
  instructions text not null default '',
  category text not null,
  day_offset integer not null default 0,
  step_time text not null default '09:00',
  duration_minutes integer not null default 0,
  enabled boolean not null default true,
  groupable boolean not null default false,
  depends_on text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_flow_steps_pkey primary key (bakery_id, flow_id, id),
  constraint production_flow_steps_flow_fkey foreign key (bakery_id, flow_id)
    references public.production_flows (bakery_id, id) on delete cascade,
  constraint production_flow_steps_dependency_fkey foreign key (bakery_id, flow_id, depends_on)
    references public.production_flow_steps (bakery_id, flow_id, id) on delete restrict,
  constraint production_flow_steps_id_not_blank check (char_length(btrim(id)) > 0),
  constraint production_flow_steps_name_not_blank check (char_length(btrim(name)) > 0),
  constraint production_flow_steps_category_not_blank check (char_length(btrim(category)) > 0),
  constraint production_flow_steps_day_offset_check check (day_offset between -365 and 365),
  constraint production_flow_steps_time_format_check check (step_time ~ '^[0-9]{2}:[0-9]{2}$'),
  constraint production_flow_steps_duration_check check (duration_minutes >= 0),
  constraint production_flow_steps_sort_order_check check (sort_order >= 0)
);

create index production_flows_bakery_updated_idx
  on public.production_flows (bakery_id, updated_at desc);
create index production_flow_steps_bakery_flow_order_idx
  on public.production_flow_steps (bakery_id, flow_id, sort_order);

create trigger production_flows_set_updated_at
  before update on public.production_flows
  for each row execute function private.set_updated_at();

create trigger production_flow_steps_set_updated_at
  before update on public.production_flow_steps
  for each row execute function private.set_updated_at();

alter table public.production_flows enable row level security;
alter table public.production_flow_steps enable row level security;

create policy production_flows_members_all
  on public.production_flows for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy production_flow_steps_members_all
  on public.production_flow_steps for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

grant select, insert, update, delete
  on table public.production_flows, public.production_flow_steps
  to authenticated, service_role;
revoke all on table public.production_flows, public.production_flow_steps from anon;

create or replace function public.save_production_flow(
  p_bakery_id uuid,
  p_flow jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  v_flow_id text;
  v_flow_name text;
  v_result jsonb;
begin
  if not (select private.is_bakery_member(p_bakery_id)) then
    raise exception 'The active user is not a member of this bakery.' using errcode = '42501';
  end if;

  v_flow_id := nullif(btrim(p_flow ->> 'id'), '');
  v_flow_name := nullif(btrim(p_flow ->> 'name'), '');

  if v_flow_id is null then
    raise exception 'A production flow ID is required.' using errcode = '22023';
  end if;
  if v_flow_name is null then
    raise exception 'A production flow name is required.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_flow -> 'steps') is not null and jsonb_typeof(p_flow -> 'steps') <> 'array' then
    raise exception 'Production flow steps must be an array.' using errcode = '22023';
  end if;

  insert into public.production_flows (bakery_id, id, name, recipe, is_default)
  values (
    p_bakery_id,
    v_flow_id,
    v_flow_name,
    coalesce(p_flow ->> 'recipe', ''),
    coalesce((p_flow ->> 'isDefault')::boolean, false)
  )
  on conflict (bakery_id, id) do update
    set name = excluded.name,
        recipe = excluded.recipe,
        is_default = excluded.is_default;

  delete from public.production_flow_steps
  where bakery_id = p_bakery_id and flow_id = v_flow_id;

  insert into public.production_flow_steps (
    bakery_id,
    flow_id,
    id,
    name,
    instructions,
    category,
    day_offset,
    step_time,
    duration_minutes,
    enabled,
    groupable,
    depends_on,
    sort_order
  )
  select
    p_bakery_id,
    v_flow_id,
    nullif(btrim(step_data.value ->> 'id'), ''),
    nullif(btrim(step_data.value ->> 'name'), ''),
    coalesce(step_data.value ->> 'instructions', ''),
    coalesce(nullif(btrim(step_data.value ->> 'category'), ''), 'prep'),
    coalesce((step_data.value ->> 'dayOffset')::integer, 0),
    coalesce(nullif(step_data.value ->> 'time', ''), '09:00'),
    coalesce((step_data.value ->> 'duration')::integer, 0),
    coalesce((step_data.value ->> 'enabled')::boolean, true),
    coalesce((step_data.value ->> 'groupable')::boolean, false),
    nullif(btrim(step_data.value ->> 'dependsOn'), ''),
    (step_data.ordinality - 1)::integer
  from jsonb_array_elements(coalesce(p_flow -> 'steps', '[]'::jsonb)) with ordinality as step_data(value, ordinality);

  select jsonb_build_object(
    'id', flow.id,
    'name', flow.name,
    'recipe', flow.recipe,
    'isDefault', flow.is_default,
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', step.id,
        'name', step.name,
        'instructions', step.instructions,
        'dayOffset', step.day_offset,
        'time', step.step_time,
        'duration', step.duration_minutes,
        'category', step.category,
        'enabled', step.enabled,
        'groupable', step.groupable,
        'dependsOn', step.depends_on
      ) order by step.sort_order)
      from public.production_flow_steps step
      where step.bakery_id = flow.bakery_id and step.flow_id = flow.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.production_flows flow
  where flow.bakery_id = p_bakery_id and flow.id = v_flow_id;

  return v_result;
end;
$$;

create or replace function public.delete_production_flow(
  p_bakery_id uuid,
  p_flow_id text
)
returns boolean
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  v_deleted boolean;
begin
  if not (select private.is_bakery_member(p_bakery_id)) then
    raise exception 'The active user is not a member of this bakery.' using errcode = '42501';
  end if;

  delete from public.production_flows
  where bakery_id = p_bakery_id and id = nullif(btrim(p_flow_id), '')
  returning true into v_deleted;

  return coalesce(v_deleted, false);
end;
$$;

revoke execute on function public.save_production_flow(uuid, jsonb) from public, anon;
revoke execute on function public.delete_production_flow(uuid, text) from public, anon;
grant execute on function public.save_production_flow(uuid, jsonb) to authenticated, service_role;
grant execute on function public.delete_production_flow(uuid, text) to authenticated, service_role;
