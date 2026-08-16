-- Persist bakery recipe ingredient lines and provide an atomic authenticated save boundary.

alter table public.recipes
  alter column flow_id type text using flow_id::text;

create table public.recipe_ingredients (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  inventory_item_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_ingredients_pkey primary key (recipe_id, inventory_item_id)
);

create index recipe_ingredients_inventory_item_idx
  on public.recipe_ingredients (inventory_item_id);

create trigger recipe_ingredients_set_updated_at
  before update on public.recipe_ingredients
  for each row execute function private.set_updated_at();

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function private.set_updated_at();

alter table public.recipe_ingredients enable row level security;

create policy recipe_ingredients_members_all
  on public.recipe_ingredients for all to authenticated
  using (
    exists (
      select 1
      from public.recipes recipe
      join public.ingredients inventory_item
        on inventory_item.id = recipe_ingredients.inventory_item_id
       and inventory_item.bakery_id = recipe.bakery_id
      where recipe.id = recipe_ingredients.recipe_id
        and (select private.is_bakery_member(recipe.bakery_id))
    )
  )
  with check (
    exists (
      select 1
      from public.recipes recipe
      join public.ingredients inventory_item
        on inventory_item.id = recipe_ingredients.inventory_item_id
       and inventory_item.bakery_id = recipe.bakery_id
      where recipe.id = recipe_ingredients.recipe_id
        and (select private.is_bakery_member(recipe.bakery_id))
    )
  );

revoke all on table public.recipe_ingredients from anon, authenticated;
grant select, insert, update, delete on table public.recipe_ingredients to authenticated, service_role;

create or replace function public.save_recipe(
  p_bakery_id uuid,
  p_recipe_id uuid,
  p_name text,
  p_yield text,
  p_selling_price_cents bigint,
  p_flow_id text default null,
  p_ingredients_json jsonb default '[]'::jsonb
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
    flow_id
  )
  values (
    p_recipe_id,
    p_bakery_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_yield, '')), ''),
    v_batch_cost_cents,
    p_selling_price_cents,
    nullif(btrim(coalesce(p_flow_id, '')), '')
  )
  on conflict (id) do update set
    name = excluded.name,
    yield = excluded.yield,
    batch_cost_cents = excluded.batch_cost_cents,
    selling_price_cents = excluded.selling_price_cents,
    flow_id = excluded.flow_id,
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

revoke all on function public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb) to authenticated, service_role;
