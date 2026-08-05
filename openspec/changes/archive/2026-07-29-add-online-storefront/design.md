# Design - Add Online Storefront and Public Checkout (Phase F6 / F10 / B7 / B11)

## Context

Bakery owners want to sell online without exposing internal recipe costs or overloading their kitchen capacity. Public customers need a fast, mobile-friendly checkout experience (`/store/:slug`) that enforces lead times, closed dates, and daily capacity.

This design specifies the database tables, server-side capacity validation engine, transactional order creation function, and React components.

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Public Customer Storefront                      │
│     - /store/:slug (Product Catalog, Cart Drawer, Checkout)            │
│     - FulfillmentDatePicker (Queries availability from backend)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Supabase Server Function                          │
│     - validate_storefront_checkout(slug, cart, date, time)            │
│     - create_online_order(slug, checkout_input, idempotency_key)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Supabase Postgres DB & RLS                      │
│     - public.storefronts (slug, is_enabled, capacity_rules)            │
│     - public.storefront_products (public_price_cents, lead_time)       │
│     - public.storefront_pickup_windows, storefront_closed_dates       │
└────────────────────────────────────────────────────────────────────────┘
```

## Decisions

### 1. Separation of Recipes and Storefront Products
Internal recipe costs, flour formulas, and margins remain private in `recipes`. `storefront_products` links to `recipe_id` but maintains separate public fields (`public_name`, `public_description`, `online_price_cents`, `image_path`, `is_published`, `is_sold_out`).

### 2. Server-Side Availability & Capacity Validation
Availability is computed server-side, never trusted solely from the browser. The backend evaluates:
- Store status (`is_enabled`)
- Product publication status (`is_published`, `is_sold_out`)
- Product & store lead times (`minimum_lead_time_hours`)
- Cutoff times (`order_cutoff_time`)
- Closed dates (`storefront_closed_dates`)
- Daily order limits (`maximum_daily_orders`)
- Pickup window capacity (`storefront_pickup_windows`)

### 3. Transactional Order Creation
`create_online_order` executes inside a single Postgres transaction:
1. Validate store & product availability
2. Recheck lead times & capacity limits
3. Match or create customer profile by normalized email/phone
4. Create `orders` and `order_items` records
5. Calculate inventory requirements & deduplicate
6. Generate chronological `production_tasks`
7. Issue invoice/receipt
8. Record idempotency key
