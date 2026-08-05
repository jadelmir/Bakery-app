-- Explicit bakery creation must always create a new workspace. Keep the
-- operation behind the existing authenticated public invoker wrapper while
-- preserving the caller's existing default bakery when adding another one.
create or replace function private.create_default_bakery(bakery_name text default 'My Bakery')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  new_bakery_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(bakery_name, ''))) not between 1 and 120 then
    raise exception 'Bakery name must be between 1 and 120 characters'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller_id::text, 0));

  insert into public.bakeries (name, created_by)
  values (btrim(bakery_name), caller_id)
  returning id into new_bakery_id;

  insert into public.bakery_memberships (bakery_id, user_id, role)
  values (new_bakery_id, caller_id, 'owner');

  insert into public.profiles (id, email, default_bakery_id)
  select caller_id, lower(btrim(user_record.email)), new_bakery_id
  from auth.users user_record
  where user_record.id = caller_id
  on conflict (id) do update
    set default_bakery_id = coalesce(public.profiles.default_bakery_id, excluded.default_bakery_id);

  return new_bakery_id;
end;
$$;

revoke all on function private.create_default_bakery(text) from public, anon;
grant execute on function private.create_default_bakery(text) to authenticated;
