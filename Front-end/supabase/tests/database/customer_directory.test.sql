begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(13);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('98000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('98000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer-other-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('98100000-0000-0000-0000-000000000001', 'Customer Test Bakery', '98000000-0000-0000-0000-000000000001'),
  ('98100000-0000-0000-0000-000000000002', 'Other Customer Bakery', '98000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('98200000-0000-0000-0000-000000000001', '98100000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001', 'owner'),
  ('98200000-0000-0000-0000-000000000002', '98100000-0000-0000-0000-000000000002', '98000000-0000-0000-0000-000000000002', 'owner');

insert into public.customers (id, bakery_id, name, email, type)
values
  ('98300000-0000-0000-0000-000000000001', '98100000-0000-0000-0000-000000000001', 'Existing Retail Customer', 'retail@example.com', default),
  ('98300000-0000-0000-0000-000000000002', '98100000-0000-0000-0000-000000000002', 'Other Bakery Customer', 'other@example.com', 'wholesale');

select extensions.is(
  (select type from public.customers where id = '98300000-0000-0000-0000-000000000001'),
  'retail',
  'Existing customers receive the safe retail default'
);
select extensions.is(
  (select type from public.customers where id = '98300000-0000-0000-0000-000000000002'),
  'wholesale',
  'Wholesale customer type is persisted'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.customers', 'SELECT')
    and has_table_privilege('authenticated', 'public.customers', 'INSERT')
    and has_table_privilege('authenticated', 'public.customers', 'UPDATE'),
  'Authenticated members retain customer directory table privileges'
);
select extensions.throws_ok(
  $$insert into public.customers (bakery_id, name, email, type) values ('98100000-0000-0000-0000-000000000001', 'Invalid Type', 'invalid@example.com', 'invalid')$$,
  '23514',
  'new row for relation "customers" violates check constraint "customers_type_check"',
  'Customer type is constrained to wholesale or retail'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"98000000-0000-0000-0000-000000000001","email":"customer-owner@example.com","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*)::integer from public.customers),
  1,
  'A member sees only customers from the active bakery'
);
select extensions.is(
  (select count(*)::integer from public.customers where bakery_id = '98100000-0000-0000-0000-000000000002'),
  0,
  'Cross-bakery customers are isolated by RLS'
);
insert into public.customers (bakery_id, name, email, type)
values ('98100000-0000-0000-0000-000000000001', 'New Wholesale Customer', 'new-wholesale@example.com', 'wholesale');
select extensions.is(
  (select type from public.customers where email = 'new-wholesale@example.com'),
  'wholesale',
  'An authenticated member can create a bakery-scoped customer'
);
select extensions.is(
  (select count(*)::integer from public.customers where bakery_id = '98100000-0000-0000-0000-000000000001' and email = 'new-wholesale@example.com'),
  1,
  'The new customer is visible within its bakery'
);
update public.customers
set type = 'retail'
where email = 'new-wholesale@example.com';
select extensions.is(
  (select type from public.customers where email = 'new-wholesale@example.com'),
  'retail',
  'An authenticated member can update a bakery-scoped customer'
);
select extensions.throws_ok(
  $$insert into public.customers (bakery_id, name, email, type) values ('98100000-0000-0000-0000-000000000002', 'Denied Customer', 'denied@example.com', 'retail')$$,
  '42501',
  'new row violates row-level security policy for table "customers"',
  'A member cannot create a customer in another bakery'
);
select extensions.is(
  (select count(*)::integer from public.customers where email = 'denied@example.com'),
  0,
  'Denied customer creation leaves no partial row'
);
select extensions.throws_ok(
  $$update public.customers set type = 'invalid' where email = 'new-wholesale@example.com'$$,
  '23514',
  'new row for relation "customers" violates check constraint "customers_type_check"',
  'An invalid update is rejected'
);
select extensions.is(
  (select type from public.customers where email = 'new-wholesale@example.com'),
  'retail',
  'A rejected update rolls back without changing the customer'
);

select * from extensions.finish();
rollback;
