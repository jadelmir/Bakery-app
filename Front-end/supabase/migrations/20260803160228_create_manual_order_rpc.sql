-- Persist authenticated in-bakery orders atomically.

create or replace function public.create_manual_order(
  p_bakery_id uuid,
  p_order_id uuid,
  p_customer_id uuid,
  p_pickup_date date,
  p_pickup_time text,
  p_amount_paid_cents bigint default 0,
  p_notes text default null,
  p_items_json jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_recipe public.recipes%rowtype;
  v_item jsonb;
  v_recipe_id uuid;
  v_quantity numeric;
  v_unit_price_cents bigint;
  v_total_cents bigint := 0;
  v_payment_status text;
  v_existing public.orders%rowtype;
begin
  if not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_order_id is null then
    raise exception 'An order identifier is required.' using errcode = '22023';
  end if;

  if p_customer_id is null then
    raise exception 'A customer is required.' using errcode = '22023';
  end if;

  if p_pickup_date is null or nullif(btrim(coalesce(p_pickup_time, '')), '') is null then
    raise exception 'Pickup date and time are required.' using errcode = '22023';
  end if;

  if p_amount_paid_cents < 0 then
    raise exception 'Amount paid cannot be negative.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_items_json) <> 'array' or jsonb_array_length(p_items_json) = 0 then
    raise exception 'At least one order item is required.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.customers
    where id = p_customer_id and bakery_id = p_bakery_id
  ) then
    raise exception 'Customer does not belong to the active bakery.' using errcode = '23503';
  end if;

  select * into v_existing
  from public.orders
  where id = p_order_id;

  if found then
    if v_existing.bakery_id <> p_bakery_id then
      raise exception 'Order identifier belongs to another bakery.' using errcode = '42501';
    end if;

    return jsonb_build_object(
      'order_id', v_existing.id,
      'idempotent', true,
      'total_cents', v_existing.total_cents,
      'amount_paid_cents', v_existing.amount_paid_cents,
      'payment_status', v_existing.payment_status
    );
  end if;

  for v_item in select value from jsonb_array_elements(p_items_json)
  loop
    begin
      v_recipe_id := (v_item->>'recipe_id')::uuid;
      v_quantity := (v_item->>'quantity')::numeric;
      v_unit_price_cents := (v_item->>'unit_price_cents')::bigint;
    exception when others then
      raise exception 'Each order item must contain valid recipe_id, quantity, and unit_price_cents.'
        using errcode = '22023';
    end;

    if v_quantity is null or v_quantity <= 0 or v_unit_price_cents is null or v_unit_price_cents < 0 then
      raise exception 'Each order item needs a positive quantity and non-negative unit price.'
        using errcode = '22023';
    end if;

    select * into v_recipe
    from public.recipes
    where id = v_recipe_id and bakery_id = p_bakery_id;

    if not found then
      raise exception 'Recipe does not belong to the active bakery.' using errcode = '23503';
    end if;

    v_total_cents := v_total_cents + (v_quantity * v_unit_price_cents)::bigint;
  end loop;

  if p_amount_paid_cents > v_total_cents then
    raise exception 'Amount paid cannot exceed the order total.' using errcode = '22023';
  end if;

  v_payment_status := case
    when p_amount_paid_cents = 0 then 'unpaid'
    when p_amount_paid_cents = v_total_cents then 'paid'
    else 'partially-paid'
  end;

  insert into public.orders (
    id,
    bakery_id,
    customer_id,
    pickup_date,
    pickup_time,
    status,
    total_cents,
    amount_paid_cents,
    payment_status,
    notes,
    source
  )
  values (
    p_order_id,
    p_bakery_id,
    p_customer_id,
    p_pickup_date,
    p_pickup_time,
    'confirmed',
    v_total_cents,
    p_amount_paid_cents,
    v_payment_status,
    p_notes,
    'in-person'
  );

  for v_item in select value from jsonb_array_elements(p_items_json)
  loop
    v_recipe_id := (v_item->>'recipe_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price_cents := (v_item->>'unit_price_cents')::bigint;

    select * into v_recipe
    from public.recipes
    where id = v_recipe_id and bakery_id = p_bakery_id;

    insert into public.order_items (
      order_id,
      recipe_id,
      product_name,
      quantity,
      unit_price_cents,
      total_price_cents
    )
    values (
      p_order_id,
      v_recipe_id,
      v_recipe.name,
      v_quantity,
      v_unit_price_cents,
      (v_quantity * v_unit_price_cents)::bigint
    );
  end loop;

  perform public.generate_order_production_tasks(
    p_bakery_id,
    p_order_id::text,
    p_pickup_date
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'idempotent', false,
    'total_cents', v_total_cents,
    'amount_paid_cents', p_amount_paid_cents,
    'payment_status', v_payment_status
  );
end;
$$;

revoke all on function public.create_manual_order(uuid, uuid, uuid, date, text, bigint, text, jsonb) from public, anon;
grant execute on function public.create_manual_order(uuid, uuid, uuid, date, text, bigint, text, jsonb) to authenticated, service_role;
