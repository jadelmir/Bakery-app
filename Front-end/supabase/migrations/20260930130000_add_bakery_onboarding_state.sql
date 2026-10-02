-- Persist only owner onboarding markers. Readiness remains derived from the
-- bakery's existing recipes, materials, orders, and Prep List records.
create table public.bakery_onboarding_states (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dismissed_at timestamptz,
  completed_at timestamptz,
  prep_list_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bakery_onboarding_states_user_bakery_key unique (user_id, bakery_id)
);

create index bakery_onboarding_states_bakery_idx
  on public.bakery_onboarding_states (bakery_id);

create trigger bakery_onboarding_states_set_updated_at
before update on public.bakery_onboarding_states
for each row execute function private.set_updated_at();

alter table public.bakery_onboarding_states enable row level security;

create policy bakery_onboarding_states_select_owner
on public.bakery_onboarding_states for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.has_bakery_role(bakery_id, array['owner']))
);

create policy bakery_onboarding_states_insert_owner
on public.bakery_onboarding_states for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.has_bakery_role(bakery_id, array['owner']))
);

create policy bakery_onboarding_states_update_owner
on public.bakery_onboarding_states for update to authenticated
using (
  user_id = (select auth.uid())
  and (select private.has_bakery_role(bakery_id, array['owner']))
)
with check (
  user_id = (select auth.uid())
  and (select private.has_bakery_role(bakery_id, array['owner']))
);

grant select, insert, update on table public.bakery_onboarding_states to authenticated;
