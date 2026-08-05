begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(7);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'additional-owner@example.com',
  crypt('password', gen_salt('bf')),
  now(), now(), now(), '{}', '{}'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000007","email":"additional-owner@example.com","role":"authenticated"}',
  true
);

select extensions.lives_ok(
  $$select public.create_default_bakery('Original Contract Bakery')$$,
  'Authenticated default onboarding creates the original bakery through the public RPC'
);

select extensions.ok(
  public.create_additional_bakery('Additional Contract Bakery') is distinct from (
    select id from public.bakeries where name = 'Original Contract Bakery'
  ),
  'Authenticated explicit creation returns a new bakery ID through the public RPC'
);

select extensions.is(
  (select count(*)::integer from public.bakeries where name = 'Original Contract Bakery'),
  1,
  'The original bakery remains accessible after explicit creation'
);

select extensions.is(
  (select count(*)::integer from public.bakeries where name = 'Additional Contract Bakery'),
  1,
  'The additional bakery is accessible after explicit creation'
);

select extensions.is(
  (select count(*)::integer
   from public.bakery_memberships
   where user_id = '10000000-0000-0000-0000-000000000007'),
  2,
  'Explicit creation retains the original membership and adds one membership'
);

select extensions.is(
  (select count(*)::integer
   from public.bakery_memberships membership
   join public.bakeries bakery on bakery.id = membership.bakery_id
   where membership.user_id = '10000000-0000-0000-0000-000000000007'
     and bakery.name = 'Additional Contract Bakery'
     and membership.role = 'owner'),
  1,
  'Explicit creation creates exactly one owner membership for the additional bakery'
);

select extensions.is(
  (select default_bakery_id
   from public.profiles
   where id = '10000000-0000-0000-0000-000000000007'),
  (select id from public.bakeries where name = 'Original Contract Bakery'),
  'Explicit creation preserves the original default bakery'
);

select * from extensions.finish();
rollback;
