-- Recipe-level preparation timing for the derived Prep List.

alter table public.recipes
  add column if not exists prep_lead_days integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recipes_prep_lead_days_nonnegative'
      and conrelid = 'public.recipes'::regclass
  ) then
    alter table public.recipes
      add constraint recipes_prep_lead_days_nonnegative
      check (prep_lead_days >= 0);
  end if;
end;
$$;

-- Replace the existing RPC so recipe timing is persisted atomically with the
-- recipe and its material lines. The old signature is removed to avoid an
-- ambiguous overloaded save boundary for clients.
drop function if exists public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb);

create or replace function public.save_recipe(
  p_bakery_id uuid,
  p_recipe_id uuid,
  p_name text,
  p_yield text,
  p_selling_price_cents bigint,
  p_flow_id text default null,
  p_ingredients_json jsonb default '[]'::jsonb,
  p_prep_lead_days integer default 1
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.recipes%rowtype;
  v_recipe public.recipes%rowtype;
  v_item jsonb;
  v_inventory_item public.ingredients%rowtype;
  v_inventory_item_id uuid;
  v_quantity numeric;
  v_batch_cost_cents bigint := 0;
  v_ingredients jsonb;
begin
  if not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_recipe_id is null then
    raise exception 'A recipe identifier is required.' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'Recipe name is required.' using errcode = '22023';
  end if;

  if p_selling_price_cents is null or p_selling_price_cents < 0 then
    raise exception 'Selling price cannot be negative.' using errcode = '22023';
  end if;

  if p_prep_lead_days is null or p_prep_lead_days < 0 then
    raise exception 'Preparation lead time cannot be negative.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_ingredients_json, '[]'::jsonb)) <> 'array' then
    raise exception 'Recipe ingredients must be a JSON array.' using errcode = '22023';
  end if;

  select * into v_existing
  from public.recipes
  where id = p_recipe_id;

  if found and v_existing.bakery_id <> p_bakery_id then
    raise exception 'Recipe identifier belongs to another bakery.' using errcode = '42501';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_ingredients_json, '[]'::jsonb))
  loop
    begin
      v_inventory_item_id := (v_item->>'inventory_item_id')::uuid;
      v_quantity := (v_item->>'quantity')::numeric;
    exception when others then
      raise exception 'Each recipe ingredient must contain a valid inventory_item_id and quantity.'
        using errcode = '22023';
    end;

    if v_inventory_item_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'Each recipe ingredient needs a valid inventory item and positive quantity.'
        using errcode = '22023';
    end if;

    select * into v_inventory_item
    from public.ingredients
    where id = v_inventory_item_id
      and bakery_id = p_bakery_id
      and coalesce(archived, false) = false;

    if not found then
      raise exception 'Recipe ingredient does not belong to the active bakery.' using errcode = '23503';
    end if;

    v_batch_cost_cents := v_batch_cost_cents
      + round(v_quantity * coalesce(v_inventory_item.cost_per_unit, 0) * 100)::bigint;
  end loop;

  insert into public.recipes (
    id,
    bakery_id,
    name,
    yield,
    batch_cost_cents,
    selling_price_cents,
    flow_id,
    prep_lead_days
  )
  values (
    p_recipe_id,
    p_bakery_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_yield, '')), ''),
    v_batch_cost_cents,
    p_selling_price_cents,
    nullif(btrim(coalesce(p_flow_id, '')), ''),
    p_prep_lead_days
  )
  on conflict (id) do update set
    name = excluded.name,
    yield = excluded.yield,
    batch_cost_cents = excluded.batch_cost_cents,
    selling_price_cents = excluded.selling_price_cents,
    flow_id = excluded.flow_id,
    prep_lead_days = excluded.prep_lead_days,
    updated_at = now()
  where public.recipes.bakery_id = p_bakery_id
  returning * into v_recipe;

  if v_recipe.id is null then
    raise exception 'Recipe could not be saved.' using errcode = '42501';
  end if;

  delete from public.recipe_ingredients
  where recipe_id = p_recipe_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_ingredients_json, '[]'::jsonb))
  loop
    insert into public.recipe_ingredients (recipe_id, inventory_item_id, quantity)
    values (
      p_recipe_id,
      (v_item->>'inventory_item_id')::uuid,
      (v_item->>'quantity')::numeric
    );
  end loop;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'inventory_item_id', relation.inventory_item_id,
        'quantity', relation.quantity,
        'cost', round(relation.quantity * coalesce(inventory_item.cost_per_unit, 0), 4)
      ) order by relation.inventory_item_id
    ),
    '[]'::jsonb
  )
  into v_ingredients
  from public.recipe_ingredients relation
  join public.ingredients inventory_item on inventory_item.id = relation.inventory_item_id
  where relation.recipe_id = p_recipe_id;

  return jsonb_build_object(
    'recipe', to_jsonb(v_recipe),
    'ingredients', v_ingredients
  );
end;
$$;

revoke all on function public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb, integer) from public, anon;
grant execute on function public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb, integer) to authenticated, service_role;
