-- Create inventory items and their optional opening balances atomically.

create or replace function public.create_inventory_item(
  p_bakery_id uuid,
  p_item_id uuid,
  p_name text,
  p_unit text,
  p_package_quantity numeric,
  p_package_price numeric,
  p_min_level numeric,
  p_kind text,
  p_initial_on_hand numeric default 0,
  p_operation_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_item public.ingredients%rowtype;
  v_existing public.inventory_transactions%rowtype;
  v_transaction_id uuid;
  v_unit_cost_cents numeric(18, 6);
  v_source_key text;
  v_fingerprint text;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_item_id is null
    or nullif(btrim(coalesce(p_name, '')), '') is null
    or p_unit not in ('g', 'ml', 'unit')
    or p_kind not in ('ingredient', 'packaging')
    or p_package_quantity is null or p_package_quantity <= 0
    or p_package_price is null or p_package_price < 0
    or p_min_level is null or p_min_level < 0
    or p_initial_on_hand is null or p_initial_on_hand < 0
    or nullif(btrim(coalesce(p_operation_id, '')), '') is null
  then
    raise exception 'A valid item, package definition, minimum level, opening balance, and operation ID are required.'
      using errcode = '22023';
  end if;

  v_source_key := 'opening-balance:' || p_item_id::text;
  v_fingerprint := md5(jsonb_build_object(
    'item_id', p_item_id,
    'name', btrim(p_name),
    'unit', p_unit,
    'package_quantity', p_package_quantity,
    'package_price', p_package_price,
    'min_level', p_min_level,
    'kind', p_kind,
    'initial_on_hand', p_initial_on_hand,
    'operation_id', btrim(p_operation_id)
  )::text);
  v_unit_cost_cents := round((p_package_price / p_package_quantity) * 100, 6);

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':create-inventory:' || p_item_id::text, 0
  ));

  select * into v_item
  from public.ingredients item
  where item.bakery_id = p_bakery_id and item.id = p_item_id
  for update;

  if found then
    if v_item.name is distinct from btrim(p_name)
      or v_item.unit is distinct from p_unit
      or v_item.package_quantity is distinct from p_package_quantity
      or v_item.package_price is distinct from p_package_price
      or v_item.min_level is distinct from p_min_level
      or v_item.kind is distinct from p_kind
    then
      raise exception 'Inventory item ID was already used with different item inputs.'
        using errcode = '23505';
    end if;

    select * into v_existing
    from public.inventory_transactions transaction
    where transaction.bakery_id = p_bakery_id
      and transaction.item_id = p_item_id
      and transaction.source_key = v_source_key
      and transaction.transaction_type = 'opening_balance'
      and transaction.is_legacy = false;

    if found and v_existing.request_fingerprint is distinct from v_fingerprint then
      raise exception 'Opening balance source key was already used with different item inputs.'
        using errcode = '23505';
    end if;

    if p_initial_on_hand > 0 and not found then
      raise exception 'Inventory item ID was already used without the requested opening balance.'
        using errcode = '23505';
    end if;

    return jsonb_build_object(
      'item_id', v_item.id,
      'transaction_id', v_existing.id,
      'on_hand', v_item.on_hand,
      'idempotent', true
    );
  end if;

  insert into public.ingredients (
    id, bakery_id, name, unit, package_quantity, package_price, min_level,
    kind, on_hand, average_unit_cost_cents
  ) values (
    p_item_id, p_bakery_id, btrim(p_name), p_unit, p_package_quantity,
    p_package_price, p_min_level, p_kind, p_initial_on_hand, v_unit_cost_cents
  ) returning * into v_item;

  if p_initial_on_hand > 0 then
    insert into public.inventory_transactions (
      bakery_id, item_id, transaction_type, quantity_change, base_unit,
      unit_cost_cents, total_cost_cents, actor_id, source_key, source_type,
      source_id, request_fingerprint, notes, affects_financials, is_legacy,
      metadata
    ) values (
      p_bakery_id, p_item_id, 'opening_balance', p_initial_on_hand, p_unit,
      v_unit_cost_cents,
      round(p_initial_on_hand * v_unit_cost_cents, 2),
      v_actor_id, v_source_key, 'inventory_creation', btrim(p_operation_id),
      v_fingerprint, 'Opening balance entered during item creation', false,
      false, jsonb_build_object('operation_id', btrim(p_operation_id))
    ) returning id into v_transaction_id;
  end if;

  return jsonb_build_object(
    'item_id', v_item.id,
    'transaction_id', v_transaction_id,
    'on_hand', v_item.on_hand,
    'idempotent', false
  );
end;
$$;

revoke all on function public.create_inventory_item(
  uuid, uuid, text, text, numeric, numeric, numeric, text, numeric, text
) from public, anon;
grant execute on function public.create_inventory_item(
  uuid, uuid, text, text, numeric, numeric, numeric, text, numeric, text
) to authenticated;
