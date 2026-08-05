# Proposal - Add Online Storefront and Public Checkout (Phase F6 / F10 / B7 / B11)

## Why

Bakery customers need a public online storefront (`/store/:slug`) where they can view published products, choose fulfillment options (pickup window or delivery), select available dates based on bakery capacity rules, submit online orders, and receive automated production tasks.

Bakery owners need controls to toggle store availability on/off, set unique slugs, configure pickup windows and closed dates, set daily order/product capacity limits, and publish select recipes as online products without exposing internal cost data.

This change establishes the Supabase database schema, RLS policies, availability/capacity validation engine, domain contracts, public storefront UI, and store settings management.

## What Changes

- **Backend (B7 / B11)**:
  - Add Supabase migration creating `storefronts`, `storefront_products`, `storefront_pickup_windows`, `storefront_closed_dates`, `storefront_capacity_rules`, and `online_order_attempts` tables.
  - Server-side availability validation checking store enabled status, product publication, lead time, closed dates, daily order capacity, and pickup window capacity.
  - Transactional online order creation function generating orders, items, customer records, inventory checks, and chronological production tasks in one atomic transaction.
  - Idempotency key handling to prevent duplicate online orders.
  - Enable RLS policies scoped to `bakery_memberships` for management and token/slug-gated public read access.
- **Frontend (F6 / F10 / F12)**:
  - `StorefrontDashboard` for store toggle, public URL preview, and order metrics.
  - `StoreSettingsForm` for configuring store name, slug, description, pickup windows, lead time, and closed dates.
  - `ProductPublishing` settings attached to Recipe management.
  - Public Storefront (`/store/:slug`) with store header, product catalog, cart drawer, `FulfillmentDatePicker`, checkout form, and order confirmation screen.
  - Navigation entries for Online Store under workspace settings and navigation registry.

## Capabilities

### New Capabilities
- `online-storefront`: Defines storefront settings, public product publishing, capacity and pickup window enforcement, public store checkout, and automated online order creation.

## Impact
- **Database Schema**: Adds 6 tables (`storefronts`, `storefront_products`, `storefront_pickup_windows`, `storefront_closed_dates`, `storefront_capacity_rules`, `online_order_attempts`) with RLS policies and indexes.
- **Frontend Navigation**: Adds `/app/settings/store` and public `/store/:slug` routes.
- **Dependencies**: Depends on Phase B2 (`add-multi-store-workspaces`) for tenant isolation and Phase F4 (`add-recipe-management`) for recipe product sources.
