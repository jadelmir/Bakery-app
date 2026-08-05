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
  ('99000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'payment-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('99000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'payment-other@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('99100000-0000-0000-0000-000000000001', 'Payment Test Bakery', '99000000-0000-0000-0000-000000000001'),
  ('99100000-0000-0000-0000-000000000002', 'Other Payment Bakery', '99000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('99200000-0000-0000-0000-000000000001', '99100000-0000-0000-0000-000000000001', '99000000-0000-0000-0000-000000000001', 'owner'),
  ('99200000-0000-0000-0000-000000000002', '99100000-0000-0000-0000-000000000002', '99000000-0000-0000-0000-000000000002', 'owner');

insert into public.orders (id, bakery_id, pickup_date, status, source, total_cents, amount_paid_cents, payment_status)
values
  ('99300000-0000-0000-0000-000000000001', '99100000-0000-0000-0000-000000000001', current_date + 1, 'ready', 'in-person', 2200, 1000, 'partially-paid'),
  ('99300000-0000-0000-0000-000000000002', '99100000-0000-0000-0000-000000000002', current_date + 1, 'confirmed', 'in-person', 5000, 0, 'unpaid');

select extensions.ok(
  has_function_privilege('authenticated', 'public.mark_order_paid(uuid, uuid)', 'execute'),
  'Authenticated members can execute mark_order_paid'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.mark_order_paid(uuid, uuid)', 'execute'),
  'Anonymous users cannot execute mark_order_paid'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"99000000-0000-0000-0000-000000000001","email":"payment-owner@example.com","role":"authenticated"}',
  true
);

select extensions.is(
  (public.mark_order_paid('99100000-0000-0000-0000-000000000001', '99300000-0000-0000-0000-000000000001')->>'amount_paid_cents')::bigint,
  2200::bigint,
  'The RPC returns the authoritative full amount paid'
);
select extensions.is(
  (select amount_paid_cents from public.orders where id = '99300000-0000-0000-0000-000000000001'),
  2200::bigint,
  'The order full balance is persisted'
);
select extensions.is(
  (select payment_status from public.orders where id = '99300000-0000-0000-0000-000000000001'),
  'paid',
  'The order payment status is paid'
);
select extensions.is(
  (select status from public.orders where id = '99300000-0000-0000-0000-000000000001'),
  'ready',
  'Marking payment does not change lifecycle status'
);
select extensions.is(
  (public.mark_order_paid('99100000-0000-0000-0000-000000000001', '99300000-0000-0000-0000-000000000001')->>'amount_paid_cents')::bigint,
  2200::bigint,
  'Repeating the operation does not overpay the order'
);
select extensions.throws_ok(
  $$select public.mark_order_paid('99100000-0000-0000-0000-000000000002', '99300000-0000-0000-0000-000000000002')$$,
  '42501',
  null,
  'A member cannot mark another bakery order paid'
);

set local role postgres;
select extensions.is(
  (select amount_paid_cents from public.orders where id = '99300000-0000-0000-0000-000000000002'),
  0::bigint,
  'A denied cross-bakery payment leaves the order unchanged'
);

select * from extensions.finish();
rollback;
