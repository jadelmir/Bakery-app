-- Online Storefront, Catalog Publishing, Availability Rules, and Public Checkout (Phase F6 / F10 / B7 / B11)

-- 1. Base Domain Tables (if not previously created)

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  name text not null,
  yield text,
  batch_cost_cents bigint default 0,
  selling_price_cents bigint default 0,
  flow_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Storefront Tables Creation

create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  is_enabled boolean not null default false,
  minimum_lead_time_hours integer not null default 24 check (minimum_lead_time_hours >= 0),
  order_cutoff_time time,
  maximum_daily_orders integer check (maximum_daily_orders is null or maximum_daily_orders >= 0),
  logo_path text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefronts_bakery_id_key unique (bakery_id),
  constraint storefronts_slug_format check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.storefront_products (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  public_name text not null,
  public_description text,
  online_price_cents bigint not null check (online_price_cents >= 0),
  image_path text,
  is_published boolean not null default false,
  is_sold_out boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.storefront_pickup_windows (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  max_orders_per_window integer check (max_orders_per_window is null or max_orders_per_window >= 0),
  is_enabled boolean not null default true,
  constraint storefront_pickup_windows_time_check check (end_time > start_time)
);

create table if not exists public.storefront_closed_dates (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  closed_date date not null,
  reason text,
  constraint storefront_closed_dates_sf_date_key unique (storefront_id, closed_date)
);

create table if not exists public.storefront_capacity_rules (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  rule_type text not null check (rule_type in ('daily_orders', 'pickup_window', 'product_daily')),
  max_limit integer not null check (max_limit >= 0),
  is_active boolean not null default true
);

create table if not exists public.online_order_attempts (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  idempotency_key text not null,
  order_id uuid,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint online_order_attempts_sf_key unique (storefront_id, idempotency_key)
);

-- 3. Core Order & Production Tables (if not previously created)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  storefront_id uuid references public.storefronts(id) on delete set null,
  pickup_date date not null,
  pickup_time text,
  status text not null default 'confirmed' check (status in ('draft', 'confirmed', 'in-production', 'ready', 'completed', 'cancelled')),
  total_cents bigint not null default 0 check (total_cents >= 0),
  amount_paid_cents bigint not null default 0 check (amount_paid_cents >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partially-paid', 'paid', 'refunded')),
  notes text,
  source text not null default 'online',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  product_name text not null,
  quantity numeric not null check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  total_price_cents bigint not null default 0 check (total_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  title text not null,
  product_name text not null,
  quantity numeric not null default 1,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'completed', 'skipped')),
  instructions text,
  category text default 'baking',
  duration_minutes integer default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_requirements (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  quantity_required numeric not null check (quantity_required > 0),
  status text not null default 'pending' check (status in ('pending', 'reserved', 'fulfilled')),
  created_at timestamptz not null default now()
);

-- 4. Indexes

create index if not exists storefronts_bakery_id_idx on public.storefronts (bakery_id);
create index if not exists storefronts_slug_idx on public.storefronts (slug);
create index if not exists storefront_products_storefront_idx on public.storefront_products (storefront_id);
create index if not exists storefront_products_recipe_idx on public.storefront_products (recipe_id);
create index if not exists storefront_pickup_windows_sf_day_idx on public.storefront_pickup_windows (storefront_id, day_of_week);
create index if not exists storefront_closed_dates_sf_date_idx on public.storefront_closed_dates (storefront_id, closed_date);
create index if not exists storefront_capacity_rules_sf_idx on public.storefront_capacity_rules (storefront_id);
create index if not exists online_order_attempts_sf_key_idx on public.online_order_attempts (storefront_id, idempotency_key);
create index if not exists orders_storefront_pickup_date_idx on public.orders (storefront_id, pickup_date);
create index if not exists customers_bakery_email_idx on public.customers (bakery_id, email);

-- 5. Triggers

create trigger storefronts_set_updated_at
  before update on public.storefronts
  for each row execute function private.set_updated_at();

-- 6. Row Level Security & Policies

alter table public.storefronts enable row level security;
alter table public.storefront_products enable row level security;
alter table public.storefront_pickup_windows enable row level security;
alter table public.storefront_closed_dates enable row level security;
alter table public.storefront_capacity_rules enable row level security;
alter table public.online_order_attempts enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.production_tasks enable row level security;
alter table public.inventory_requirements enable row level security;

-- Member policies
create policy storefronts_members_all on public.storefronts for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy storefront_products_members_all on public.storefront_products for all to authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = storefront_products.storefront_id and private.is_bakery_member(sf.bakery_id)))
  with check (exists (select 1 from public.storefronts sf where sf.id = storefront_products.storefront_id and private.is_bakery_member(sf.bakery_id)));

create policy storefront_pickup_windows_members_all on public.storefront_pickup_windows for all to authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = storefront_pickup_windows.storefront_id and private.is_bakery_member(sf.bakery_id)))
  with check (exists (select 1 from public.storefronts sf where sf.id = storefront_pickup_windows.storefront_id and private.is_bakery_member(sf.bakery_id)));

create policy storefront_closed_dates_members_all on public.storefront_closed_dates for all to authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = storefront_closed_dates.storefront_id and private.is_bakery_member(sf.bakery_id)))
  with check (exists (select 1 from public.storefronts sf where sf.id = storefront_closed_dates.storefront_id and private.is_bakery_member(sf.bakery_id)));

create policy storefront_capacity_rules_members_all on public.storefront_capacity_rules for all to authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = storefront_capacity_rules.storefront_id and private.is_bakery_member(sf.bakery_id)))
  with check (exists (select 1 from public.storefronts sf where sf.id = storefront_capacity_rules.storefront_id and private.is_bakery_member(sf.bakery_id)));

create policy online_order_attempts_members_all on public.online_order_attempts for all to authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = online_order_attempts.storefront_id and private.is_bakery_member(sf.bakery_id)))
  with check (exists (select 1 from public.storefronts sf where sf.id = online_order_attempts.storefront_id and private.is_bakery_member(sf.bakery_id)));

create policy customers_members_all on public.customers for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy orders_members_all on public.orders for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy order_items_members_all on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and private.is_bakery_member(o.bakery_id)));

create policy production_tasks_members_all on public.production_tasks for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy inventory_requirements_members_all on public.inventory_requirements for all to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

-- Public SELECT policies by slug / active storefront status
create policy storefronts_select_public on public.storefronts for select to anon, authenticated
  using (is_enabled = true);

create policy storefront_products_select_public on public.storefront_products for select to anon, authenticated
  using (is_published = true and exists (select 1 from public.storefronts sf where sf.id = storefront_products.storefront_id and sf.is_enabled = true));

create policy storefront_pickup_windows_select_public on public.storefront_pickup_windows for select to anon, authenticated
  using (is_enabled = true and exists (select 1 from public.storefronts sf where sf.id = storefront_pickup_windows.storefront_id and sf.is_enabled = true));

create policy storefront_closed_dates_select_public on public.storefront_closed_dates for select to anon, authenticated
  using (exists (select 1 from public.storefronts sf where sf.id = storefront_closed_dates.storefront_id and sf.is_enabled = true));

-- Grants
grant select on public.storefronts to anon, authenticated;
grant select on public.storefront_products to anon, authenticated;
grant select on public.storefront_pickup_windows to anon, authenticated;
grant select on public.storefront_closed_dates to anon, authenticated;

grant select, insert, update, delete on public.storefronts to authenticated;
grant select, insert, update, delete on public.storefront_products to authenticated;
grant select, insert, update, delete on public.storefront_pickup_windows to authenticated;
grant select, insert, update, delete on public.storefront_closed_dates to authenticated;
grant select, insert, update, delete on public.storefront_capacity_rules to authenticated;
grant select, insert, update, delete on public.online_order_attempts to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.production_tasks to authenticated;
grant select, insert, update, delete on public.inventory_requirements to authenticated;

-- 7. Availability Validation Function

create or replace function private.validate_storefront_checkout(
  p_slug text,
  p_target_date date,
  p_cart_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_storefront public.storefronts%rowtype;
  v_lead_hours integer;
  v_earliest_date date;
  v_existing_orders bigint;
  v_window_id uuid;
  v_window_orders bigint;
  v_max_window_orders integer;
  v_item jsonb;
  v_product public.storefront_products%rowtype;
begin
  select * into v_storefront
  from public.storefronts
  where slug = lower(btrim(p_slug));

  if not found or not v_storefront.is_enabled then
    return jsonb_build_object(
      'valid', false,
      'reason_code', 'STORE_DISABLED',
      'message', 'Storefront is currently offline or disabled.'
    );
  end if;

  if exists (
    select 1 from public.storefront_closed_dates
    where storefront_id = v_storefront.id
      and closed_date = p_target_date
  ) then
    return jsonb_build_object(
      'valid', false,
      'reason_code', 'STORE_CLOSED_DATE',
      'message', 'Store is closed on the selected date.'
    );
  end if;

  v_lead_hours := coalesce(v_storefront.minimum_lead_time_hours, 24);
  v_earliest_date := (current_date + (v_lead_hours || ' hours')::interval)::date;

  if p_target_date < v_earliest_date then
    return jsonb_build_object(
      'valid', false,
      'reason_code', 'LEAD_TIME_NOT_MET',
      'message', 'Selected date does not meet the minimum lead time requirement.'
    );
  end if;

  if v_storefront.order_cutoff_time is not null and p_target_date = v_earliest_date then
    if current_time > v_storefront.order_cutoff_time then
      return jsonb_build_object(
        'valid', false,
        'reason_code', 'CUTOFF_TIME_PASSED',
        'message', 'Order cutoff time for this fulfillment date has passed.'
      );
    end if;
  end if;

  if v_storefront.maximum_daily_orders is not null then
    select count(*) into v_existing_orders
    from public.orders
    where storefront_id = v_storefront.id
      and pickup_date = p_target_date
      and status not in ('cancelled');

    if v_existing_orders >= v_storefront.maximum_daily_orders then
      return jsonb_build_object(
        'valid', false,
        'reason_code', 'DAILY_CAPACITY_REACHED',
        'message', 'Maximum daily order capacity reached for this date.'
      );
    end if;
  end if;

  if p_cart_json ? 'pickup_window_id' and (p_cart_json->>'pickup_window_id') is not null and (p_cart_json->>'pickup_window_id') <> '' then
    v_window_id := (p_cart_json->>'pickup_window_id')::uuid;

    select max_orders_per_window into v_max_window_orders
    from public.storefront_pickup_windows
    where id = v_window_id
      and storefront_id = v_storefront.id
      and is_enabled = true;

    if v_max_window_orders is not null then
      select count(*) into v_window_orders
      from public.orders
      where storefront_id = v_storefront.id
        and pickup_date = p_target_date
        and (notes like '%' || v_window_id::text || '%')
        and status not in ('cancelled');

      if v_window_orders >= v_max_window_orders then
        return jsonb_build_object(
          'valid', false,
          'reason_code', 'WINDOW_CAPACITY_REACHED',
          'message', 'Pickup window capacity reached for this time slot.'
        );
      end if;
    end if;
  end if;

  if p_cart_json ? 'items' and jsonb_typeof(p_cart_json->'items') = 'array' then
    for v_item in select * from jsonb_array_elements(p_cart_json->'items')
    loop
      if v_item ? 'product_id' and (v_item->>'product_id') is not null then
        select * into v_product
        from public.storefront_products
        where id = (v_item->>'product_id')::uuid
          and storefront_id = v_storefront.id;

        if not found or not v_product.is_published or v_product.is_sold_out then
          return jsonb_build_object(
            'valid', false,
            'reason_code', 'PRODUCT_UNAVAILABLE',
            'message', 'One or more products in your cart are unavailable.'
          );
        end if;
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'valid', true,
    'storefront_id', v_storefront.id,
    'bakery_id', v_storefront.bakery_id
  );
end;
$$;

create or replace function public.validate_storefront_checkout(
  p_slug text,
  p_target_date date,
  p_cart_json jsonb default '{}'::jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.validate_storefront_checkout(p_slug, p_target_date, p_cart_json);
$$;

revoke all on function private.validate_storefront_checkout(text, date, jsonb) from public, anon;
grant execute on function private.validate_storefront_checkout(text, date, jsonb) to authenticated, anon;
grant execute on function public.validate_storefront_checkout(text, date, jsonb) to authenticated, anon;

-- 8. Atomic Order Creation Function

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
      order_item_id,
      recipe_id,
      title,
      product_name,
      quantity,
      scheduled_at,
      status,
      instructions,
      category,
      duration_minutes
    )
    values (
      v_storefront.bakery_id,
      v_order_id,
      v_order_item_id,
      v_recipe_id,
      'Prepare & Bake ' || v_product_name,
      v_product_name,
      v_qty,
      (v_pickup_date + coalesce(v_pickup_time, '09:00')::time - interval '2 hours')::timestamptz,
      'pending',
      'Online storefront production task for ' || v_product_name,
      'baking',
      30
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

create or replace function public.create_online_order(
  p_slug text,
  p_idempotency_key text,
  p_customer_info jsonb,
  p_fulfillment_info jsonb,
  p_items_json jsonb
)
returns jsonb
language sql
security invoker
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

revoke all on function private.create_online_order(text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function private.create_online_order(text, text, jsonb, jsonb, jsonb) to authenticated, anon;
grant execute on function public.create_online_order(text, text, jsonb, jsonb, jsonb) to authenticated, anon;
