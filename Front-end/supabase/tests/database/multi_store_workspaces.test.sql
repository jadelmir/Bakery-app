begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(28);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff-a@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'new-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invitee@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'expired@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('20000000-0000-0000-0000-000000000001', 'Bakery A', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Bakery B', '10000000-0000-0000-0000-000000000003');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'staff'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'owner');

insert into public.bakery_invitations (
  id, bakery_id, email, normalized_email, role, token_hash, invited_by, expires_at
)
values (
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'invitee@example.com',
  'invitee@example.com',
  'staff',
  encode(digest('valid-invitation-token', 'sha256'), 'hex'),
  '10000000-0000-0000-0000-000000000001',
  now() + interval '7 days'
);
insert into public.bakery_invitations (
  id, bakery_id, email, normalized_email, role, token_hash, invited_by, expires_at, created_at
)
values
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'someone-else@example.com',
    'someone-else@example.com',
    'staff',
    encode(digest('mismatched-invitation-token', 'sha256'), 'hex'),
    '10000000-0000-0000-0000-000000000001',
    now() + interval '7 days',
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'expired@example.com',
    'expired@example.com',
    'staff',
    encode(digest('expired-invitation-token', 'sha256'), 'hex'),
    '10000000-0000-0000-0000-000000000001',
    now() - interval '1 minute',
    now() - interval '2 days'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","role":"authenticated"}',
  true
);

select extensions.is((select count(*)::integer from public.bakeries), 1, 'Owner sees only their bakery');
select extensions.is((select name from public.bakeries limit 1), 'Bakery A', 'Cross-bakery reads are hidden');
select extensions.is((select count(*)::integer from public.bakery_memberships), 2, 'Owner sees only same-bakery memberships');
select extensions.is((select count(*)::integer from public.bakery_invitations), 3, 'Owner can view pending invitations');
select extensions.is((select count(*)::integer from public.profiles where id = '10000000-0000-0000-0000-000000000003'), 0, 'Cross-bakery profiles are hidden');
select extensions.is_empty(
  $$update public.bakeries set name = 'Cross-tenant update'
    where id = '20000000-0000-0000-0000-000000000002'
    returning id$$,
  'Cross-bakery updates affect no rows'
);
select extensions.is_empty(
  $$delete from public.bakeries
    where id = '20000000-0000-0000-0000-000000000002'
    returning id$$,
  'Cross-bakery deletes affect no rows'
);
select extensions.ok(not has_table_privilege('authenticated', 'public.bakery_memberships', 'INSERT'), 'Authenticated cannot directly insert memberships');
select extensions.ok(not has_table_privilege('authenticated', 'public.bakery_invitations', 'UPDATE'), 'Authenticated cannot directly update invitations');
select extensions.ok(not has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'Authenticated cannot directly delete profiles');
select extensions.throws_ok(
  $$update public.profiles set email = 'drift@example.com'
    where id = '10000000-0000-0000-0000-000000000001'$$,
  '42501',
  'Profile email is managed by Supabase Auth',
  'Authenticated users cannot drift profile email from Auth'
);
select extensions.throws_ok(
  $$insert into public.bakery_memberships (bakery_id, user_id, role)
    values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner')$$,
  '42501',
  'permission denied for table bakery_memberships',
  'A stale client bakery identifier cannot grant membership'
);
select extensions.throws_ok(
  $$select public.remove_bakery_member('30000000-0000-0000-0000-000000000001')$$,
  '23514',
  'A bakery must retain at least one owner',
  'The final owner cannot be removed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"staff-a@example.com","role":"authenticated"}',
  true
);
select extensions.is((select count(*)::integer from public.bakery_invitations), 0, 'Staff cannot view invitations');
select extensions.throws_ok(
  $$select public.remove_bakery_member('30000000-0000-0000-0000-000000000001')$$,
  '42501',
  'Insufficient role to remove this membership',
  'Staff cannot remove an owner'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","email":"new-owner@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  public.create_default_bakery('New Owner Bakery'),
  public.create_default_bakery('Ignored Retry Name'),
  'Default bakery onboarding is idempotent'
);
select extensions.is(
  (select count(*)::integer
   from public.bakery_memberships
   where user_id = '10000000-0000-0000-0000-000000000004'
     and role = 'owner'),
  1,
  'Idempotent onboarding retains one owner membership'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","email":"invitee@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  public.accept_bakery_invitation('valid-invitation-token') ->> 'status',
  'accepted',
  'Matching invitee accepts the invitation'
);
select extensions.is(
  (select count(*)::integer from public.bakery_memberships where user_id = '10000000-0000-0000-0000-000000000005'),
  1,
  'Invitation acceptance creates exactly one membership'
);
select extensions.is(
  public.accept_bakery_invitation('valid-invitation-token') ->> 'status',
  'invalid',
  'A consumed invitation cannot be accepted again'
);
select extensions.is(
  public.accept_bakery_invitation('mismatched-invitation-token') ->> 'status',
  'email_mismatch',
  'Invitation consumption requires the verified invited email'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","role":"authenticated"}',
  true
);
select extensions.lives_ok(
  $$select public.remove_bakery_member(
    (select id from public.bakery_memberships
     where bakery_id = '20000000-0000-0000-0000-000000000001'
       and user_id = '10000000-0000-0000-0000-000000000005')
  )$$,
  'Owner can remove an accepted Staff membership'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","email":"invitee@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  (select count(*)::integer from public.bakeries),
  0,
  'Removed membership immediately loses bakery access'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000006","email":"expired@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  public.accept_bakery_invitation('expired-invitation-token') ->> 'status',
  'expired',
  'Expired invitation returns an actionable terminal status'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  (select status from public.bakery_invitations where id = '40000000-0000-0000-0000-000000000003'),
  'expired',
  'Expired invitation status remains durable'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","role":"authenticated"}',
  true
);
select extensions.lives_ok(
  $$select public.transfer_bakery_ownership('30000000-0000-0000-0000-000000000002')$$,
  'Owner can atomically transfer ownership to another member'
);
select extensions.is(
  (select role from public.bakery_memberships where id = '30000000-0000-0000-0000-000000000002'),
  'owner',
  'Ownership transfer promotes the successor before demotion'
);
select extensions.is(
  (select role from public.bakery_memberships where id = '30000000-0000-0000-0000-000000000001'),
  'manager',
  'Ownership transfer demotes the prior owner to manager'
);

select * from extensions.finish();
rollback;
