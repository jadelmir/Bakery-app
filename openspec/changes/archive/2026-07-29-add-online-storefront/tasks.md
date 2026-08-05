# Tasks - Add Online Storefront and Public Checkout (Phase F6 / F10 / B7 / B11)

## 1. Database Schema & Security (Backend B7 / B11)

- [x] 1.1 Create SQL migration `Front-end/supabase/migrations/20260729170000_online_storefront.sql` adding `storefronts`, `storefront_products`, `storefront_pickup_windows`, `storefront_closed_dates`, `storefront_capacity_rules`, and `online_order_attempts` tables.
- [x] 1.2 Enable Row Level Security (RLS) on private tables scoped to `bakery_memberships` and add public SELECT policies for enabled storefronts and published products by slug.
- [x] 1.3 Implement Postgres function `validate_storefront_checkout` evaluating lead times, closed dates, daily order capacity, and pickup window limits.
- [x] 1.4 Implement transactional Postgres function `create_online_order` handling customer matching, order creation, inventory checks, task generation, and idempotency key recording.

## 2. Store Management UI (Frontend F10 / F12)

- [x] 2.1 Build `StorefrontDashboard.tsx` displaying store toggle (On/Off), public store URL, QR code, published product count, and online order metrics.
- [x] 2.2 Build `StoreSettingsForm.tsx` for configuring store name, unique slug, logo, cover image, lead times, order cutoff times, closed dates, and daily capacity limits.
- [x] 2.3 Add product publishing controls to `RecipeManager` allowing users to publish recipes as storefront products with custom public titles, descriptions, and online prices.
- [x] 2.4 Register `/app/settings/store` in workspace settings navigation.

## 3. Public Storefront & Checkout (Frontend F6)

- [x] 3.1 Build public storefront route `/store/:slug` featuring store header, description, pickup/delivery selector, and responsive product catalog.
- [x] 3.2 Build `FulfillmentDatePicker.tsx` querying backend availability and disabling lead-time / capacity-blocked dates dynamically.
- [x] 3.3 Build `CartDrawer.tsx` and `CheckoutForm.tsx` handling customer contact details, fulfillment window selection, payment method choice, and submission.
- [x] 3.4 Build `OrderConfirmation.tsx` showing order summary, pickup/delivery details, and payment instructions.

## 4. Verification & Quality Gates

- [x] 4.1 Run TypeScript typecheck (`npm run typecheck`) and Vitest test suite (`npm test`).
- [x] 4.2 Add Playwright E2E journey in `Front-end/e2e/online-storefront.spec.ts` testing store settings configuration, product publishing, public storefront browsing, capacity validation, and online order checkout.
- [x] 4.3 Update `openspec/PROGRAM_MAP.md` marking Phase F6 / B7 / B11 as verified.
