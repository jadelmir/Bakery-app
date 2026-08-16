begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select extensions.plan(21);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
values
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recipe-owner@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recipe-other@example.com', crypt('password', gen_salt('bf')), now(), now(), now(), '{}', '{}');

insert into public.bakeries (id, name, created_by)
values
  ('a2000000-0000-0000-0000-000000000001', 'Recipe Test Bakery', 'a1000000-0000-0000-0000-000000000001'),
  ('a2000000-0000-0000-0000-000000000002', 'Other Recipe Bakery', 'a1000000-0000-0000-0000-000000000002');

insert into public.bakery_memberships (id, bakery_id, user_id, role)
values
  ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'owner'),
  ('a3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'owner');

insert into public.ingredients (
  id, bakery_id, name, unit, package_quantity, package_price, min_level, kind
)
values
  ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Recipe Flour', 'g', 1000, 2.00, 0, 'ingredient'),
  ('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'Recipe Water', 'g', 1000, 1.00, 0, 'ingredient'),
  ('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'Other Flour', 'g', 1000, 3.00, 0, 'ingredient');

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.recipe_ingredients'::regclass),
  'Recipe ingredient relation has row-level security enabled'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.recipe_ingredients', 'select, insert, update, delete'),
  'Authenticated users retain recipe ingredient privileges behind RLS'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb)', 'execute'),
  'Authenticated members can execute the recipe save RPC'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.save_recipe(uuid, uuid, text, text, bigint, text, jsonb)', 'execute'),
  'Anonymous callers cannot execute the recipe save RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1000000-0000-0000-0000-000000000001","email":"recipe-owner@example.com","role":"authenticated"}',
  true
);

select extensions.lives_ok(
  $$select public.save_recipe(
    'a2000000-0000-0000-0000-000000000001',
    'a5000000-0000-0000-0000-000000000001',
    'Persistent Loaf',
    '1 loaf',
    1400,
    'flow-custom-text-id',
    jsonb_build_array(
      jsonb_build_object('inventory_item_id', 'a4000000-0000-0000-0000-000000000001', 'quantity', 500),
      jsonb_build_object('inventory_item_id', 'a4000000-0000-0000-0000-000000000002', 'quantity', 250)
    )
  )$$,
  'Bakery member creates a recipe with ingredient lines'
);
select extensions.is(
  (select name from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  'Persistent Loaf',
  'Recipe name is persisted'
);
select extensions.is(
  (select flow_id from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  'flow-custom-text-id',
  'String production-flow identifier is preserved'
);
select extensions.is(
  (select batch_cost_cents from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  125::bigint,
  'Recipe batch cost is calculated from current inventory prices'
);
select extensions.is(
  (select count(*)::integer from public.recipe_ingredients where recipe_id = 'a5000000-0000-0000-0000-000000000001'),
  2,
  'Recipe ingredient lines are persisted'
);
select extensions.is(
  (select quantity from public.recipe_ingredients where recipe_id = 'a5000000-0000-0000-0000-000000000001' and inventory_item_id = 'a4000000-0000-0000-0000-000000000001'),
  500::numeric,
  'Recipe ingredient quantity is persisted'
);

select extensions.lives_ok(
  $$select public.save_recipe(
    'a2000000-0000-0000-0000-000000000001',
    'a5000000-0000-0000-0000-000000000001',
    'Persistent Loaf Updated',
    '2 loaves',
    2800,
    null,
    jsonb_build_array(
      jsonb_build_object('inventory_item_id', 'a4000000-0000-0000-0000-000000000001', 'quantity', 750)
    )
  )$$,
  'Bakery member updates a recipe atomically'
);
select extensions.is(
  (select name from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  'Persistent Loaf Updated',
  'Recipe update is authoritative'
);
select extensions.is(
  (select batch_cost_cents from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  150::bigint,
  'Updated recipe recalculates batch cost'
);
select extensions.is(
  (select count(*)::integer from public.recipe_ingredients where recipe_id = 'a5000000-0000-0000-0000-000000000001'),
  1,
  'Recipe update replaces old ingredient lines'
);
select extensions.is(
  (select flow_id from public.recipes where id = 'a5000000-0000-0000-0000-000000000001'),
  null,
  'Recipe update preserves nullable flow assignment'
);

select extensions.throws_ok(
  $$select public.save_recipe(
    'a2000000-0000-0000-0000-000000000002',
    'a5000000-0000-0000-0000-000000000002',
    'Cross Bakery Recipe',
    '1 batch',
    100,
    null,
    jsonb_build_array(jsonb_build_object('inventory_item_id', 'a4000000-0000-0000-0000-000000000001', 'quantity', 1))
  )$$,
  '42501',
  'Access denied: caller is not a member of bakery a2000000-0000-0000-0000-000000000002',
  'Cross-bakery recipe identifiers are denied'
);
select extensions.throws_ok(
  $$select public.save_recipe(
    'a2000000-0000-0000-0000-000000000001',
    'a5000000-0000-0000-0000-000000000002',
    'Cross Bakery Ingredient',
    '1 batch',
    100,
    null,
    jsonb_build_array(jsonb_build_object('inventory_item_id', 'a4000000-0000-0000-0000-000000000003', 'quantity', 1))
  )$$,
  '23503',
  null,
  'Cross-bakery inventory ingredients are denied'
);
select extensions.throws_ok(
  $$select public.save_recipe(
    'a2000000-0000-0000-0000-000000000001',
    'a5000000-0000-0000-0000-000000000003',
    'Malformed Ingredient',
    '1 batch',
    100,
    null,
    jsonb_build_array(jsonb_build_object('inventory_item_id', 'not-a-uuid', 'quantity', 1))
  )$$,
  '22023',
  null,
  'Malformed ingredient identifiers are rejected'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"a1000000-0000-0000-0000-000000000002","email":"recipe-other@example.com","role":"authenticated"}',
  true
);
select extensions.is(
  (select count(*)::integer from public.recipe_ingredients where recipe_id = 'a5000000-0000-0000-0000-000000000001'),
  0,
  'Cross-bakery members cannot read recipe ingredient lines'
);
select extensions.is_empty(
  $$update public.recipe_ingredients
    set quantity = 999
    where recipe_id = 'a5000000-0000-0000-0000-000000000001'
    returning recipe_id$$,
  'Cross-bakery members cannot update recipe ingredient lines'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select extensions.throws_ok(
  $$select * from public.recipe_ingredients$$,
  '42501',
  'permission denied for table recipe_ingredients',
  'Anonymous callers cannot read recipe ingredient lines'
);

select * from extensions.finish();
rollback;
