-- Ingredients & Costing Schema (Phase B3)

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  name text not null,
  unit text not null default 'g',
  package_quantity numeric not null check (package_quantity > 0),
  package_price numeric not null check (package_price >= 0),
  cost_per_unit numeric not null generated always as (package_price / package_quantity) stored,
  on_hand numeric not null default 0 check (on_hand >= 0),
  min_level numeric not null default 0 check (min_level >= 0),
  kind text not null default 'ingredient' check (kind in ('ingredient', 'packaging')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_name_length check (char_length(btrim(name)) between 1 and 150)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity_change numeric not null,
  reason text not null check (reason in ('restock', 'waste', 'adjustment', 'task-deduction')),
  notes text,
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.ingredients enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Users can view ingredients in their bakeries"
  on public.ingredients for select
  using (
    exists (
      select 1 from public.bakery_memberships
      where bakery_memberships.bakery_id = ingredients.bakery_id
        and bakery_memberships.user_id = auth.uid()
    )
  );

create policy "Users can insert/update ingredients in their bakeries"
  on public.ingredients for all
  using (
    exists (
      select 1 from public.bakery_memberships
      where bakery_memberships.bakery_id = ingredients.bakery_id
        and bakery_memberships.user_id = auth.uid()
    )
  );

create policy "Users can view inventory movements in their bakeries"
  on public.inventory_movements for select
  using (
    exists (
      select 1 from public.bakery_memberships
      where bakery_memberships.bakery_id = inventory_movements.bakery_id
        and bakery_memberships.user_id = auth.uid()
    )
  );

create policy "Users can record inventory movements in their bakeries"
  on public.inventory_movements for insert
  with check (
    exists (
      select 1 from public.bakery_memberships
      where bakery_memberships.bakery_id = inventory_movements.bakery_id
        and bakery_memberships.user_id = auth.uid()
    )
  );

-- Grants
grant select, insert, update, delete on public.ingredients to authenticated;
grant select, insert on public.inventory_movements to authenticated;
