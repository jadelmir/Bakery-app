-- Forward-only repair for staging environments whose Supabase migration history
-- records the workspace foundation as applied while one or more foundational
-- objects are absent. This migration is intentionally additive and preserves
-- existing data.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Fail rather than silently coercing incompatible pre-existing tables.
do $$
declare
  mismatch text;
begin
  select format('%I.%I expected %s but found %s', c.table_name, c.column_name, c.expected_type, c.actual_type)
    into mismatch
  from (
    select 'profiles'::text table_name, 'id'::text column_name, 'uuid'::text expected_type,
           (select data_type from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') actual_type
    union all
    select 'bakeries','id','uuid',(select data_type from information_schema.columns where table_schema='public' and table_name='bakeries' and column_name='id')
    union all
    select 'bakery_memberships','id','uuid',(select data_type from information_schema.columns where table_schema='public' and table_name='bakery_memberships' and column_name='id')
    union all
    select 'bakery_invitations','id','uuid',(select data_type from information_schema.columns where table_schema='public' and table_name='bakery_invitations' and column_name='id')
  ) c
  where c.actual_type is not null and c.actual_type <> c.expected_type
  limit 1;

  if mismatch is not null then
    raise exception 'Workspace foundation repair stopped: %', mismatch;
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  default_bakery_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_normalized check (email = lower(btrim(email)))
);

create table if not exists public.bakeries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bakeries_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint bakeries_currency_iso check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.bakery_memberships (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bakery_memberships_bakery_user_key unique (bakery_id, user_id),
  constraint bakery_memberships_role_check check (role in ('owner', 'manager', 'staff'))
);

create table if not exists public.bakery_invitations (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  email text not null,
  normalized_email text not null,
  role text not null,
  status text not null default 'pending',
  token_hash text not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bakery_invitations_email_normalized check (normalized_email = lower(btrim(email))),
  constraint bakery_invitations_role_check check (role in ('owner', 'manager', 'staff')),
  constraint bakery_invitations_status_check check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  constraint bakery_invitations_token_hash_key unique (token_hash),
  constraint bakery_invitations_expiry_after_creation check (expires_at > created_at)
);

-- Existing tables must already contain the current required columns. Missing
-- required columns indicate a deeper incompatible partial migration and should
-- be repaired deliberately rather than guessed here.
do $$
declare
  missing text;
begin
  with required(table_name, column_name) as (
    values
      ('profiles','id'),('profiles','email'),('profiles','full_name'),('profiles','phone'),('profiles','default_bakery_id'),('profiles','created_at'),('profiles','updated_at'),
      ('bakeries','id'),('bakeries','name'),('bakeries','timezone'),('bakeries','currency'),('bakeries','created_by'),('bakeries','created_at'),('bakeries','updated_at'),
      ('bakery_memberships','id'),('bakery_memberships','bakery_id'),('bakery_memberships','user_id'),('bakery_memberships','role'),('bakery_memberships','created_at'),('bakery_memberships','updated_at'),
      ('bakery_invitations','id'),('bakery_invitations','bakery_id'),('bakery_invitations','email'),('bakery_invitations','normalized_email'),('bakery_invitations','role'),('bakery_invitations','status'),('bakery_invitations','token_hash'),('bakery_invitations','invited_by'),('bakery_invitations','expires_at'),('bakery_invitations','accepted_at'),('bakery_invitations','declined_at'),('bakery_invitations','revoked_at'),('bakery_invitations','created_at'),('bakery_invitations','updated_at')
  )
  select format('%s.%s', r.table_name, r.column_name) into missing
  from required r
  left join information_schema.columns c
    on c.table_schema='public' and c.table_name=r.table_name and c.column_name=r.column_name
  where c.column_name is null
  limit 1;

  if missing is not null then
    raise exception 'Workspace foundation repair stopped: required column % is missing from an existing table shape', missing;
  end if;
end $$;

-- Add the profile -> bakery foreign key only when missing.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_default_bakery_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_default_bakery_id_fkey
      foreign key (default_bakery_id) references public.bakeries(id) on delete set null;
  end if;
end $$;

create index if not exists profiles_default_bakery_id_idx on public.profiles (default_bakery_id);
create index if not exists bakeries_created_by_idx on public.bakeries (created_by);
create index if not exists bakery_memberships_user_bakery_idx on public.bakery_memberships (user_id, bakery_id);
create index if not exists bakery_memberships_bakery_role_idx on public.bakery_memberships (bakery_id, role);
create index if not exists bakery_invitations_bakery_status_created_idx on public.bakery_invitations (bakery_id, status, created_at desc);
create index if not exists bakery_invitations_email_status_idx on public.bakery_invitations (normalized_email, status);
create index if not exists bakery_invitations_invited_by_created_idx on public.bakery_invitations (invited_by, created_at desc);
create unique index if not exists bakery_invitations_pending_email_key on public.bakery_invitations (bakery_id, normalized_email) where status = 'pending';

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.protect_bakery_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.created_by <> old.created_by then
    raise exception 'Bakery identity fields are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(btrim(coalesce(new.email, ''))),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

create or replace function private.is_bakery_member(target_bakery_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.bakery_memberships membership
      where membership.bakery_id = target_bakery_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_bakery_role(target_bakery_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.bakery_memberships membership
      where membership.bakery_id = target_bakery_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.shares_bakery_with(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.bakery_memberships mine
      join public.bakery_memberships theirs on theirs.bakery_id = mine.bakery_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = target_user_id
    );
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.protect_bakery_identity() from public, anon, authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.is_bakery_member(uuid) from public, anon;
revoke all on function private.has_bakery_role(uuid, text[]) from public, anon;
revoke all on function private.shares_bakery_with(uuid) from public, anon;
grant execute on function private.is_bakery_member(uuid) to authenticated;
grant execute on function private.has_bakery_role(uuid, text[]) to authenticated;
grant execute on function private.shares_bakery_with(uuid) to authenticated;

-- Triggers are created only when absent; existing trigger definitions are left
-- untouched to avoid replacing legitimate later behavior.
do $$
begin
  if not exists (select 1 from pg_trigger where tgrelid='public.profiles'::regclass and tgname='profiles_set_updated_at' and not tgisinternal) then
    create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.bakeries'::regclass and tgname='bakeries_set_updated_at' and not tgisinternal) then
    create trigger bakeries_set_updated_at before update on public.bakeries for each row execute function private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.bakery_memberships'::regclass and tgname='bakery_memberships_set_updated_at' and not tgisinternal) then
    create trigger bakery_memberships_set_updated_at before update on public.bakery_memberships for each row execute function private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.bakery_invitations'::regclass and tgname='bakery_invitations_set_updated_at' and not tgisinternal) then
    create trigger bakery_invitations_set_updated_at before update on public.bakery_invitations for each row execute function private.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='public.bakeries'::regclass and tgname='bakeries_protect_identity' and not tgisinternal) then
    create trigger bakeries_protect_identity before update on public.bakeries for each row execute function private.protect_bakery_identity();
  end if;
  if not exists (select 1 from pg_trigger where tgrelid='auth.users'::regclass and tgname='on_auth_user_created_workspace_profile' and not tgisinternal) then
    create trigger on_auth_user_created_workspace_profile after insert or update of email on auth.users for each row execute function private.handle_new_auth_user();
  end if;
end $$;

-- Reconcile profiles for auth users that predate the repaired trigger.
insert into public.profiles (id, email, full_name)
select id,
       lower(btrim(coalesce(email, ''))),
       nullif(btrim(coalesce(raw_user_meta_data ->> 'full_name', '')), '')
from auth.users
where email is not null
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.bakeries enable row level security;
alter table public.bakery_memberships enable row level security;
alter table public.bakery_invitations enable row level security;

-- Guarded policy recreation: create only policies that are absent.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_shared_bakery') then
    create policy profiles_select_shared_bakery on public.profiles for select to authenticated using ((select private.shares_bakery_with(id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_self') then
    create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_self') then
    create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and (default_bakery_id is null or (select private.is_bakery_member(default_bakery_id))));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_delete_self') then
    create policy profiles_delete_self on public.profiles for delete to authenticated using (id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakeries' and policyname='bakeries_select_members') then
    create policy bakeries_select_members on public.bakeries for select to authenticated using ((select private.is_bakery_member(id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakeries' and policyname='bakeries_insert_via_operation') then
    create policy bakeries_insert_via_operation on public.bakeries for insert to authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakeries' and policyname='bakeries_update_managers') then
    create policy bakeries_update_managers on public.bakeries for update to authenticated using ((select private.has_bakery_role(id, array['owner','manager']))) with check ((select private.has_bakery_role(id, array['owner','manager'])));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakeries' and policyname='bakeries_delete_owners') then
    create policy bakeries_delete_owners on public.bakeries for delete to authenticated using ((select private.has_bakery_role(id, array['owner'])));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_memberships' and policyname='bakery_memberships_select_members') then
    create policy bakery_memberships_select_members on public.bakery_memberships for select to authenticated using ((select private.is_bakery_member(bakery_id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_memberships' and policyname='bakery_memberships_insert_via_operation') then
    create policy bakery_memberships_insert_via_operation on public.bakery_memberships for insert to authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_memberships' and policyname='bakery_memberships_update_via_operation') then
    create policy bakery_memberships_update_via_operation on public.bakery_memberships for update to authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_memberships' and policyname='bakery_memberships_delete_via_operation') then
    create policy bakery_memberships_delete_via_operation on public.bakery_memberships for delete to authenticated using (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_invitations' and policyname='bakery_invitations_select_team') then
    create policy bakery_invitations_select_team on public.bakery_invitations for select to authenticated using ((select private.has_bakery_role(bakery_id, array['owner','manager'])));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_invitations' and policyname='bakery_invitations_insert_via_operation') then
    create policy bakery_invitations_insert_via_operation on public.bakery_invitations for insert to authenticated with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_invitations' and policyname='bakery_invitations_update_via_operation') then
    create policy bakery_invitations_update_via_operation on public.bakery_invitations for update to authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bakery_invitations' and policyname='bakery_invitations_delete_via_operation') then
    create policy bakery_invitations_delete_via_operation on public.bakery_invitations for delete to authenticated using (false);
  end if;
end $$;

revoke all on table public.profiles from anon;
revoke all on table public.bakeries from anon;
revoke all on table public.bakery_memberships from anon;
revoke all on table public.bakery_invitations from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.bakeries to authenticated;
grant select, insert, update, delete on table public.bakery_memberships to authenticated;
grant select, insert, update, delete on table public.bakery_invitations to authenticated;
