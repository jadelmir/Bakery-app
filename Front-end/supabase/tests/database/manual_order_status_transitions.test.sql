begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(9);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('98000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'status-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('98000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'status-other@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('98100000-0000-0000-0000-000000000001', 'Status Test Bakery', '98000000-0000-0000-0000-000000000001'),
  ('98100000-0000-0000-0000-000000000002', 'Other Status Bakery', '98000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('98200000-0000-0000-0000-000000000001', '98100000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001', 'owner'),
  ('98200000-0000-0000-0000-000000000002', '98100000-0000-0000-0000-000000000002', '98000000-0000-0000-0000-000000000002', 'owner');

insert into public.orders (id, bakery_id, pickup_date, status, source)
values
  ('98300000-0000-0000-0000-000000000001', '98100000-0000-0000-0000-000000000001', current_date + 1, 'confirmed', 'in-person'),
  ('98300000-0000-0000-0000-000000000002', '98100000-0000-0000-0000-000000000001', current_date + 1, 'confirmed', 'in-person'),
  ('98300000-0000-0000-0000-000000000003', '98100000-0000-0000-0000-000000000001', current_date + 1, 'ready', 'in-person'),
  ('98300000-0000-0000-0000-000000000004', '98100000-0000-0000-0000-000000000001', current_date + 1, 'completed', 'in-person'),
  ('98300000-0000-0000-0000-000000000005', '98100000-0000-0000-0000-000000000002', current_date + 1, 'confirmed', 'in-person');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"98000000-0000-0000-0000-000000000001","email":"status-owner@example.com","role":"authenticated"}',
  true
);

update public.orders
set status = 'in-production'
where id = '98300000-0000-0000-0000-000000000001'
  and bakery_id = '98100000-0000-0000-0000-000000000001'
  and status = 'confirmed';
select extensions.is(
  (select status from public.orders where id = '98300000-0000-0000-0000-000000000001'),
  'in-production',
  'A bakery member can start production from confirmed'
);

update public.orders
set status = 'ready'
where id = '98300000-0000-0000-0000-000000000001'
  and bakery_id = '98100000-0000-0000-0000-000000000001'
  and status = 'in-production';
select extensions.is(
  (select status from public.orders where id = '98300000-0000-0000-0000-000000000001'),
  'ready',
  'A bakery member can mark an in-production order ready'
);

update public.orders
set status = 'completed'
where id = '98300000-0000-0000-0000-000000000001'
  and bakery_id = '98100000-0000-0000-0000-000000000001'
  and status = 'ready';
select extensions.is(
  (select status from public.orders where id = '98300000-0000-0000-0000-000000000001'),
  'completed',
  'A bakery member can complete a ready order'
);

select extensions.throws_ok(
  $$update public.orders set status = 'ready' where id = '98300000-0000-0000-0000-000000000002'$$,
  '23514',
  'Orders can only advance through confirmed, in-production, ready, and completed.',
  'A confirmed order cannot skip directly to ready'
);
select extensions.is(
  (select status from public.orders where id = '98300000-0000-0000-0000-000000000002'),
  'confirmed',
  'A rejected skipped transition leaves the order unchanged'
);

select extensions.throws_ok(
  $$update public.orders set status = 'in-production' where id = '98300000-0000-0000-0000-000000000003'$$,
  '23514',
  'Orders can only advance through confirmed, in-production, ready, and completed.',
  'A ready order cannot move backward'
);

select extensions.throws_ok(
  $$update public.orders set status = 'completed' where id = '98300000-0000-0000-0000-000000000004'$$,
  '23514',
  'Orders can only advance through confirmed, in-production, ready, and completed.',
  'A completed transition cannot be repeated'
);

select extensions.results_eq(
  $$
    update public.orders
    set status = 'in-production'
    where id = '98300000-0000-0000-0000-000000000005'
      and bakery_id = '98100000-0000-0000-0000-000000000002'
      and status = 'confirmed'
    returning id
  $$,
  $$select null::uuid where false$$,
  'A member cannot transition an order in another bakery'
);
select extensions.is(
  (
    select status
    from public.orders
    where id = '98300000-0000-0000-0000-000000000005'
  ),
  null,
  'The other bakery order remains hidden by tenant RLS'
);

select * from extensions.finish();
rollback;
