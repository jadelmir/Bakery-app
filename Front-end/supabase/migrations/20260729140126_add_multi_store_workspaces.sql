-- Multi-store workspace foundation.
-- Authorization is derived from current membership rows, never client state or
-- user-editable Auth metadata.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  default_bakery_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_normalized check (email = lower(btrim(email)))
);

create table public.bakeries (
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

create table public.bakery_memberships (
  id uuid primary key default gen_random_uuid(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bakery_memberships_bakery_user_key unique (bakery_id, user_id),
  constraint bakery_memberships_role_check check (role in ('owner', 'manager', 'staff'))
);

create table public.bakery_invitations (
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
  constraint bakery_invitations_email_normalized
    check (normalized_email = lower(btrim(email))),
  constraint bakery_invitations_role_check check (role in ('owner', 'manager', 'staff')),
  constraint bakery_invitations_status_check
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  constraint bakery_invitations_token_hash_key unique (token_hash),
  constraint bakery_invitations_expiry_after_creation check (expires_at > created_at)
);

alter table public.profiles
  add constraint profiles_default_bakery_id_fkey
  foreign key (default_bakery_id) references public.bakeries(id) on delete set null;

create index profiles_default_bakery_id_idx
  on public.profiles (default_bakery_id);
create index bakeries_created_by_idx
  on public.bakeries (created_by);
create index bakery_memberships_user_bakery_idx
  on public.bakery_memberships (user_id, bakery_id);
create index bakery_memberships_bakery_role_idx
  on public.bakery_memberships (bakery_id, role);
create index bakery_invitations_bakery_status_created_idx
  on public.bakery_invitations (bakery_id, status, created_at desc);
create index bakery_invitations_email_status_idx
  on public.bakery_invitations (normalized_email, status);
create index bakery_invitations_invited_by_created_idx
  on public.bakery_invitations (invited_by, created_at desc);
create unique index bakery_invitations_pending_email_key
  on public.bakery_invitations (bakery_id, normalized_email)
  where status = 'pending';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger bakeries_set_updated_at
before update on public.bakeries
for each row execute function private.set_updated_at();
create trigger bakery_memberships_set_updated_at
before update on public.bakery_memberships
for each row execute function private.set_updated_at();
create trigger bakery_invitations_set_updated_at
before update on public.bakery_invitations
for each row execute function private.set_updated_at();

create or replace function private.protect_bakery_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.created_by <> old.created_by then
    raise exception 'Bakery identity fields are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bakeries_protect_identity
before update on public.bakeries
for each row execute function private.protect_bakery_identity();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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

create trigger on_auth_user_created_workspace_profile
after insert or update of email on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, email, full_name)
select
  id,
  lower(btrim(coalesce(email, ''))),
  nullif(btrim(coalesce(raw_user_meta_data ->> 'full_name', '')), '')
from auth.users
where email is not null
on conflict (id) do nothing;

create or replace function private.is_bakery_member(target_bakery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.bakery_memberships membership
      where membership.bakery_id = target_bakery_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.has_bakery_role(
  target_bakery_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.bakery_memberships membership
      where membership.bakery_id = target_bakery_id
        and membership.user_id = (select auth.uid())
        and membership.role = any(allowed_roles)
    );
$$;

create or replace function private.shares_bakery_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.bakery_memberships mine
      join public.bakery_memberships theirs
        on theirs.bakery_id = mine.bakery_id
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

alter table public.profiles enable row level security;
alter table public.bakeries enable row level security;
alter table public.bakery_memberships enable row level security;
alter table public.bakery_invitations enable row level security;

create policy profiles_select_shared_bakery
on public.profiles for select to authenticated
using ((select private.shares_bakery_with(id)));
create policy profiles_insert_self
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and (
    default_bakery_id is null
    or (select private.is_bakery_member(default_bakery_id))
  )
);
create policy profiles_delete_self
on public.profiles for delete to authenticated
using (id = (select auth.uid()));

create policy bakeries_select_members
on public.bakeries for select to authenticated
using ((select private.is_bakery_member(id)));
create policy bakeries_insert_via_operation
on public.bakeries for insert to authenticated
with check (false);
create policy bakeries_update_managers
on public.bakeries for update to authenticated
using ((select private.has_bakery_role(id, array['owner', 'manager'])))
with check ((select private.has_bakery_role(id, array['owner', 'manager'])));
create policy bakeries_delete_owners
on public.bakeries for delete to authenticated
using ((select private.has_bakery_role(id, array['owner'])));

create policy bakery_memberships_select_members
on public.bakery_memberships for select to authenticated
using ((select private.is_bakery_member(bakery_id)));
create policy bakery_memberships_insert_via_operation
on public.bakery_memberships for insert to authenticated
with check (false);
create policy bakery_memberships_update_via_operation
on public.bakery_memberships for update to authenticated
using (false) with check (false);
create policy bakery_memberships_delete_via_operation
on public.bakery_memberships for delete to authenticated
using (false);

create policy bakery_invitations_select_team
on public.bakery_invitations for select to authenticated
using ((select private.has_bakery_role(bakery_id, array['owner', 'manager'])));
create policy bakery_invitations_insert_via_operation
on public.bakery_invitations for insert to authenticated
with check (false);
create policy bakery_invitations_update_via_operation
on public.bakery_invitations for update to authenticated
using (false) with check (false);
create policy bakery_invitations_delete_via_operation
on public.bakery_invitations for delete to authenticated
using (false);

revoke all on table public.profiles from anon;
revoke all on table public.bakeries from anon;
revoke all on table public.bakery_memberships from anon;
revoke all on table public.bakery_invitations from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.bakeries to authenticated;
grant select, insert, update, delete on table public.bakery_memberships to authenticated;
grant select, insert, update, delete on table public.bakery_invitations to authenticated;

create or replace function public.create_default_bakery(bakery_name text default 'My Bakery')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  existing_bakery_id uuid;
  new_bakery_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

  select membership.bakery_id
    into existing_bakery_id
  from public.bakery_memberships membership
  where membership.user_id = caller_id
  order by membership.created_at, membership.bakery_id
  limit 1;

  if existing_bakery_id is not null then
    update public.profiles
    set default_bakery_id = coalesce(default_bakery_id, existing_bakery_id)
    where id = caller_id;
    return existing_bakery_id;
  end if;

  if char_length(btrim(coalesce(bakery_name, ''))) not between 1 and 120 then
    raise exception 'Bakery name must be between 1 and 120 characters'
      using errcode = '22023';
  end if;

  insert into public.bakeries (name, created_by)
  values (btrim(bakery_name), caller_id)
  returning id into new_bakery_id;

  insert into public.bakery_memberships (bakery_id, user_id, role)
  values (new_bakery_id, caller_id, 'owner');

  insert into public.profiles (id, email, default_bakery_id)
  select caller_id, lower(btrim(user_record.email)), new_bakery_id
  from auth.users user_record
  where user_record.id = caller_id
  on conflict (id) do update set default_bakery_id = excluded.default_bakery_id;

  return new_bakery_id;
end;
$$;

create or replace function public.set_default_bakery(target_bakery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null
    or not exists (
      select 1 from public.bakery_memberships
      where bakery_id = target_bakery_id and user_id = caller_id
    )
  then
    raise exception 'Bakery membership required' using errcode = '42501';
  end if;

  update public.profiles
  set default_bakery_id = target_bakery_id
  where id = caller_id;
end;
$$;

create or replace function public.create_bakery_invitation(
  inviter_user_id uuid,
  target_bakery_id uuid,
  invite_email text,
  invite_role text,
  invite_token_hash text,
  invitation_expires_at timestamptz
)
returns public.bakery_invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
  normalized_invite_email text := lower(btrim(invite_email));
  created_invitation public.bakery_invitations;
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Server-controlled invitation operation required'
      using errcode = '42501';
  end if;

  select role into caller_role
  from public.bakery_memberships
  where bakery_id = target_bakery_id and user_id = inviter_user_id;

  if caller_role not in ('owner', 'manager')
    or (caller_role = 'manager' and invite_role <> 'staff')
    or invite_role not in ('owner', 'manager', 'staff')
  then
    raise exception 'Insufficient role to send this invitation' using errcode = '42501';
  end if;

  if normalized_invite_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if invitation_expires_at <= now()
    or invitation_expires_at > now() + interval '14 days'
  then
    raise exception 'Invitation expiry is outside the allowed window' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.bakery_memberships membership
    join public.profiles profile on profile.id = membership.user_id
    where membership.bakery_id = target_bakery_id
      and profile.email = normalized_invite_email
  ) then
    raise exception 'This person is already a bakery member' using errcode = '23505';
  end if;

  if (
    select count(*) from public.bakery_invitations
    where invited_by = inviter_user_id and created_at > now() - interval '1 hour'
  ) >= 20
    or (
      select count(*) from public.bakery_invitations
      where bakery_id = target_bakery_id and created_at > now() - interval '1 hour'
    ) >= 50
  then
    raise exception 'Invitation rate limit reached' using errcode = 'P0001';
  end if;

  insert into public.bakery_invitations (
    bakery_id, email, normalized_email, role, token_hash, invited_by, expires_at
  )
  values (
    target_bakery_id, btrim(invite_email), normalized_invite_email, invite_role,
    invite_token_hash, inviter_user_id, invitation_expires_at
  )
  returning * into created_invitation;

  return created_invitation;
exception
  when unique_violation then
    raise exception 'A pending invitation already exists for this email'
      using errcode = '23505';
end;
$$;

create or replace function public.accept_bakery_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  invitation public.bakery_invitations;
begin
  if caller_id is null or caller_email = '' then
    raise exception 'Authentication with a verified email is required'
      using errcode = '42501';
  end if;

  select * into invitation
  from public.bakery_invitations
  where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex')
  for update;

  if not found or invitation.status <> 'pending' then
    raise exception 'Invitation is invalid or already consumed' using errcode = '22023';
  end if;
  if invitation.expires_at <= now() then
    update public.bakery_invitations
      set status = 'expired'
      where id = invitation.id;
    raise exception 'Invitation has expired' using errcode = '22023';
  end if;
  if invitation.normalized_email <> caller_email then
    raise exception 'Sign in with the invited email address' using errcode = '42501';
  end if;

  insert into public.bakery_memberships (bakery_id, user_id, role)
  values (invitation.bakery_id, caller_id, invitation.role)
  on conflict (bakery_id, user_id) do nothing;

  update public.bakery_invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation.id;

  update public.profiles
  set default_bakery_id = coalesce(default_bakery_id, invitation.bakery_id)
  where id = caller_id;

  return invitation.bakery_id;
end;
$$;

create or replace function public.decline_bakery_invitation(invitation_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  invitation public.bakery_invitations;
begin
  if caller_id is null or caller_email = '' then
    raise exception 'Authentication with a verified email is required'
      using errcode = '42501';
  end if;

  select * into invitation
  from public.bakery_invitations
  where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex')
  for update;

  if not found or invitation.status <> 'pending'
    or invitation.expires_at <= now()
    or invitation.normalized_email <> caller_email
  then
    raise exception 'Invitation is invalid for this account' using errcode = '22023';
  end if;

  update public.bakery_invitations
  set status = 'declined', declined_at = now()
  where id = invitation.id;
end;
$$;

create or replace function public.revoke_bakery_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.bakery_invitations;
begin
  select * into invitation
  from public.bakery_invitations
  where id = invitation_id
  for update;

  if not found or invitation.status <> 'pending' then
    raise exception 'Pending invitation not found' using errcode = '22023';
  end if;
  if not private.has_bakery_role(invitation.bakery_id, array['owner', 'manager']) then
    raise exception 'Insufficient role to revoke invitation' using errcode = '42501';
  end if;
  if (
    select role from public.bakery_memberships
    where bakery_id = invitation.bakery_id and user_id = (select auth.uid())
  ) = 'manager' and invitation.role <> 'staff' then
    raise exception 'Managers may revoke Staff invitations only' using errcode = '42501';
  end if;

  update public.bakery_invitations
  set status = 'revoked', revoked_at = now()
  where id = invitation.id;
end;
$$;

create or replace function public.update_bakery_member_role(
  membership_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.bakery_memberships;
  caller_role text;
begin
  if new_role not in ('owner', 'manager', 'staff') then
    raise exception 'Invalid bakery role' using errcode = '22023';
  end if;

  select * into target
  from public.bakery_memberships
  where id = membership_id
  for update;
  if not found then
    raise exception 'Membership not found' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target.bakery_id::text, 0));
  select role into caller_role
  from public.bakery_memberships
  where bakery_id = target.bakery_id and user_id = (select auth.uid());

  if caller_role = 'owner' then
    null;
  elsif caller_role = 'manager' and target.role = 'staff' and new_role = 'staff' then
    null;
  else
    raise exception 'Insufficient role to change this membership' using errcode = '42501';
  end if;

  if target.role = 'owner' and new_role <> 'owner'
    and (
      select count(*) from public.bakery_memberships
      where bakery_id = target.bakery_id and role = 'owner'
    ) <= 1
  then
    raise exception 'A bakery must retain at least one owner' using errcode = '23514';
  end if;

  update public.bakery_memberships set role = new_role where id = membership_id;
end;
$$;

create or replace function public.remove_bakery_member(membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.bakery_memberships;
  caller_role text;
begin
  select * into target
  from public.bakery_memberships
  where id = membership_id
  for update;
  if not found then
    raise exception 'Membership not found' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target.bakery_id::text, 0));
  select role into caller_role
  from public.bakery_memberships
  where bakery_id = target.bakery_id and user_id = (select auth.uid());

  if caller_role = 'owner' then
    null;
  elsif caller_role = 'manager' and target.role = 'staff' then
    null;
  else
    raise exception 'Insufficient role to remove this membership' using errcode = '42501';
  end if;

  if target.role = 'owner'
    and (
      select count(*) from public.bakery_memberships
      where bakery_id = target.bakery_id and role = 'owner'
    ) <= 1
  then
    raise exception 'A bakery must retain at least one owner' using errcode = '23514';
  end if;

  delete from public.bakery_memberships where id = membership_id;
  update public.profiles
  set default_bakery_id = null
  where id = target.user_id and default_bakery_id = target.bakery_id;
end;
$$;

revoke all on function public.create_default_bakery(text) from public, anon;
revoke all on function public.set_default_bakery(uuid) from public, anon;
revoke all on function public.create_bakery_invitation(uuid, uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.accept_bakery_invitation(text) from public, anon;
revoke all on function public.decline_bakery_invitation(text) from public, anon;
revoke all on function public.revoke_bakery_invitation(uuid) from public, anon;
revoke all on function public.update_bakery_member_role(uuid, text) from public, anon;
revoke all on function public.remove_bakery_member(uuid) from public, anon;

grant execute on function public.create_default_bakery(text) to authenticated;
grant execute on function public.set_default_bakery(uuid) to authenticated;
grant execute on function public.create_bakery_invitation(uuid, uuid, text, text, text, timestamptz) to service_role;
grant execute on function public.accept_bakery_invitation(text) to authenticated;
grant execute on function public.decline_bakery_invitation(text) to authenticated;
grant execute on function public.revoke_bakery_invitation(uuid) to authenticated;
grant execute on function public.update_bakery_member_role(uuid, text) to authenticated;
grant execute on function public.remove_bakery_member(uuid) to authenticated;
