begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(14);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('97000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manual-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('97000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manual-other-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('97100000-0000-0000-0000-000000000001', 'Manual Test Bakery', '97000000-0000-0000-0000-000000000001'),
  ('97100000-0000-0000-0000-000000000002', 'Other Manual Bakery', '97000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('97200000-0000-0000-0000-000000000001', '97100000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000001', 'owner'),
  ('97200000-0000-0000-0000-000000000002', '97100000-0000-0000-0000-000000000002', '97000000-0000-0000-0000-000000000002', 'owner');

insert into public.customers (id, bakery_id, name, email, phone)
values
  ('97300000-0000-0000-0000-000000000001', '97100000-0000-0000-0000-000000000001', 'Manual Test Customer', 'manual-customer@example.com', '555-0100');

insert into public.recipes (id, bakery_id, name, yield, batch_cost_cents, selling_price_cents)
values
  ('97400000-0000-0000-0000-000000000001', '97100000-0000-0000-0000-000000000001', 'Manual Test Loaf', '1 loaf', 250, 1400);

select extensions.ok(
  has_function_privilege('authenticated', 'public.create_manual_order(uuid, uuid, uuid, date, text, bigint, text, jsonb)', 'execute'),
  'Authenticated members can execute the manual-order RPC'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.create_manual_order(uuid, uuid, uuid, date, text, bigint, text, jsonb)', 'execute'),
  'Anonymous callers cannot execute the manual-order RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"97000000-0000-0000-0000-000000000001","email":"manual-owner@example.com","role":"authenticated"}',
  true
);

select extensions.is(
  (select public.create_manual_order(
    '97100000-0000-0000-0000-000000000001',
    '97500000-0000-0000-0000-000000000001',
    '97300000-0000-0000-0000-000000000001',
    current_date + 3,
    '10:30',
    500,
    'Please hold at the counter',
    jsonb_build_array(
      jsonb_build_object('recipe_id', '97400000-0000-0000-0000-000000000001', 'quantity', 2, 'unit_price_cents', 1400),
      jsonb_build_object('recipe_id', '97400000-0000-0000-0000-000000000001', 'quantity', 3, 'unit_price_cents', 1400)
    )
  ))->>'payment_status',
  'partially-paid',
  'Manual order reports the correct payment status'
);
select extensions.is(
  (select total_cents from public.orders where id = '97500000-0000-0000-0000-000000000001'),
  7000::bigint,
  'Manual order total is calculated from persisted line items'
);
select extensions.is(
  (select source from public.orders where id = '97500000-0000-0000-0000-000000000001'),
  'in-person',
  'Manual order is marked as an in-person order'
);
select extensions.is(
  (select count(*)::integer from public.order_items where order_id = '97500000-0000-0000-0000-000000000001'),
  2,
  'Manual order persists its original line items'
);
select extensions.is(
  (select count(*)::integer from public.production_tasks where order_id = '97500000-0000-0000-0000-000000000001'),
  3,
  'Manual order generates one three-step production plan'
);
select extensions.is(
  (select count(*)::integer from public.production_tasks where order_id = '97500000-0000-0000-0000-000000000001' and quantity = 5),
  3,
  'The production plan aggregates repeated recipe lines to quantity five'
);
select extensions.is(
  (select notes from public.orders where id = '97500000-0000-0000-0000-000000000001'),
  'Please hold at the counter',
  'Manual order persists notes'
);

select extensions.is(
  (select public.create_manual_order(
    '97100000-0000-0000-0000-000000000001',
    '97500000-0000-0000-0000-000000000001',
    '97300000-0000-0000-0000-000000000001',
    current_date + 3,
    '10:30',
    2800,
    null,
    jsonb_build_array(jsonb_build_object('recipe_id', '97400000-0000-0000-0000-000000000001', 'quantity', 5, 'unit_price_cents', 1400))
  ))->>'idempotent',
  'true',
  'Retrying the same order is idempotent'
);
select extensions.is(
  (select count(*)::integer from public.production_tasks where order_id = '97500000-0000-0000-0000-000000000001'),
  3,
  'Idempotent retry does not duplicate production tasks'
);

select extensions.throws_ok(
  $$select public.create_manual_order(
    '97100000-0000-0000-0000-000000000002',
    '97600000-0000-0000-0000-000000000001',
    '97300000-0000-0000-0000-000000000001',
    current_date + 3,
    '10:30',
    0,
    null,
    jsonb_build_array(jsonb_build_object('recipe_id', '97400000-0000-0000-0000-000000000001', 'quantity', 1, 'unit_price_cents', 1400))
  )$$,
  '42501',
  'Access denied: caller is not a member of bakery 97100000-0000-0000-0000-000000000002',
  'A member cannot create an order for another bakery'
);

select extensions.throws_ok(
  $$select public.create_manual_order(
    '97100000-0000-0000-0000-000000000001',
    '97600000-0000-0000-0000-000000000002',
    '97300000-0000-0000-0000-000000000001',
    current_date + 3,
    '10:30',
    0,
    null,
    jsonb_build_array(jsonb_build_object('recipe_id', '97400000-0000-0000-0000-000000000002', 'quantity', 1, 'unit_price_cents', 1400))
  )$$,
  '23503',
  'Recipe does not belong to the active bakery.',
  'An order cannot include another bakery recipe'
);
select extensions.is(
  (select count(*)::integer from public.orders where id = '97600000-0000-0000-0000-000000000002'),
  0,
  'Invalid manual order input rolls back without a partial order'
);

select * from extensions.finish();
rollback;
