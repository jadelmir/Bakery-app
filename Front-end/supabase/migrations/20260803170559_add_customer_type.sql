-- Persist the customer segment selected by the authenticated directory.
-- Existing rows are treated as retail until an owner edits them.
alter table public.customers
  add column if not exists type text not null default 'retail';

alter table public.customers
  drop constraint if exists customers_type_check;

alter table public.customers
  add constraint customers_type_check
  check (type in ('wholesale', 'retail'));
