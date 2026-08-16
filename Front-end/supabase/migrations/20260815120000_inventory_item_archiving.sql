-- Remove an item from active inventory without deleting its ledger history.
alter table public.ingredients
  add column if not exists archived boolean not null default false;

create index if not exists ingredients_active_bakery_kind_name_idx
  on public.ingredients (bakery_id, kind, name)
  where archived = false;

grant update (
  name, unit, package_quantity, package_price, min_level, kind, recipe_id,
  archived, updated_at
) on table public.ingredients to authenticated;
