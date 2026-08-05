-- Keep browser-callable RPCs SECURITY INVOKER while moving their privileged,
-- explicitly authenticated implementations into the non-exposed private
-- schema. This preserves transactional behavior and removes exposed
-- SECURITY DEFINER functions from the Data API.

alter function public.create_default_bakery(text) set schema private;
alter function public.set_default_bakery(uuid) set schema private;
alter function public.accept_bakery_invitation(text) set schema private;
alter function public.decline_bakery_invitation(text) set schema private;
alter function public.revoke_bakery_invitation(uuid) set schema private;
alter function public.update_bakery_member_role(uuid, text) set schema private;
alter function public.remove_bakery_member(uuid) set schema private;

revoke all on function private.create_default_bakery(text) from public, anon;
revoke all on function private.set_default_bakery(uuid) from public, anon;
revoke all on function private.accept_bakery_invitation(text) from public, anon;
revoke all on function private.decline_bakery_invitation(text) from public, anon;
revoke all on function private.revoke_bakery_invitation(uuid) from public, anon;
revoke all on function private.update_bakery_member_role(uuid, text) from public, anon;
revoke all on function private.remove_bakery_member(uuid) from public, anon;

grant execute on function private.create_default_bakery(text) to authenticated;
grant execute on function private.set_default_bakery(uuid) to authenticated;
grant execute on function private.accept_bakery_invitation(text) to authenticated;
grant execute on function private.decline_bakery_invitation(text) to authenticated;
grant execute on function private.revoke_bakery_invitation(uuid) to authenticated;
grant execute on function private.update_bakery_member_role(uuid, text) to authenticated;
grant execute on function private.remove_bakery_member(uuid) to authenticated;

create function public.create_default_bakery(bakery_name text default 'My Bakery')
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.create_default_bakery(bakery_name) $$;

create function public.set_default_bakery(target_bakery_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.set_default_bakery(target_bakery_id) $$;

create function public.accept_bakery_invitation(invitation_token text)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.accept_bakery_invitation(invitation_token) $$;

create function public.decline_bakery_invitation(invitation_token text)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.decline_bakery_invitation(invitation_token) $$;

create function public.revoke_bakery_invitation(invitation_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.revoke_bakery_invitation(invitation_id) $$;

create function public.update_bakery_member_role(membership_id uuid, new_role text)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.update_bakery_member_role(membership_id, new_role) $$;

create function public.remove_bakery_member(membership_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.remove_bakery_member(membership_id) $$;

revoke all on function public.create_default_bakery(text) from public, anon;
revoke all on function public.set_default_bakery(uuid) from public, anon;
revoke all on function public.accept_bakery_invitation(text) from public, anon;
revoke all on function public.decline_bakery_invitation(text) from public, anon;
revoke all on function public.revoke_bakery_invitation(uuid) from public, anon;
revoke all on function public.update_bakery_member_role(uuid, text) from public, anon;
revoke all on function public.remove_bakery_member(uuid) from public, anon;

grant execute on function public.create_default_bakery(text) to authenticated;
grant execute on function public.set_default_bakery(uuid) to authenticated;
grant execute on function public.accept_bakery_invitation(text) to authenticated;
grant execute on function public.decline_bakery_invitation(text) to authenticated;
grant execute on function public.revoke_bakery_invitation(uuid) to authenticated;
grant execute on function public.update_bakery_member_role(uuid, text) to authenticated;
grant execute on function public.remove_bakery_member(uuid) to authenticated;
