-- Deterministic seed data for local development & testing.
-- Initial Admin User: admin@jadorebakery.com / password123
-- Initial Admin Bakery: J'adore Bakery

-- 1. Create Auth User & Identity
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@jadorebakery.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Baker"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  format('{"sub":"%s","email":"%s"}', 'a1111111-1111-1111-1111-111111111111', 'admin@jadorebakery.com')::jsonb,
  'email',
  now(),
  now(),
  now(),
  'admin@jadorebakery.com'
) ON CONFLICT (id) DO NOTHING;

-- 2. Initial Admin Bakery & Profile
INSERT INTO public.bakeries (id, name, timezone, currency, created_by)
VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'J''adore Bakery',
  'America/New_York',
  'USD',
  'a1111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, default_bakery_id)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'admin@jadorebakery.com',
  'Admin Baker',
  'b1111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO UPDATE SET
  default_bakery_id = EXCLUDED.default_bakery_id,
  full_name = EXCLUDED.full_name;

INSERT INTO public.bakery_memberships (id, bakery_id, user_id, role)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'owner'
) ON CONFLICT (bakery_id, user_id) DO NOTHING;

-- 3. Ingredients & Packaging Catalog
INSERT INTO public.ingredients (id, bakery_id, name, unit, package_quantity, package_price, on_hand, min_level, kind) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Kirkland Organic Bread Flour', 'g', 5000, 15.00, 12000, 4000, 'ingredient'),
  ('d2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Whole Wheat Flour', 'g', 2000, 8.50, 4500, 1500, 'ingredient'),
  ('d3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Fine Sea Salt', 'g', 1000, 4.00, 3000, 500, 'ingredient'),
  ('d4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Filtered Water', 'g', 10000, 1.00, 50000, 5000, 'ingredient'),
  ('d5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 'Earl (Active Sourdough Starter)', 'g', 1000, 5.00, 2500, 800, 'ingredient'),
  ('d6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111', 'Extra Virgin Olive Oil', 'g', 1000, 12.00, 1800, 500, 'ingredient'),
  ('d7777777-7777-7777-7777-777777777777', 'b1111111-1111-1111-1111-111111111111', 'Kraft Windowed Loaf Bag', 'unit', 100, 15.00, 250, 50, 'packaging')
ON CONFLICT (id) DO NOTHING;

-- 4. Customer Directory
INSERT INTO public.customers (id, bakery_id, name, email, phone, address, notes) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Reed Family', 'reed@example.com', '(555) 234-5678', '142 Elm St, Suite 2B', 'Weekly sourdough subscriber'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Priya Nair', 'priya@example.com', '(555) 876-5432', '88 Maple Ave', 'Prefers extra crispy focaccia'),
  ('e3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'James Okonkwo', 'james@example.com', '(555) 345-6789', '12 Oak Ridge Rd', 'Pick up on Saturday mornings'),
  ('e4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Artisanal Café', 'orders@artisanalcafe.com', '(555) 999-0000', '500 Main Street', 'Wholesale partner - biweekly invoice')
ON CONFLICT (id) DO NOTHING;

-- 5. Recipe Catalog
INSERT INTO public.recipes (id, bakery_id, name, yield, batch_cost_cents, selling_price_cents) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', '1 loaf (750g)', 250, 1400),
  ('f2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Rosemary Sea Salt Focaccia', '1 tray (1000g)', 400, 1800),
  ('f3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Whole Wheat Country Boule', '1 loaf (800g)', 300, 1500)
ON CONFLICT (id) DO NOTHING;

-- 6. Online Storefront & Products
INSERT INTO public.storefronts (id, bakery_id, name, slug, description, is_enabled, minimum_lead_time_hours) VALUES
  ('11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'J''adore Bakery', 'jadore-bakery', 'Artisanal sourdough loaves & focaccia freshly baked daily.', true, 24)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.storefront_products (id, storefront_id, recipe_id, public_name, public_description, online_price_cents, is_published, display_order) VALUES
  ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 'Long cold fermented sourdough loaf made with organic flour.', 1400, true, 1),
  ('11111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'Rosemary Sea Salt Focaccia', 'Rich olive oil focaccia topped with fresh rosemary and sea salt.', 1800, true, 2),
  ('11111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'Whole Wheat Country Boule', 'Nutty whole grain sourdough boule with open crumb.', 1500, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.storefront_pickup_windows (id, storefront_id, day_of_week, start_time, end_time, max_orders_per_window, is_enabled) VALUES
  ('11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 5, '09:00:00', '14:00:00', 15, true),
  ('11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111111', 6, '09:00:00', '14:00:00', 20, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Payment Methods
INSERT INTO public.bakery_payment_methods (id, bakery_id, method_type, is_enabled, instructions, account_details_json) VALUES
  ('22222222-2222-2222-2222-222222222221', 'b1111111-1111-1111-1111-111111111111', 'zelle', true, 'Send Zelle payment to pay@jadorebakery.com', '{"email":"pay@jadorebakery.com"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'paypal', true, 'Send PayPal payment to @jadorebakery', '{"handle":"@jadorebakery"}'::jsonb),
  ('22222222-2222-2222-2222-222222222223', 'b1111111-1111-1111-1111-111111111111', 'cash', true, 'Pay exact cash upon pickup at bakery counter', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 8. Customer Invoices & Line Items
INSERT INTO public.invoices (id, bakery_id, invoice_number, customer_id, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, balance_cents, notes, due_date) VALUES
  ('33333333-3333-3333-3333-333333333331', 'b1111111-1111-1111-1111-111111111111', 'INV-2026-001', 'e1111111-1111-1111-1111-111111111111', 'sent', 5600, 0, 5600, 0, 5600, 'Weekly subscription order for 4 Sourdough Loaves', now() + interval '7 days'),
  ('33333333-3333-3333-3333-333333333332', 'b1111111-1111-1111-1111-111111111111', 'INV-2026-002', 'e2222222-2222-2222-2222-222222222222', 'sent', 2900, 0, 2900, 0, 2900, 'Focaccia + Country Boule order', now() + interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice_items (id, invoice_id, description, quantity, unit_price_cents, total_price_cents) VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Classic Sourdough Loaf', 4, 1400, 5600),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 'Rosemary Sea Salt Focaccia', 1, 1800, 1800),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333332', 'Whole Wheat Country Boule', 1, 1100, 1100)
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Orders (10 Customer Orders & Line Items)
INSERT INTO public.orders (id, bakery_id, customer_id, storefront_id, pickup_date, pickup_time, status, total_cents, amount_paid_cents, payment_status, notes, source) VALUES
  ('55555555-5555-5555-5555-555555555501', 'b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-07-31', '10:00 AM', 'confirmed', 2800, 2800, 'paid', 'Extra dark crust requested', 'online'),
  ('55555555-5555-5555-5555-555555555502', 'b1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-07-31', '11:30 AM', 'in-production', 1800, 1800, 'paid', 'Extra rosemary topping', 'online'),
  ('55555555-5555-5555-5555-555555555503', 'b1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-08-01', '09:00 AM', 'confirmed', 3000, 0, 'unpaid', 'Saturday morning pickup', 'in-person'),
  ('55555555-5555-5555-5555-555555555504', 'b1111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-08-01', '08:00 AM', 'in-production', 10600, 5000, 'partially-paid', 'Wholesale delivery batch for café', 'wholesale'),
  ('55555555-5555-5555-5555-555555555505', 'b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-08-02', '10:00 AM', 'confirmed', 4200, 0, 'unpaid', 'Sunday morning family brunch', 'online'),
  ('55555555-5555-5555-5555-555555555506', 'b1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-07-30', '02:00 PM', 'ready', 3600, 3600, 'paid', 'Ready for afternoon pickup', 'online'),
  ('55555555-5555-5555-5555-555555555507', 'b1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-07-29', '10:00 AM', 'completed', 2900, 2900, 'paid', 'Fulfilled successfully', 'online'),
  ('55555555-5555-5555-5555-555555555508', 'b1111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '2026-07-28', '08:30 AM', 'completed', 5600, 5600, 'paid', 'Completed wholesale delivery', 'wholesale'),
  ('55555555-5555-5555-5555-555555555509', 'b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-08-03', '12:00 PM', 'confirmed', 3600, 0, 'unpaid', 'Focaccia tray for lunch party', 'online'),
  ('55555555-5555-5555-5555-555555555510', 'b1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-08-03', '11:00 AM', 'confirmed', 1500, 1500, 'paid', 'Sliced whole wheat boule', 'in-person')
ON CONFLICT (id) DO NOTHING;

-- Order Items
INSERT INTO public.order_items (id, order_id, recipe_id, product_name, quantity, unit_price_cents, total_price_cents) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 2, 1400, 2800),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'f2222222-2222-2222-2222-222222222222', 'Rosemary Sea Salt Focaccia', 1, 1800, 1800),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503', 'f3333333-3333-3333-3333-333333333333', 'Whole Wheat Country Boule', 2, 1500, 3000),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 5, 1400, 7000),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555504', 'f2222222-2222-2222-2222-222222222222', 'Rosemary Sea Salt Focaccia', 2, 1800, 3600),
  ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555505', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 3, 1400, 4200),
  ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555506', 'f2222222-2222-2222-2222-222222222222', 'Rosemary Sea Salt Focaccia', 2, 1800, 3600),
  ('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555507', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 1, 1400, 1400),
  ('66666666-6666-6666-6666-666666666609', '55555555-5555-5555-5555-555555555507', 'f3333333-3333-3333-3333-333333333333', 'Whole Wheat Country Boule', 1, 1500, 1500),
  ('66666666-6666-6666-6666-666666666610', '55555555-5555-5555-5555-555555555508', 'f1111111-1111-1111-1111-111111111111', 'Classic Sourdough Loaf', 4, 1400, 5600),
  ('66666666-6666-6666-6666-666666666611', '55555555-5555-5555-5555-555555555509', 'f2222222-2222-2222-2222-222222222222', 'Rosemary Sea Salt Focaccia', 2, 1800, 3600),
  ('66666666-6666-6666-6666-666666666612', '55555555-5555-5555-5555-555555555510', 'f3333333-3333-3333-3333-333333333333', 'Whole Wheat Country Boule', 1, 1500, 1500)
ON CONFLICT (id) DO NOTHING;

-- Production Tasks
INSERT INTO public.production_tasks (id, bakery_id, order_id, recipe_id, flow_id, flow_step_id, title, category, status, scheduled_at, duration_minutes, urgency, delay_minutes, skip_reason) VALUES
  ('77777777-7777-7777-7777-777777777701', 'b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555501', 'f1111111-1111-1111-1111-111111111111', 'seed-flow-024', 'seed-step-mix-024', 'Mix Sourdough Batch #024', 'mixing', 'pending', now() + interval '1 hour', 45, 'normal', 0, null),
  ('77777777-7777-7777-7777-777777777702', 'b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555502', 'f2222222-2222-2222-2222-222222222222', 'seed-flow-focaccia', 'seed-step-shape-focaccia', 'Shape Focaccia Trays', 'shaping', 'in-progress', now() + interval '2 hours', 30, 'normal', 0, null),
  ('77777777-7777-7777-7777-777777777703', 'b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555503', 'f3333333-3333-3333-3333-333333333333', 'seed-flow-boule', 'seed-step-bake-boule', 'Bake Whole Wheat Boules', 'baking', 'pending', now() + interval '3 hours', 50, 'normal', 0, null)
ON CONFLICT (id) DO NOTHING;
