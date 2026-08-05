-- Least-privilege workspace grants, trusted profile lifecycle, durable
-- invitation expiry outcomes, and atomic ownership transfer.

revoke insert, delete on table public.profiles from authenticated;
revoke insert on table public.bakeries from authenticated;
revoke insert, update, delete on table public.bakery_memberships from authenticated;
revoke insert, update, delete on table public.bakery_invitations from authenticated;

drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_delete_self on public.profiles;

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete restrict;

create or replace function private.protect_profile_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Profiles can be deleted only through the approved account lifecycle'
      using errcode = '42501';
  end if;
  if new.id <> old.id then
    raise exception 'Profile identity is immutable' using errcode = '23514';
  end if;
  if new.email <> old.email and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Profile email is managed by Supabase Auth' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_identity
before update or delete on public.profiles
for each row execute function private.protect_profile_identity();

revoke all on function private.protect_profile_identity() from public, anon, authenticated;

create or replace function private.current_verified_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(btrim(auth_user.email))
  from auth.users auth_user
  where auth_user.id = (select auth.uid())
    and auth_user.email is not null
    and auth_user.email_confirmed_at is not null;
$$;

revoke all on function private.current_verified_email() from public, anon, authenticated;

drop function public.accept_bakery_invitation(text);
drop function public.decline_bakery_invitation(text);
drop function private.accept_bakery_invitation(text);
drop function private.decline_bakery_invitation(text);

create function private.accept_bakery_invitation(invitation_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := private.current_verified_email();
  invitation public.bakery_invitations;
begin
  if caller_id is null or caller_email is null then
    return jsonb_build_object('status', 'email_unverified');
  end if;

  select * into invitation
  from public.bakery_invitations
  where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex')
  for update;

  if not found or invitation.status <> 'pending' then
    return jsonb_build_object('status', 'invalid');
  end if;
  if invitation.expires_at <= now() then
    update public.bakery_invitations
    set status = 'expired'
    where id = invitation.id;
    return jsonb_build_object('status', 'expired');
  end if;
  if invitation.normalized_email <> caller_email then
    return jsonb_build_object('status', 'email_mismatch');
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

  return jsonb_build_object(
    'status', 'accepted',
    'bakery_id', invitation.bakery_id
  );
end;
$$;

create function private.decline_bakery_invitation(invitation_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text := private.current_verified_email();
  invitation public.bakery_invitations;
begin
  if caller_id is null or caller_email is null then
    return jsonb_build_object('status', 'email_unverified');
  end if;

  select * into invitation
  from public.bakery_invitations
  where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex')
  for update;

  if not found or invitation.status <> 'pending' then
    return jsonb_build_object('status', 'invalid');
  end if;
  if invitation.expires_at <= now() then
    update public.bakery_invitations
    set status = 'expired'
    where id = invitation.id;
    return jsonb_build_object('status', 'expired');
  end if;
  if invitation.normalized_email <> caller_email then
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  update public.bakery_invitations
  set status = 'declined', declined_at = now()
  where id = invitation.id;

  return jsonb_build_object('status', 'declined');
end;
$$;

create function public.accept_bakery_invitation(invitation_token text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.accept_bakery_invitation(invitation_token) $$;

create function public.decline_bakery_invitation(invitation_token text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.decline_bakery_invitation(invitation_token) $$;

revoke all on function private.accept_bakery_invitation(text) from public, anon;
revoke all on function private.decline_bakery_invitation(text) from public, anon;
revoke all on function public.accept_bakery_invitation(text) from public, anon;
revoke all on function public.decline_bakery_invitation(text) from public, anon;
grant execute on function private.accept_bakery_invitation(text) to authenticated;
grant execute on function private.decline_bakery_invitation(text) to authenticated;
grant execute on function public.accept_bakery_invitation(text) to authenticated;
grant execute on function public.decline_bakery_invitation(text) to authenticated;

create function private.transfer_bakery_ownership(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target public.bakery_memberships;
  caller_membership public.bakery_memberships;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into target
  from public.bakery_memberships
  where id = target_membership_id
  for update;
  if not found then
    raise exception 'Membership not found' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target.bakery_id::text, 0));

  select * into caller_membership
  from public.bakery_memberships
  where bakery_id = target.bakery_id and user_id = caller_id
  for update;

  if caller_membership.role <> 'owner' then
    raise exception 'Only an owner can transfer ownership' using errcode = '42501';
  end if;
  if caller_membership.id = target.id then
    raise exception 'Choose another member as the new owner' using errcode = '22023';
  end if;

  update public.bakery_memberships set role = 'owner' where id = target.id;
  update public.bakery_memberships set role = 'manager' where id = caller_membership.id;
end;
$$;

create function public.transfer_bakery_ownership(target_membership_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.transfer_bakery_ownership(target_membership_id) $$;

revoke all on function private.transfer_bakery_ownership(uuid) from public, anon;
revoke all on function public.transfer_bakery_ownership(uuid) from public, anon;
grant execute on function private.transfer_bakery_ownership(uuid) to authenticated;
grant execute on function public.transfer_bakery_ownership(uuid) to authenticated;
