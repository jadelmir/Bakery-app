begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(30);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'checkout-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-bakery-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('92000000-0000-0000-0000-000000000001', 'Checkout Test Bakery', '91000000-0000-0000-0000-000000000001'),
  ('92000000-0000-0000-0000-000000000002', 'Other Test Bakery', '91000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'owner'),
  ('93000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'owner');

insert into public.recipes (id, bakery_id, name, yield, batch_cost_cents, selling_price_cents)
values
  ('94000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'Checkout Test Loaf', '1 loaf', 250, 1400),
  ('94000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000002', 'Other Test Loaf', '1 loaf', 275, 1500);

insert into public.storefronts (id, bakery_id, name, slug, is_enabled, minimum_lead_time_hours)
values (
  '95000000-0000-0000-0000-000000000001',
  '92000000-0000-0000-0000-000000000001',
  'Checkout Test Storefront',
  'checkout-test-storefront',
  true,
  0
);

insert into public.storefront_products (
  id, storefront_id, recipe_id, public_name, online_price_cents, is_published
)
values (
  '96000000-0000-0000-0000-000000000001',
  '95000000-0000-0000-0000-000000000001',
  '94000000-0000-0000-0000-000000000001',
  'Checkout Test Loaf',
  1400,
  true
);

create temp table test_checkout_results (
  attempt integer primary key,
  payload jsonb not null
) on commit drop;
grant select, insert on table test_checkout_results to anon;

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.recipes'::regclass),
  'Recipes has row-level security enabled'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.recipes', 'select'),
  'Authenticated users retain recipe read privilege behind RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.recipes', 'insert, update, delete'),
  'Authenticated users retain recipe mutation privileges behind RLS'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.recipes', 'select'),
  'Anonymous callers have no direct recipe read privilege'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.recipes', 'insert, update, delete'),
  'Anonymous callers have no direct recipe mutation privileges'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

insert into test_checkout_results (attempt, payload)
values (
  1,
  public.create_online_order(
    'checkout-test-storefront',
    'test-idempotency-key-20260803',
    jsonb_build_object('name', 'Synthetic Checkout Customer', 'email', 'synthetic-checkout@example.com'),
    jsonb_build_object('pickup_date', (current_date + 7)::text, 'pickup_time', '10:00'),
    jsonb_build_array(jsonb_build_object(
      'product_id', '96000000-0000-0000-0000-000000000001',
      'public_name', 'Checkout Test Loaf',
      'quantity', 2,
      'unit_price_cents', 1400
    ))
  )
);

insert into test_checkout_results (attempt, payload)
values (
  2,
  public.create_online_order(
    'checkout-test-storefront',
    'test-idempotency-key-20260803',
    jsonb_build_object('name', 'Synthetic Checkout Customer', 'email', 'synthetic-checkout@example.com'),
    jsonb_build_object('pickup_date', (current_date + 7)::text, 'pickup_time', '10:00'),
    jsonb_build_array(jsonb_build_object(
      'product_id', '96000000-0000-0000-0000-000000000001',
      'public_name', 'Checkout Test Loaf',
      'quantity', 2,
      'unit_price_cents', 1400
    ))
  )
);

set local role postgres;

select extensions.ok(
  (select (payload->>'success')::boolean from test_checkout_results where attempt = 1),
  'Supported anonymous checkout succeeds'
);
select extensions.ok(
  (select (payload->>'success')::boolean from test_checkout_results where attempt = 2),
  'Repeated checkout submission succeeds'
);
select extensions.ok(
  (select coalesce((payload->>'idempotent')::boolean, false) from test_checkout_results where attempt = 2),
  'Repeated checkout submission reports idempotency'
);
select extensions.is(
  (select payload->>'order_id' from test_checkout_results where attempt = 2),
  (select payload->>'order_id' from test_checkout_results where attempt = 1),
  'Repeated checkout returns the original order'
);
select extensions.is(
  (select count(*)::integer from public.orders where storefront_id = '95000000-0000-0000-0000-000000000001'),
  1,
  'Idempotency key creates exactly one order'
);
select extensions.is(
  (
    select count(*)::integer
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  1,
  'Idempotency key creates exactly one production task'
);
select extensions.is(
  (
    select recipe_id
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  '94000000-0000-0000-0000-000000000001',
  'Online task stores the current text recipe identifier'
);
select extensions.ok(
  (
    select flow_id is not null and flow_id <> ''
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'Online task has a generated flow identifier'
);
select extensions.ok(
  (
    select flow_step_id is not null and flow_step_id <> ''
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'Online task has a generated flow-step identifier'
);
select extensions.is(
  (
    select title
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'Prepare & Bake Checkout Test Loaf',
  'Online task has the expected title'
);
select extensions.is(
  (
    select category
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'baking',
  'Online task has the expected category'
);
select extensions.is(
  (
    select status
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'pending',
  'Online task starts pending'
);
select extensions.is(
  (
    select duration_minutes
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  30,
  'Online task has the expected duration'
);
select extensions.is(
  (
    select urgency
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'normal',
  'Online task has normal urgency'
);
select extensions.is(
  (
    select delay_minutes
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  0,
  'Online task starts without delay'
);
select extensions.ok(
  (
    select skip_reason is null
    from public.production_tasks
    where order_id = (select (payload->>'order_id')::uuid from test_checkout_results where attempt = 1)
  ),
  'Online task has no skip reason'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-0000-0000-000000000001","email":"checkout-owner@example.com","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*)::integer from public.recipes where bakery_id = '92000000-0000-0000-0000-000000000001'),
  1,
  'Bakery member reads its own recipe'
);
select extensions.lives_ok(
  $$update public.recipes
    set name = 'Checkout Test Loaf Updated'
    where id = '94000000-0000-0000-0000-000000000001'$$,
  'Bakery member updates its own recipe'
);
select extensions.is(
  (select name from public.recipes where id = '94000000-0000-0000-0000-000000000001'),
  'Checkout Test Loaf Updated',
  'Same-bakery recipe update is visible to the member'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-0000-0000-000000000002","email":"other-bakery-owner@example.com","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*)::integer from public.recipes where bakery_id = '92000000-0000-0000-0000-000000000001'),
  0,
  'Cross-bakery recipe reads return no rows'
);
select extensions.is_empty(
  $$update public.recipes
    set name = 'Cross-bakery update'
    where id = '94000000-0000-0000-0000-000000000001'
    returning id$$,
  'Cross-bakery recipe updates affect no rows'
);
select extensions.is_empty(
  $$delete from public.recipes
    where id = '94000000-0000-0000-0000-000000000001'
    returning id$$,
  'Cross-bakery recipe deletes affect no rows'
);
select extensions.throws_ok(
  $$insert into public.recipes (bakery_id, name)
    values ('92000000-0000-0000-0000-000000000001', 'Cross-bakery insert')$$,
  '42501',
  'new row violates row-level security policy for table "recipes"',
  'Cross-bakery recipe inserts are denied'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select extensions.throws_ok(
  $$select * from public.recipes$$,
  '42501',
  'permission denied for table recipes',
  'Anonymous callers cannot read recipes directly'
);
select extensions.throws_ok(
  $$insert into public.recipes (bakery_id, name)
    values ('92000000-0000-0000-0000-000000000001', 'Anonymous insert')$$,
  '42501',
  'permission denied for table recipes',
  'Anonymous callers cannot mutate recipes directly'
);

select * from extensions.finish();
rollback;
