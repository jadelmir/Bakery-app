-- Repair public checkout's production-task insert after the task schema rebuild,
-- and protect bakery-owned recipes with membership-scoped RLS.

create or replace function private.create_online_order(
  p_slug text,
  p_idempotency_key text,
  p_customer_info jsonb,
  p_fulfillment_info jsonb,
  p_items_json jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_storefront public.storefronts%rowtype;
  v_attempt public.online_order_attempts%rowtype;
  v_validation jsonb;
  v_customer_id uuid;
  v_email text;
  v_phone text;
  v_name text;
  v_order_id uuid;
  v_total_cents bigint := 0;
  v_item jsonb;
  v_recipe_id uuid;
  v_order_item_id uuid;
  v_invoice_id uuid;
  v_pickup_date date;
  v_pickup_time text;
  v_line_total bigint;
  v_qty numeric;
  v_unit_price bigint;
  v_product_name text;
begin
  select * into v_storefront
  from public.storefronts
  where slug = lower(btrim(p_slug));

  if not found or not v_storefront.is_enabled then
    return jsonb_build_object(
      'success', false,
      'reason_code', 'STORE_DISABLED',
      'error', 'Storefront is not active.'
    );
  end if;

  select * into v_attempt
  from public.online_order_attempts
  where storefront_id = v_storefront.id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_attempt.status = 'completed' and v_attempt.order_id is not null then
      return jsonb_build_object(
        'success', true,
        'order_id', v_attempt.order_id,
        'idempotent', true
      );
    end if;
  else
    insert into public.online_order_attempts (storefront_id, idempotency_key, status, payload_json)
    values (
      v_storefront.id,
      p_idempotency_key,
      'pending',
      jsonb_build_object('customer', p_customer_info, 'fulfillment', p_fulfillment_info, 'items', p_items_json)
    );
  end if;

  v_pickup_date := (p_fulfillment_info->>'pickup_date')::date;
  v_pickup_time := coalesce(p_fulfillment_info->>'pickup_time', '09:00');

  v_validation := private.validate_storefront_checkout(
    p_slug,
    v_pickup_date,
    jsonb_build_object(
      'pickup_window_id', p_fulfillment_info->>'pickup_window_id',
      'items', p_items_json
    )
  );

  if not (v_validation->>'valid')::boolean then
    update public.online_order_attempts
    set status = 'failed'
    where storefront_id = v_storefront.id
      and idempotency_key = p_idempotency_key;

    return jsonb_build_object(
      'success', false,
      'reason_code', v_validation->>'reason_code',
      'error', v_validation->>'message'
    );
  end if;

  v_name := btrim(coalesce(p_customer_info->>'name', 'Online Customer'));
  v_email := lower(btrim(coalesce(p_customer_info->>'email', '')));
  v_phone := nullif(btrim(coalesce(p_customer_info->>'phone', '')), '');

  select id into v_customer_id
  from public.customers
  where bakery_id = v_storefront.bakery_id
    and (
      (v_email <> '' and email = v_email)
      or (v_phone is not null and phone = v_phone)
    )
  order by created_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (bakery_id, name, email, phone, address, notes)
    values (
      v_storefront.bakery_id,
      v_name,
      v_email,
      v_phone,
      p_customer_info->>'address',
      p_customer_info->>'notes'
    )
    returning id into v_customer_id;
  end if;

  for v_item in select * from jsonb_array_elements(p_items_json)
  loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 1);
    v_unit_price := coalesce((v_item->>'unit_price_cents')::bigint, 0);
    v_total_cents := v_total_cents + (v_qty * v_unit_price)::bigint;
  end loop;

  insert into public.orders (
    bakery_id,
    customer_id,
    storefront_id,
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
    v_storefront.bakery_id,
    v_customer_id,
    v_storefront.id,
    v_pickup_date,
    v_pickup_time,
    'confirmed',
    v_total_cents,
    0,
    'unpaid',
    coalesce(p_fulfillment_info->>'notes', 'Online Order') || case when p_fulfillment_info ? 'pickup_window_id' then ' [pickup_window_id: ' || (p_fulfillment_info->>'pickup_window_id') || ']' else '' end,
    'online'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items_json)
  loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 1);
    v_unit_price := coalesce((v_item->>'unit_price_cents')::bigint, 0);
    v_line_total := (v_qty * v_unit_price)::bigint;
    v_product_name := coalesce(v_item->>'public_name', v_item->>'product_name', 'Online Product');

    if v_item ? 'recipe_id' and (v_item->>'recipe_id') is not null and (v_item->>'recipe_id') <> '' then
      v_recipe_id := (v_item->>'recipe_id')::uuid;
    elsif v_item ? 'product_id' and (v_item->>'product_id') is not null and (v_item->>'product_id') <> '' then
      select recipe_id into v_recipe_id
      from public.storefront_products
      where id = (v_item->>'product_id')::uuid;
    else
      v_recipe_id := null;
    end if;

    insert into public.order_items (
      order_id,
      recipe_id,
      product_name,
      quantity,
      unit_price_cents,
      total_price_cents
    )
    values (
      v_order_id,
      v_recipe_id,
      v_product_name,
      v_qty,
      v_unit_price,
      v_line_total
    )
    returning id into v_order_item_id;

    insert into public.production_tasks (
      bakery_id,
      order_id,
      recipe_id,
      flow_id,
      flow_step_id,
      title,
      category,
      status,
      scheduled_at,
      duration_minutes,
      urgency,
      delay_minutes,
      skip_reason
    )
    values (
      v_storefront.bakery_id,
      v_order_id,
      v_recipe_id::text,
      'flow_online_' || v_order_item_id::text,
      'step_online_prepare_bake_' || v_order_item_id::text,
      'Prepare & Bake ' || v_product_name,
      'baking',
      'pending',
      (v_pickup_date + coalesce(v_pickup_time, '09:00')::time - interval '2 hours')::timestamptz,
      30,
      'normal',
      0,
      null
    );
  end loop;

  insert into public.invoices (
    bakery_id,
    order_id,
    customer_id,
    status,
    subtotal_cents,
    total_cents,
    balance_cents,
    amount_paid_cents,
    due_date,
    customer_snapshot_json,
    bakery_snapshot_json
  )
  values (
    v_storefront.bakery_id,
    v_order_id,
    v_customer_id,
    'sent',
    v_total_cents,
    v_total_cents,
    v_total_cents,
    0,
    v_pickup_date::timestamptz,
    p_customer_info,
    jsonb_build_object('storefront_id', v_storefront.id, 'slug', v_storefront.slug, 'name', v_storefront.name)
  )
  returning id into v_invoice_id;

  update public.online_order_attempts
  set status = 'completed',
      order_id = v_order_id
  where storefront_id = v_storefront.id
    and idempotency_key = p_idempotency_key;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'invoice_id', v_invoice_id,
    'customer_id', v_customer_id
  );
end;
$$;

revoke all on function private.create_online_order(text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function private.create_online_order(text, text, jsonb, jsonb, jsonb) to authenticated, anon;

-- Keep the public RPC as the only exposed checkout bridge. Anonymous callers do
-- not have USAGE on the private schema, so the wrapper must resolve the private
-- implementation with its owner privileges instead of widening schema access.
create or replace function public.create_online_order(
  p_slug text,
  p_idempotency_key text,
  p_customer_info jsonb,
  p_fulfillment_info jsonb,
  p_items_json jsonb
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.create_online_order(
    p_slug,
    p_idempotency_key,
    p_customer_info,
    p_fulfillment_info,
    p_items_json
  );
$$;

revoke all on function public.create_online_order(text, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_online_order(text, text, jsonb, jsonb, jsonb) to authenticated, anon;

revoke all on table public.recipes from anon, authenticated;

create policy recipes_members_all
on public.recipes for all to authenticated
using ((select private.is_bakery_member(bakery_id)))
with check ((select private.is_bakery_member(bakery_id)));

alter table public.recipes enable row level security;

grant select, insert, update, delete on table public.recipes to authenticated;
