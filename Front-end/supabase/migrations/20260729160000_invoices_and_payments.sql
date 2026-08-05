-- Invoicing, Payments, and Payment Methods Schema (Phase F11 / B6 / B11)

-- 1. Tables Creation

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  invoice_number text not null,
  order_id uuid,
  customer_id uuid,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  tax_cents bigint not null default 0 check (tax_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  amount_paid_cents bigint not null default 0 check (amount_paid_cents >= 0),
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  public_token uuid not null default gen_random_uuid() unique,
  due_date timestamptz,
  notes text,
  customer_snapshot_json jsonb not null default '{}'::jsonb,
  bakery_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_bakery_number_key unique (bakery_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  total_price_cents bigint not null check (total_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'sent', 'viewed', 'payment_received', 'status_changed', 'cancelled')),
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bakery_payment_methods (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  method_type text not null check (method_type in ('zelle', 'paypal', 'cash', 'check', 'custom')),
  is_enabled boolean not null default true,
  instructions text,
  account_details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_payment_methods (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_method_id uuid not null references public.bakery_payment_methods(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint invoice_payment_methods_inv_pm_key unique (invoice_id, payment_method_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  order_id uuid,
  amount_cents bigint not null check (amount_cents > 0),
  payment_method text not null,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Indexes

create index if not exists invoices_bakery_status_idx on public.invoices (bakery_id, status);
create index if not exists invoices_public_token_idx on public.invoices (public_token);
create index if not exists invoices_order_id_idx on public.invoices (order_id);
create index if not exists invoices_customer_id_idx on public.invoices (customer_id);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index if not exists invoice_events_invoice_id_idx on public.invoice_events (invoice_id);

create index if not exists bakery_payment_methods_bakery_id_idx on public.bakery_payment_methods (bakery_id);
create index if not exists invoice_payment_methods_invoice_id_idx on public.invoice_payment_methods (invoice_id);

create index if not exists payments_bakery_id_idx on public.payments (bakery_id);
create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists payments_order_id_idx on public.payments (order_id);

-- 3. Triggers & Functions

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function private.set_updated_at();

create trigger bakery_payment_methods_set_updated_at
  before update on public.bakery_payment_methods
  for each row execute function private.set_updated_at();

create or replace function private.set_invoice_defaults_and_number()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  next_seq integer;
begin
  if new.public_token is null then
    new.public_token := gen_random_uuid();
  end if;

  if new.invoice_number is null or btrim(new.invoice_number) = '' then
    select coalesce(max(cast(substring(invoice_number from 5) as integer)), 0) + 1
    into next_seq
    from public.invoices
    where bakery_id = new.bakery_id
      and invoice_number ~ '^INV-[0-9]+$';

    new.invoice_number := 'INV-' || lpad(coalesce(next_seq, 1)::text, 6, '0');
  end if;

  if new.balance_cents is null or new.balance_cents = 0 then
    new.balance_cents := greatest(0, new.total_cents - new.amount_paid_cents);
  end if;

  return new;
end;
$$;

create trigger invoices_set_defaults
  before insert on public.invoices
  for each row execute function private.set_invoice_defaults_and_number();

create or replace function private.handle_payment_inserted()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  curr_total bigint;
  curr_paid bigint;
  new_paid bigint;
  new_balance bigint;
  new_status text;
begin
  if new.invoice_id is not null then
    select total_cents, amount_paid_cents into curr_total, curr_paid
    from public.invoices
    where id = new.invoice_id;

    if curr_total is not null then
      new_paid := coalesce(curr_paid, 0) + new.amount_cents;
      new_balance := greatest(0, curr_total - new_paid);

      if new_balance = 0 then
        new_status := 'paid';
      elsif new_paid > 0 then
        new_status := 'partially_paid';
      end if;

      update public.invoices
      set amount_paid_cents = new_paid,
          balance_cents = new_balance,
          status = coalesce(new_status, status),
          updated_at = now()
      where id = new.invoice_id;

      insert into public.invoice_events (invoice_id, event_type, description)
      values (
        new.invoice_id,
        'payment_received',
        'Payment of $' || trim(to_char(new.amount_cents / 100.0, 'FM999,999,990.00')) || ' recorded via ' || new.payment_method
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger payments_after_insert_update_invoice
  after insert on public.payments
  for each row execute function private.handle_payment_inserted();

-- 4. Row Level Security (RLS)

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_events enable row level security;
alter table public.bakery_payment_methods enable row level security;
alter table public.invoice_payment_methods enable row level security;
alter table public.payments enable row level security;

-- Invoices policies
create policy invoices_select_members
  on public.invoices for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy invoices_insert_members
  on public.invoices for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy invoices_update_members
  on public.invoices for update to authenticated
  using ((select private.is_bakery_member(bakery_id)))
  with check ((select private.is_bakery_member(bakery_id)));

create policy invoices_delete_members
  on public.invoices for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy invoices_select_public_token
  on public.invoices for select to anon, authenticated
  using (public_token is not null);

-- Invoice items policies
create policy invoice_items_select_members
  on public.invoice_items for select to authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and (select private.is_bakery_member(invoices.bakery_id))
  ));

create policy invoice_items_all_members
  on public.invoice_items for all to authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and (select private.is_bakery_member(invoices.bakery_id))
  ));

create policy invoice_items_select_public
  on public.invoice_items for select to anon, authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.public_token is not null
  ));

-- Invoice events policies
create policy invoice_events_select_members
  on public.invoice_events for select to authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_events.invoice_id
      and (select private.is_bakery_member(invoices.bakery_id))
  ));

create policy invoice_events_insert_all
  on public.invoice_events for insert to anon, authenticated
  with check (exists (
    select 1 from public.invoices
    where invoices.id = invoice_events.invoice_id
  ));

create policy invoice_events_select_public
  on public.invoice_events for select to anon, authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_events.invoice_id
      and invoices.public_token is not null
  ));

-- Bakery payment methods policies
create policy bakery_pm_select_members
  on public.bakery_payment_methods for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy bakery_pm_all_members
  on public.bakery_payment_methods for all to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy bakery_pm_select_public
  on public.bakery_payment_methods for select to anon, authenticated
  using (is_enabled = true);

-- Invoice payment methods policies
create policy invoice_pm_select_members
  on public.invoice_payment_methods for select to authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_payment_methods.invoice_id
      and (select private.is_bakery_member(invoices.bakery_id))
  ));

create policy invoice_pm_all_members
  on public.invoice_payment_methods for all to authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_payment_methods.invoice_id
      and (select private.is_bakery_member(invoices.bakery_id))
  ));

create policy invoice_pm_select_public
  on public.invoice_payment_methods for select to anon, authenticated
  using (exists (
    select 1 from public.invoices
    where invoices.id = invoice_payment_methods.invoice_id
      and invoices.public_token is not null
  ));

-- Payments policies
create policy payments_select_members
  on public.payments for select to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy payments_insert_members
  on public.payments for insert to authenticated
  with check ((select private.is_bakery_member(bakery_id)));

create policy payments_update_members
  on public.payments for update to authenticated
  using ((select private.is_bakery_member(bakery_id)));

create policy payments_delete_members
  on public.payments for delete to authenticated
  using ((select private.is_bakery_member(bakery_id)));

-- 5. Grants

grant select, insert, update, delete on public.invoices to authenticated;
grant select on public.invoices to anon;

grant select, insert, update, delete on public.invoice_items to authenticated;
grant select on public.invoice_items to anon;

grant select, insert, update, delete on public.invoice_events to authenticated;
grant select, insert on public.invoice_events to anon;

grant select, insert, update, delete on public.bakery_payment_methods to authenticated;
grant select on public.bakery_payment_methods to anon;

grant select, insert, update, delete on public.invoice_payment_methods to authenticated;
grant select on public.invoice_payment_methods to anon;

grant select, insert, update, delete on public.payments to authenticated;
