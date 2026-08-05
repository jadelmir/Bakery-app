-- Authoritative bakery inventory ledger, reservations, and atomic mutations.
-- This migration is additive: legacy inventory tables remain available for
-- rollback reads, while all new physical inventory writes flow through
-- inventory_transactions and the RPCs defined below.

-- ---------------------------------------------------------------------------
-- Inventory item expansion and cached balances
-- ---------------------------------------------------------------------------

alter table public.ingredients
  add column if not exists recipe_id uuid,
  add column if not exists reserved numeric not null default 0,
  add column if not exists average_unit_cost_cents numeric(18, 6) not null default 0;

update public.ingredients
set average_unit_cost_cents = greatest(0, cost_per_unit * 100)
where average_unit_cost_cents = 0
  and cost_per_unit > 0;

alter table public.ingredients
  drop constraint if exists ingredients_kind_check,
  drop constraint if exists ingredients_on_hand_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_recipe_id_fkey'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_recipe_id_fkey
      foreign key (recipe_id) references public.recipes(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_bakery_id_id_key'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_bakery_id_id_key unique (bakery_id, id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_kind_check'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_kind_check
      check (kind in ('ingredient', 'packaging', 'finished_good'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_base_unit_check'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_base_unit_check
      check (unit in ('g', 'ml', 'unit')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_finished_good_recipe_check'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_finished_good_recipe_check
      check (kind <> 'finished_good' or recipe_id is not null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_reserved_nonnegative'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_reserved_nonnegative check (reserved >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ingredients_average_unit_cost_nonnegative'
      and conrelid = 'public.ingredients'::regclass
  ) then
    alter table public.ingredients
      add constraint ingredients_average_unit_cost_nonnegative
      check (average_unit_cost_cents >= 0);
  end if;
end;
$$;

create index if not exists ingredients_bakery_kind_name_idx
  on public.ingredients (bakery_id, kind, name);
create index if not exists ingredients_recipe_id_idx
  on public.ingredients (recipe_id)
  where recipe_id is not null;

-- ---------------------------------------------------------------------------
-- Authoritative physical inventory event stream
-- ---------------------------------------------------------------------------

alter table public.inventory_transactions
  alter column unit_cost_cents type numeric(18, 6)
    using unit_cost_cents::numeric,
  add column if not exists base_unit text,
  add column if not exists total_cost_cents numeric(18, 2),
  add column if not exists package_count numeric,
  add column if not exists package_quantity numeric,
  add column if not exists package_unit text,
  add column if not exists package_price_cents numeric(18, 2),
  add column if not exists actor_id uuid,
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists request_fingerprint text,
  add column if not exists order_id uuid,
  add column if not exists order_item_id uuid,
  add column if not exists allocation_order_id uuid,
  add column if not exists allocation_order_item_id uuid,
  add column if not exists allocation_status text,
  add column if not exists affects_financials boolean not null default true,
  add column if not exists is_legacy boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.inventory_transactions
  drop constraint if exists inventory_transactions_transaction_type_check,
  drop constraint if exists inventory_transactions_item_id_fkey;

update public.inventory_transactions transaction
set transaction_type = case transaction.transaction_type
      when 'restock' then 'purchase'
      when 'deduction' then 'production_usage'
      when 'adjustment' then 'manual_adjustment'
      else transaction.transaction_type
    end,
    source_key = coalesce(
      nullif(btrim(transaction.source_key), ''),
      'legacy:inventory_transactions:' || transaction.id::text
    ),
    source_type = coalesce(transaction.source_type, 'legacy_inventory_transactions'),
    source_id = coalesce(transaction.source_id, transaction.id::text),
    base_unit = coalesce(transaction.base_unit, item.unit),
    unit_cost_cents = coalesce(
      transaction.unit_cost_cents,
      greatest(0, item.cost_per_unit * 100)
    ),
    total_cost_cents = coalesce(
      transaction.total_cost_cents,
      round(abs(transaction.quantity_change) * coalesce(
        transaction.unit_cost_cents,
        greatest(0, item.cost_per_unit * 100)
      ), 2)
    ),
    affects_financials = false,
    is_legacy = true,
    metadata = transaction.metadata || jsonb_build_object(
      'legacy_table', 'inventory_transactions',
      'legacy_transaction_id', transaction.id
    )
from public.ingredients item
where item.id = transaction.item_id;

update public.inventory_transactions
set source_key = coalesce(
      nullif(btrim(source_key), ''),
      'legacy:inventory_transactions:' || id::text
    ),
    source_type = coalesce(source_type, 'legacy_inventory_transactions'),
    source_id = coalesce(source_id, id::text),
    transaction_type = coalesce(transaction_type, 'manual_adjustment'),
    affects_financials = false,
    is_legacy = true,
    metadata = metadata || jsonb_build_object(
      'legacy_table', 'inventory_transactions',
      'legacy_transaction_id', id
    );

insert into public.inventory_transactions (
  bakery_id,
  item_id,
  transaction_type,
  quantity_change,
  base_unit,
  unit_cost_cents,
  total_cost_cents,
  source_key,
  source_type,
  source_id,
  notes,
  affects_financials,
  is_legacy,
  metadata,
  created_at
)
select
  movement.bakery_id,
  movement.ingredient_id,
  case movement.reason
    when 'restock' then 'purchase'
    when 'task-deduction' then 'production_usage'
    else 'manual_adjustment'
  end,
  movement.quantity_change,
  item.unit,
  greatest(0, item.cost_per_unit * 100),
  round(abs(movement.quantity_change) * greatest(0, item.cost_per_unit * 100), 2),
  'legacy:inventory_movements:' || movement.id::text,
  'legacy_inventory_movements',
  movement.id::text,
  movement.notes,
  false,
  true,
  jsonb_build_object(
    'legacy_table', 'inventory_movements',
    'legacy_movement_id', movement.id,
    'legacy_reason', movement.reason
  ),
  movement.created_at
from public.inventory_movements movement
join public.ingredients item
  on item.id = movement.ingredient_id
 and item.bakery_id = movement.bakery_id
where not exists (
  select 1
  from public.inventory_transactions transaction
  where transaction.source_key = 'legacy:inventory_movements:' || movement.id::text
);

-- Reconcile each cached balance after importing both historical streams. The
-- opening event absorbs incomplete or overlapping legacy history without
-- changing the currently visible on-hand quantity.
insert into public.inventory_transactions (
  bakery_id,
  item_id,
  transaction_type,
  quantity_change,
  base_unit,
  unit_cost_cents,
  total_cost_cents,
  source_key,
  source_type,
  source_id,
  affects_financials,
  is_legacy,
  metadata
)
select
  item.bakery_id,
  item.id,
  'opening_balance',
  item.on_hand - coalesce(ledger.quantity_total, 0),
  item.unit,
  item.average_unit_cost_cents,
  round(abs(item.on_hand - coalesce(ledger.quantity_total, 0)) * item.average_unit_cost_cents, 2),
  'opening-balance:' || item.id::text,
  'inventory_reconciliation',
  item.id::text,
  false,
  true,
  jsonb_build_object('reconciled_cached_on_hand', item.on_hand)
from public.ingredients item
left join (
  select bakery_id, item_id, sum(quantity_change) as quantity_total
  from public.inventory_transactions
  where item_id is not null
  group by bakery_id, item_id
) ledger
  on ledger.bakery_id = item.bakery_id
 and ledger.item_id = item.id
where item.on_hand <> coalesce(ledger.quantity_total, 0)
  and not exists (
    select 1
    from public.inventory_transactions transaction
    where transaction.bakery_id = item.bakery_id
      and transaction.source_key = 'opening-balance:' || item.id::text
  );

alter table public.inventory_transactions
  alter column transaction_type set not null,
  alter column source_key set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_bakery_item_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_bakery_item_fkey
      foreign key (bakery_id, item_id)
      references public.ingredients(bakery_id, id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_actor_id_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_actor_id_fkey
      foreign key (actor_id) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_order_id_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_order_item_id_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_order_item_id_fkey
      foreign key (order_item_id) references public.order_items(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_allocation_order_id_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_allocation_order_id_fkey
      foreign key (allocation_order_id) references public.orders(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_allocation_order_item_id_fkey'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_allocation_order_item_id_fkey
      foreign key (allocation_order_item_id) references public.order_items(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_type_check'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_type_check check (
        transaction_type in (
          'purchase',
          'manual_adjustment',
          'production_usage',
          'production_output',
          'opening_balance'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_source_key_not_blank'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_source_key_not_blank
      check (char_length(btrim(source_key)) between 1 and 240);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_base_unit_check'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_base_unit_check
      check (base_unit is null or base_unit in ('g', 'ml', 'unit')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_sign_check'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_sign_check check (
        (transaction_type = 'purchase' and quantity_change > 0)
        or (transaction_type = 'production_usage' and quantity_change < 0)
        or (transaction_type = 'production_output' and quantity_change > 0)
        or transaction_type in ('manual_adjustment', 'opening_balance')
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_cost_nonnegative'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_cost_nonnegative check (
        (unit_cost_cents is null or unit_cost_cents >= 0)
        and (total_cost_cents is null or total_cost_cents >= 0)
        and (package_price_cents is null or package_price_cents >= 0)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_actor_required'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_actor_required
      check (is_legacy or actor_id is not null);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_purchase_package_check'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_purchase_package_check check (
        is_legacy
        or transaction_type <> 'purchase'
        or (
          package_count > 0
          and package_quantity > 0
          and package_unit = base_unit
          and package_price_cents >= 0
          and total_cost_cents is not null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_transactions_allocation_check'
      and conrelid = 'public.inventory_transactions'::regclass
  ) then
    alter table public.inventory_transactions
      add constraint inventory_transactions_allocation_check check (
        (
          transaction_type = 'production_output'
          and allocation_status in ('available', 'allocated')
          and (
            (allocation_status = 'available'
              and allocation_order_id is null
              and allocation_order_item_id is null)
            or
            (allocation_status = 'allocated'
              and allocation_order_id is not null
              and allocation_order_item_id is not null)
          )
        )
        or (
          transaction_type <> 'production_output'
          and allocation_status is null
          and allocation_order_id is null
          and allocation_order_item_id is null
        )
        or is_legacy
      );
  end if;
end;
$$;

create unique index if not exists inventory_transactions_source_event_item_key
  on public.inventory_transactions (bakery_id, source_key, transaction_type, item_id)
  where is_legacy = false;
create index if not exists inventory_transactions_bakery_created_idx
  on public.inventory_transactions (bakery_id, created_at desc);
create index if not exists inventory_transactions_bakery_type_created_idx
  on public.inventory_transactions (bakery_id, transaction_type, created_at desc);
create index if not exists inventory_transactions_order_item_idx
  on public.inventory_transactions (order_item_id)
  where order_item_id is not null;
create index if not exists inventory_transactions_allocation_order_idx
  on public.inventory_transactions (allocation_order_id, allocation_status)
  where allocation_order_id is not null;

-- ---------------------------------------------------------------------------
-- Reservation state. The existing inventory_requirements table is retained
-- and expanded so there is only one persisted requirements model.
-- ---------------------------------------------------------------------------

alter table public.inventory_requirements
  add column if not exists order_item_id uuid,
  add column if not exists reservation_date date,
  add column if not exists source_key text,
  add column if not exists request_fingerprint text,
  add column if not exists created_by uuid,
  add column if not exists fulfilled_by uuid,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists fulfillment_source_key text,
  add column if not exists released_by uuid,
  add column if not exists released_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.inventory_requirements
  drop constraint if exists inventory_requirements_status_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_status_check'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_status_check
      check (status in ('pending', 'reserved', 'fulfilled', 'released'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_order_item_id_fkey'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_order_item_id_fkey
      foreign key (order_item_id) references public.order_items(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_created_by_fkey'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_fulfilled_by_fkey'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_fulfilled_by_fkey
      foreign key (fulfilled_by) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_released_by_fkey'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_released_by_fkey
      foreign key (released_by) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'inventory_requirements_source_key_not_blank'
      and conrelid = 'public.inventory_requirements'::regclass
  ) then
    alter table public.inventory_requirements
      add constraint inventory_requirements_source_key_not_blank
      check (source_key is null or char_length(btrim(source_key)) between 1 and 240);
  end if;
end;
$$;

create unique index if not exists inventory_requirements_source_item_key
  on public.inventory_requirements (bakery_id, source_key, ingredient_id)
  where source_key is not null;
create unique index if not exists inventory_requirements_active_order_item_key
  on public.inventory_requirements (bakery_id, order_item_id, ingredient_id)
  where status = 'reserved' and order_item_id is not null;
create index if not exists inventory_requirements_bakery_status_item_idx
  on public.inventory_requirements (bakery_id, status, ingredient_id);
create index if not exists inventory_requirements_order_item_status_idx
  on public.inventory_requirements (order_item_id, status)
  where order_item_id is not null;

drop trigger if exists inventory_requirements_set_updated_at
  on public.inventory_requirements;
create trigger inventory_requirements_set_updated_at
  before update on public.inventory_requirements
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Internal reservation fulfillment helper
-- ---------------------------------------------------------------------------

create or replace function private.fulfill_inventory_reservations_internal(
  p_bakery_id uuid,
  p_order_item_id uuid,
  p_fulfillment_source_key text,
  p_actor_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line record;
  v_count integer := 0;
begin
  perform 1
  from public.inventory_requirements requirement
  where requirement.bakery_id = p_bakery_id
    and requirement.order_item_id = p_order_item_id
    and requirement.status = 'reserved'
  order by requirement.ingredient_id
  for update;

  for v_line in
    select requirement.id, requirement.ingredient_id, requirement.quantity_required
    from public.inventory_requirements requirement
    where requirement.bakery_id = p_bakery_id
      and requirement.order_item_id = p_order_item_id
      and requirement.status = 'reserved'
    order by requirement.ingredient_id
  loop
    perform 1
    from public.ingredients item
    where item.bakery_id = p_bakery_id
      and item.id = v_line.ingredient_id
    for update;

    update public.ingredients
    set reserved = greatest(0, reserved - v_line.quantity_required),
        updated_at = now()
    where bakery_id = p_bakery_id
      and id = v_line.ingredient_id;

    update public.inventory_requirements
    set status = 'fulfilled',
        fulfilled_by = p_actor_id,
        fulfilled_at = now(),
        fulfillment_source_key = p_fulfillment_source_key
    where id = v_line.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.fulfill_inventory_reservations_internal(uuid, uuid, text, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Atomic inventory RPCs
-- ---------------------------------------------------------------------------

create or replace function public.receive_inventory_stock(
  p_bakery_id uuid,
  p_item_id uuid,
  p_package_count numeric,
  p_package_quantity numeric,
  p_package_unit text,
  p_package_price_cents numeric,
  p_source_key text,
  p_invoice_reference text default null,
  p_notes text default null
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
  v_base_quantity numeric;
  v_total_cost_cents numeric(18, 2);
  v_unit_cost_cents numeric(18, 6);
  v_new_average numeric(18, 6);
  v_transaction_id uuid;
  v_fingerprint text;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_package_count is null or p_package_count <= 0
    or p_package_quantity is null or p_package_quantity <= 0
    or p_package_price_cents is null or p_package_price_cents < 0
    or nullif(btrim(coalesce(p_source_key, '')), '') is null
  then
    raise exception 'Package count, package quantity, price, and source key are required.'
      using errcode = '22023';
  end if;

  v_base_quantity := p_package_count * p_package_quantity;
  v_total_cost_cents := round(p_package_count * p_package_price_cents, 2);
  v_unit_cost_cents := round(v_total_cost_cents / v_base_quantity, 6);
  v_fingerprint := md5(jsonb_build_object(
    'item_id', p_item_id,
    'package_count', p_package_count,
    'package_quantity', p_package_quantity,
    'package_unit', p_package_unit,
    'package_price_cents', p_package_price_cents,
    'invoice_reference', p_invoice_reference
  )::text);

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':receive:' || btrim(p_source_key), 0
  ));

  select * into v_existing
  from public.inventory_transactions transaction
  where transaction.bakery_id = p_bakery_id
    and transaction.source_key = btrim(p_source_key)
    and transaction.transaction_type = 'purchase'
    and transaction.item_id = p_item_id
    and transaction.is_legacy = false;

  if found then
    if v_existing.request_fingerprint is distinct from v_fingerprint then
      raise exception 'Inventory source key was already used with different receiving inputs.'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'transaction_id', v_existing.id,
      'idempotent', true,
      'quantity_change', v_existing.quantity_change,
      'on_hand', (
        select item.on_hand from public.ingredients item
        where item.bakery_id = p_bakery_id and item.id = p_item_id
      )
    );
  end if;

  select * into v_item
  from public.ingredients item
  where item.bakery_id = p_bakery_id
    and item.id = p_item_id
  for update;

  if not found then
    raise exception 'Inventory item does not belong to the active bakery.'
      using errcode = '23503';
  end if;

  if p_package_unit is distinct from v_item.unit then
    raise exception 'Package unit must match the item base unit %.', v_item.unit
      using errcode = '22023';
  end if;

  if v_item.on_hand > 0 then
    v_new_average := round(
      ((v_item.on_hand * v_item.average_unit_cost_cents) + v_total_cost_cents)
      / (v_item.on_hand + v_base_quantity),
      6
    );
  else
    v_new_average := v_unit_cost_cents;
  end if;

  insert into public.inventory_transactions (
    bakery_id, item_id, transaction_type, quantity_change, base_unit,
    unit_cost_cents, total_cost_cents, package_count, package_quantity,
    package_unit, package_price_cents, actor_id, invoice_reference, source_key,
    source_type, source_id, request_fingerprint, notes, affects_financials,
    is_legacy, metadata
  ) values (
    p_bakery_id, p_item_id, 'purchase', v_base_quantity, v_item.unit,
    v_unit_cost_cents, v_total_cost_cents, p_package_count, p_package_quantity,
    p_package_unit, p_package_price_cents, v_actor_id, p_invoice_reference,
    btrim(p_source_key), 'receiving', p_invoice_reference, v_fingerprint,
    p_notes, true, false, jsonb_build_object('received_by_package', true)
  )
  returning id into v_transaction_id;

  update public.ingredients
  set on_hand = on_hand + v_base_quantity,
      average_unit_cost_cents = v_new_average,
      package_quantity = p_package_quantity,
      package_price = p_package_price_cents / 100,
      updated_at = now()
  where bakery_id = p_bakery_id and id = p_item_id;

  return jsonb_build_object(
    'transaction_id', v_transaction_id,
    'idempotent', false,
    'quantity_change', v_base_quantity,
    'on_hand', v_item.on_hand + v_base_quantity,
    'unit_cost_cents', v_unit_cost_cents,
    'total_cost_cents', v_total_cost_cents
  );
end;
$$;

create or replace function public.adjust_inventory_stock(
  p_bakery_id uuid,
  p_item_id uuid,
  p_adjustment_mode text,
  p_quantity numeric,
  p_source_key text,
  p_reason text,
  p_notes text default null
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
  v_quantity_change numeric;
  v_transaction_id uuid;
  v_fingerprint text;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_adjustment_mode not in ('physical_count', 'relative')
    or p_quantity is null
    or nullif(btrim(coalesce(p_source_key, '')), '') is null
    or nullif(btrim(coalesce(p_reason, '')), '') is null
  then
    raise exception 'A valid adjustment mode, quantity, source key, and reason are required.'
      using errcode = '22023';
  end if;

  if p_adjustment_mode = 'physical_count' and p_quantity < 0 then
    raise exception 'A physical count cannot be negative.' using errcode = '22023';
  end if;

  v_fingerprint := md5(jsonb_build_object(
    'item_id', p_item_id,
    'adjustment_mode', p_adjustment_mode,
    'quantity', p_quantity,
    'reason', btrim(p_reason)
  )::text);

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':adjust:' || btrim(p_source_key), 0
  ));

  select * into v_existing
  from public.inventory_transactions transaction
  where transaction.bakery_id = p_bakery_id
    and transaction.source_key = btrim(p_source_key)
    and transaction.transaction_type = 'manual_adjustment'
    and transaction.item_id = p_item_id
    and transaction.is_legacy = false;

  if found then
    if v_existing.request_fingerprint is distinct from v_fingerprint then
      raise exception 'Inventory source key was already used with different adjustment inputs.'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'transaction_id', v_existing.id,
      'idempotent', true,
      'quantity_change', v_existing.quantity_change,
      'on_hand', (
        select item.on_hand from public.ingredients item
        where item.bakery_id = p_bakery_id and item.id = p_item_id
      )
    );
  end if;

  select * into v_item
  from public.ingredients item
  where item.bakery_id = p_bakery_id and item.id = p_item_id
  for update;

  if not found then
    raise exception 'Inventory item does not belong to the active bakery.'
      using errcode = '23503';
  end if;

  v_quantity_change := case p_adjustment_mode
    when 'physical_count' then p_quantity - v_item.on_hand
    else p_quantity
  end;

  insert into public.inventory_transactions (
    bakery_id, item_id, transaction_type, quantity_change, base_unit,
    unit_cost_cents, total_cost_cents, actor_id, source_key, source_type,
    source_id, request_fingerprint, notes, affects_financials, is_legacy,
    metadata
  ) values (
    p_bakery_id, p_item_id, 'manual_adjustment', v_quantity_change, v_item.unit,
    v_item.average_unit_cost_cents,
    round(abs(v_quantity_change) * v_item.average_unit_cost_cents, 2),
    v_actor_id, btrim(p_source_key), p_adjustment_mode, btrim(p_reason),
    v_fingerprint, p_notes, false, false,
    jsonb_build_object('reason', btrim(p_reason), 'mode', p_adjustment_mode)
  )
  returning id into v_transaction_id;

  update public.ingredients
  set on_hand = on_hand + v_quantity_change,
      updated_at = now()
  where bakery_id = p_bakery_id and id = p_item_id;

  return jsonb_build_object(
    'transaction_id', v_transaction_id,
    'idempotent', false,
    'quantity_change', v_quantity_change,
    'on_hand', v_item.on_hand + v_quantity_change
  );
end;
$$;

create or replace function public.reserve_inventory_for_prep_day(
  p_bakery_id uuid,
  p_order_id uuid,
  p_order_item_id uuid,
  p_reservation_date date,
  p_source_key text,
  p_requirements_json jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_requirement record;
  v_existing_count integer;
  v_existing_fingerprint text;
  v_fingerprint text;
  v_line_count integer := 0;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_order_id is null or p_order_item_id is null or p_reservation_date is null
    or nullif(btrim(coalesce(p_source_key, '')), '') is null
    or jsonb_typeof(p_requirements_json) <> 'array'
    or jsonb_array_length(p_requirements_json) = 0
  then
    raise exception 'Order, order item, prep date, source key, and requirements are required.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.orders orders
    join public.order_items order_item on order_item.order_id = orders.id
    where orders.id = p_order_id
      and orders.bakery_id = p_bakery_id
      and order_item.id = p_order_item_id
  ) then
    raise exception 'Order item does not belong to the active bakery order.'
      using errcode = '23503';
  end if;

  begin
    select md5(coalesce(jsonb_agg(
      jsonb_build_object('item_id', requirement.item_id, 'quantity', requirement.quantity)
      order by requirement.item_id
    ), '[]'::jsonb)::text)
    into v_fingerprint
    from (
      select (entry->>'item_id')::uuid as item_id,
             sum((entry->>'quantity')::numeric) as quantity
      from jsonb_array_elements(p_requirements_json) entry
      group by (entry->>'item_id')::uuid
    ) requirement;
  exception when others then
    raise exception 'Each requirement must contain a valid item_id and quantity.'
      using errcode = '22023';
  end;

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':reserve:' || btrim(p_source_key), 0
  ));

  select count(*)::integer, max(request_fingerprint)
  into v_existing_count, v_existing_fingerprint
  from public.inventory_requirements requirement
  where requirement.bakery_id = p_bakery_id
    and requirement.source_key = btrim(p_source_key);

  if v_existing_count > 0 then
    if v_existing_fingerprint is distinct from v_fingerprint
      or exists (
        select 1
        from public.inventory_requirements requirement
        where requirement.bakery_id = p_bakery_id
          and requirement.source_key = btrim(p_source_key)
          and (
            requirement.order_id <> p_order_id
            or requirement.order_item_id <> p_order_item_id
            or requirement.reservation_date <> p_reservation_date
          )
      )
    then
      raise exception 'Inventory reservation source key was already used with different inputs.'
        using errcode = '23505';
    end if;

    return jsonb_build_object(
      'idempotent', true,
      'reservation_count', v_existing_count
    );
  end if;

  perform 1
  from public.ingredients item
  where item.bakery_id = p_bakery_id
    and item.id in (
      select (entry->>'item_id')::uuid
      from jsonb_array_elements(p_requirements_json) entry
    )
  order by item.id
  for update;

  for v_requirement in
    select (entry->>'item_id')::uuid as item_id,
           sum((entry->>'quantity')::numeric) as quantity
    from jsonb_array_elements(p_requirements_json) entry
    group by (entry->>'item_id')::uuid
    order by (entry->>'item_id')::uuid
  loop
    if v_requirement.quantity <= 0 then
      raise exception 'Reservation quantities must be positive.' using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.ingredients item
      where item.bakery_id = p_bakery_id
        and item.id = v_requirement.item_id
        and item.kind in ('ingredient', 'packaging')
    ) then
      raise exception 'Reservation item must be an ingredient or packaging item in the active bakery.'
        using errcode = '23503';
    end if;

    insert into public.inventory_requirements (
      bakery_id, order_id, order_item_id, ingredient_id, quantity_required,
      status, reservation_date, source_key, request_fingerprint, created_by
    ) values (
      p_bakery_id, p_order_id, p_order_item_id, v_requirement.item_id,
      v_requirement.quantity, 'reserved', p_reservation_date,
      btrim(p_source_key), v_fingerprint, v_actor_id
    );

    update public.ingredients
    set reserved = reserved + v_requirement.quantity,
        updated_at = now()
    where bakery_id = p_bakery_id and id = v_requirement.item_id;

    v_line_count := v_line_count + 1;
  end loop;

  return jsonb_build_object(
    'idempotent', false,
    'reservation_count', v_line_count
  );
end;
$$;

create or replace function public.fulfill_inventory_reservation(
  p_bakery_id uuid,
  p_order_item_id uuid,
  p_source_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_fulfilled_count integer;
  v_existing_count integer;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_order_item_id is null
    or nullif(btrim(coalesce(p_source_key, '')), '') is null
  then
    raise exception 'Order item and fulfillment source key are required.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':fulfill:' || btrim(p_source_key), 0
  ));

  select count(*)::integer into v_existing_count
  from public.inventory_requirements requirement
  where requirement.bakery_id = p_bakery_id
    and requirement.order_item_id = p_order_item_id
    and requirement.status = 'fulfilled'
    and requirement.fulfillment_source_key = btrim(p_source_key);

  if v_existing_count > 0 then
    return jsonb_build_object(
      'idempotent', true,
      'fulfilled_count', v_existing_count
    );
  end if;

  if exists (
    select 1
    from public.inventory_requirements requirement
    where requirement.bakery_id = p_bakery_id
      and requirement.order_item_id = p_order_item_id
      and requirement.status = 'fulfilled'
  ) and not exists (
    select 1
    from public.inventory_requirements requirement
    where requirement.bakery_id = p_bakery_id
      and requirement.order_item_id = p_order_item_id
      and requirement.status = 'reserved'
  ) then
    raise exception 'Reservation was already fulfilled with a different source key.'
      using errcode = '23505';
  end if;

  v_fulfilled_count := private.fulfill_inventory_reservations_internal(
    p_bakery_id,
    p_order_item_id,
    btrim(p_source_key),
    v_actor_id
  );

  if v_fulfilled_count = 0 then
    raise exception 'No active reservation exists for this order item.'
      using errcode = '22023';
  end if;

  return jsonb_build_object(
    'idempotent', false,
    'fulfilled_count', v_fulfilled_count
  );
end;
$$;

create or replace function public.complete_inventory_packaging_checkpoint(
  p_bakery_id uuid,
  p_order_id uuid,
  p_order_item_id uuid,
  p_checkpoint_key text,
  p_usage_json jsonb,
  p_finished_good_item_id uuid,
  p_output_quantity numeric,
  p_allocate_to_order boolean default true,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_order_item public.order_items%rowtype;
  v_finished_good public.ingredients%rowtype;
  v_existing public.inventory_transactions%rowtype;
  v_usage record;
  v_source_key text;
  v_fingerprint text;
  v_usage_total_cost_cents numeric(18, 2) := 0;
  v_line_cost_cents numeric(18, 2);
  v_output_unit_cost_cents numeric(18, 6);
  v_new_output_average numeric(18, 6);
  v_output_transaction_id uuid;
  v_fulfilled_count integer;
begin
  if v_actor_id is null or not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  if p_order_id is null or p_order_item_id is null
    or p_finished_good_item_id is null
    or p_output_quantity is null or p_output_quantity <= 0
    or nullif(btrim(coalesce(p_checkpoint_key, '')), '') is null
    or jsonb_typeof(p_usage_json) <> 'array'
    or jsonb_array_length(p_usage_json) = 0
  then
    raise exception 'Order, order item, checkpoint, usage, and positive output are required.'
      using errcode = '22023';
  end if;

  select order_item.* into v_order_item
  from public.order_items order_item
  join public.orders orders on orders.id = order_item.order_id
  where order_item.id = p_order_item_id
    and order_item.order_id = p_order_id
    and orders.bakery_id = p_bakery_id;

  if not found then
    raise exception 'Order item does not belong to the active bakery order.'
      using errcode = '23503';
  end if;

  v_source_key := 'packaging:' || p_order_item_id::text || ':' || btrim(p_checkpoint_key);

  begin
    select md5(jsonb_build_object(
      'usage', coalesce(jsonb_agg(
        jsonb_build_object('item_id', usage.item_id, 'quantity', usage.quantity)
        order by usage.item_id
      ), '[]'::jsonb),
      'finished_good_item_id', p_finished_good_item_id,
      'output_quantity', p_output_quantity,
      'allocate_to_order', p_allocate_to_order
    )::text)
    into v_fingerprint
    from (
      select (entry->>'item_id')::uuid as item_id,
             sum((entry->>'quantity')::numeric) as quantity
      from jsonb_array_elements(p_usage_json) entry
      group by (entry->>'item_id')::uuid
    ) usage;
  exception when others then
    raise exception 'Each usage entry must contain a valid item_id and quantity.'
      using errcode = '22023';
  end;

  perform pg_advisory_xact_lock(hashtextextended(
    p_bakery_id::text || ':' || v_source_key, 0
  ));

  select * into v_existing
  from public.inventory_transactions transaction
  where transaction.bakery_id = p_bakery_id
    and transaction.source_key = v_source_key
    and transaction.transaction_type = 'production_output'
    and transaction.item_id = p_finished_good_item_id
    and transaction.is_legacy = false;

  if found then
    if v_existing.request_fingerprint is distinct from v_fingerprint then
      raise exception 'Packaging checkpoint was already recorded with different inputs.'
        using errcode = '23505';
    end if;

    return jsonb_build_object(
      'output_transaction_id', v_existing.id,
      'idempotent', true,
      'source_key', v_source_key
    );
  end if;

  perform 1
  from public.ingredients item
  where item.bakery_id = p_bakery_id
    and item.id in (
      select (entry->>'item_id')::uuid
      from jsonb_array_elements(p_usage_json) entry
    )
  order by item.id
  for update;

  for v_usage in
    select (entry->>'item_id')::uuid as item_id,
           sum((entry->>'quantity')::numeric) as quantity
    from jsonb_array_elements(p_usage_json) entry
    group by (entry->>'item_id')::uuid
    order by (entry->>'item_id')::uuid
  loop
    if v_usage.quantity <= 0 then
      raise exception 'Usage quantities must be positive.' using errcode = '22023';
    end if;

    select round(v_usage.quantity * item.average_unit_cost_cents, 2)
    into v_line_cost_cents
    from public.ingredients item
    where item.bakery_id = p_bakery_id
      and item.id = v_usage.item_id
      and item.kind in ('ingredient', 'packaging');

    if not found then
      raise exception 'Usage item must be an ingredient or packaging item in the active bakery.'
        using errcode = '23503';
    end if;

    insert into public.inventory_transactions (
      bakery_id, item_id, transaction_type, quantity_change, base_unit,
      unit_cost_cents, total_cost_cents, actor_id, source_key, source_type,
      source_id, request_fingerprint, order_id, order_item_id, notes,
      affects_financials, is_legacy, metadata
    )
    select
      p_bakery_id, item.id, 'production_usage', -v_usage.quantity, item.unit,
      item.average_unit_cost_cents, v_line_cost_cents, v_actor_id, v_source_key,
      'packaging_checkpoint', btrim(p_checkpoint_key), v_fingerprint,
      p_order_id, p_order_item_id, p_notes, true, false,
      jsonb_build_object('checkpoint_key', btrim(p_checkpoint_key))
    from public.ingredients item
    where item.bakery_id = p_bakery_id and item.id = v_usage.item_id;

    update public.ingredients
    set on_hand = on_hand - v_usage.quantity,
        updated_at = now()
    where bakery_id = p_bakery_id and id = v_usage.item_id;

    v_usage_total_cost_cents := v_usage_total_cost_cents + v_line_cost_cents;
  end loop;

  select * into v_finished_good
  from public.ingredients item
  where item.bakery_id = p_bakery_id
    and item.id = p_finished_good_item_id
    and item.kind = 'finished_good'
  for update;

  if not found then
    raise exception 'Finished-good output item does not belong to the active bakery.'
      using errcode = '23503';
  end if;

  if v_finished_good.recipe_id is distinct from v_order_item.recipe_id then
    raise exception 'Finished-good item recipe does not match the order item recipe.'
      using errcode = '23503';
  end if;

  v_output_unit_cost_cents := round(v_usage_total_cost_cents / p_output_quantity, 6);
  if v_finished_good.on_hand > 0 then
    v_new_output_average := round(
      ((v_finished_good.on_hand * v_finished_good.average_unit_cost_cents)
        + v_usage_total_cost_cents)
      / (v_finished_good.on_hand + p_output_quantity),
      6
    );
  else
    v_new_output_average := v_output_unit_cost_cents;
  end if;

  insert into public.inventory_transactions (
    bakery_id, item_id, transaction_type, quantity_change, base_unit,
    unit_cost_cents, total_cost_cents, actor_id, source_key, source_type,
    source_id, request_fingerprint, order_id, order_item_id,
    allocation_order_id, allocation_order_item_id, allocation_status,
    notes, affects_financials, is_legacy, metadata
  ) values (
    p_bakery_id, p_finished_good_item_id, 'production_output',
    p_output_quantity, v_finished_good.unit, v_output_unit_cost_cents,
    v_usage_total_cost_cents, v_actor_id, v_source_key,
    'packaging_checkpoint', btrim(p_checkpoint_key), v_fingerprint,
    p_order_id, p_order_item_id,
    case when p_allocate_to_order then p_order_id else null end,
    case when p_allocate_to_order then p_order_item_id else null end,
    case when p_allocate_to_order then 'allocated' else 'available' end,
    p_notes, false, false,
    jsonb_build_object('checkpoint_key', btrim(p_checkpoint_key))
  )
  returning id into v_output_transaction_id;

  update public.ingredients
  set on_hand = on_hand + p_output_quantity,
      reserved = reserved + case when p_allocate_to_order then p_output_quantity else 0 end,
      average_unit_cost_cents = v_new_output_average,
      updated_at = now()
  where bakery_id = p_bakery_id and id = p_finished_good_item_id;

  v_fulfilled_count := private.fulfill_inventory_reservations_internal(
    p_bakery_id,
    p_order_item_id,
    v_source_key || ':reservation',
    v_actor_id
  );

  return jsonb_build_object(
    'output_transaction_id', v_output_transaction_id,
    'idempotent', false,
    'source_key', v_source_key,
    'usage_total_cost_cents', v_usage_total_cost_cents,
    'fulfilled_reservation_count', v_fulfilled_count
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Bakery-member RLS, append-only grants, and RPC privileges
-- ---------------------------------------------------------------------------

alter table public.ingredients enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_requirements enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Users can view ingredients in their bakeries"
  on public.ingredients;
drop policy if exists "Users can insert/update ingredients in their bakeries"
  on public.ingredients;
drop policy if exists ingredients_members_select on public.ingredients;
drop policy if exists ingredients_members_insert on public.ingredients;
drop policy if exists ingredients_members_update on public.ingredients;

create policy ingredients_members_select
  on public.ingredients for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));
create policy ingredients_members_insert
  on public.ingredients for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));
create policy ingredients_members_update
  on public.ingredients for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

drop policy if exists inventory_transactions_select_members
  on public.inventory_transactions;
drop policy if exists inventory_transactions_insert_members
  on public.inventory_transactions;
drop policy if exists inventory_transactions_update_members
  on public.inventory_transactions;
drop policy if exists inventory_transactions_delete_members
  on public.inventory_transactions;

create policy inventory_transactions_select_members
  on public.inventory_transactions for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

drop policy if exists inventory_requirements_members_all
  on public.inventory_requirements;
drop policy if exists inventory_requirements_select_members
  on public.inventory_requirements;

create policy inventory_requirements_select_members
  on public.inventory_requirements for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

drop policy if exists "Users can record inventory movements in their bakeries"
  on public.inventory_movements;

revoke all on table public.ingredients from anon, authenticated;
grant select on table public.ingredients to authenticated;
grant insert (
  id, bakery_id, name, unit, package_quantity, package_price, min_level, kind,
  recipe_id
) on table public.ingredients to authenticated;
grant update (
  name, unit, package_quantity, package_price, min_level, kind, recipe_id,
  updated_at
) on table public.ingredients to authenticated;

revoke all on table public.inventory_transactions from anon, authenticated;
grant select on table public.inventory_transactions to authenticated;

revoke all on table public.inventory_requirements from anon, authenticated;
grant select on table public.inventory_requirements to authenticated;

revoke all on table public.inventory_movements from anon, authenticated;
grant select on table public.inventory_movements to authenticated;

revoke all on function public.receive_inventory_stock(
  uuid, uuid, numeric, numeric, text, numeric, text, text, text
) from public, anon;
grant execute on function public.receive_inventory_stock(
  uuid, uuid, numeric, numeric, text, numeric, text, text, text
) to authenticated;

revoke all on function public.adjust_inventory_stock(
  uuid, uuid, text, numeric, text, text, text
) from public, anon;
grant execute on function public.adjust_inventory_stock(
  uuid, uuid, text, numeric, text, text, text
) to authenticated;

revoke all on function public.reserve_inventory_for_prep_day(
  uuid, uuid, uuid, date, text, jsonb
) from public, anon;
grant execute on function public.reserve_inventory_for_prep_day(
  uuid, uuid, uuid, date, text, jsonb
) to authenticated;

revoke all on function public.fulfill_inventory_reservation(uuid, uuid, text)
  from public, anon;
grant execute on function public.fulfill_inventory_reservation(uuid, uuid, text)
  to authenticated;

revoke all on function public.complete_inventory_packaging_checkpoint(
  uuid, uuid, uuid, text, jsonb, uuid, numeric, boolean, text
) from public, anon;
grant execute on function public.complete_inventory_packaging_checkpoint(
  uuid, uuid, uuid, text, jsonb, uuid, numeric, boolean, text
) to authenticated;
