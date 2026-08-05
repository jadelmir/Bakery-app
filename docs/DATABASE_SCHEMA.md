# Bakery App Database Schema & Migration Index

## 1. RLS Ownership Model
Every top-level application table contains a required `bakery_id` UUID foreign key referencing `bakeries.id`, and all Row-Level Security (RLS) policies mandate that `auth.uid()` possesses an active membership row in `bakery_memberships` (or via `private.is_bakery_member(bakery_id)`) for the target workspace.

## 2. Migration Index

| Migration File | Date | Summary of Changes |
|---|---|---|
| `20260729133759_backend_phase_1_foundation.sql` | 2026-07-29 | Baseline foundation migration establishing initial database structure and extension defaults. |
| `20260729135107_secure_existing_rls_auto_enable.sql` | 2026-07-29 | Security hardening revoking public/anon execution permissions on internal `rls_auto_enable()` helper function. |
| `20260729140126_add_multi_store_workspaces.sql` | 2026-07-29 | Multi-store workspace foundation defining `profiles`, `bakeries`, `bakery_memberships`, and `bakery_invitations` tables and workspace management RPCs. |
| `20260729142630_harden_workspace_rpc_boundaries.sql` | 2026-07-29 | Security refinement establishing explicit search paths and execution boundaries on security definer workspace RPC functions. |
| `20260729143659_strengthen_workspace_security_contracts.sql` | 2026-07-29 | Strengthened workspace security policies, role assignment enforcement, and last-owner deletion protection. |
| `20260729150000_ingredients_and_costing.sql` | 2026-07-29 | Ingredients catalog and inventory costing tables (`ingredients`, `inventory_movements`) with generated unit cost calculations. |
| `20260729160000_invoices_and_payments.sql` | 2026-07-29 | Invoicing, payments, and payment methods schema (`invoices`, `invoice_items`, `invoice_events`, `bakery_payment_methods`, `invoice_payment_methods`, `payments`). |
| `20260729170000_online_storefront.sql` | 2026-07-29 | Storefront publishing, availability rules, customers, recipes, and order management schema (`recipes`, `customers`, `storefronts`, `storefront_products`, `storefront_pickup_windows`, `storefront_closed_dates`, `storefront_capacity_rules`, `online_order_attempts`, `orders`, `order_items`). |
| `20260730180000_starter_and_inventory_movements.sql` | 2026-07-30 | Sourdough starter maintenance profiles, starter builds, inventory transactions ledger, and task execution logging (`starter_profiles`, `starter_builds`, `inventory_transactions`, `task_execution_logs`). |

## 3. Implemented Tables

- `profiles`: User account identity records linked 1:1 with `auth.users`, storing full name, contact information, and default bakery preference.
- `bakeries`: Bakery workspace instances containing bakery name, IANA timezone, currency code, and creator ownership reference.
- `bakery_memberships`: Join table mapping user accounts to bakeries with assigned workspace roles (`owner`, `manager`, `staff`).
- `bakery_invitations`: Team member email invitations storing token hashes, roles, expiration times, and invitation statuses.
- `ingredients`: Master catalog for raw ingredients and packaging items, storing base units, package pricing, generated unit cost, stock on hand, and reorder levels.
- `inventory_movements`: Stock movement logs recording inventory quantity changes and movement reasons (`restock`, `waste`, `adjustment`, `task-deduction`).
- `invoices`: Customer billing invoices storing unique bakery invoice numbers, status, financial totals (in cents), due dates, public token UUIDs, and immutable customer/bakery snapshots.
- `invoice_items`: Line items linked to invoices storing description, quantity, unit price in cents, and calculated line total in cents.
- `invoice_events`: Audit log recording lifecycle transitions and activity events for invoices (created, sent, viewed, payment received, cancelled).
- `bakery_payment_methods`: Bakery configuration for accepted payment options (Zelle, PayPal, Cash, Check, Custom) and payment instructions.
- `invoice_payment_methods`: Association table linking specific bakery payment methods to an issued invoice.
- `payments`: Financial payment transactions recorded against invoices or orders with amount in cents, payment method, and reference details.
- `recipes`: Master recipe definitions storing product name, target yield, batch cost in cents, selling price in cents, and production flow link.
- `customers`: Customer directory containing customer contact details, phone, email, shipping/billing address, notes, and bakery ownership.
- `storefronts`: Online ordering storefront setup storing custom URL slug, operating rules, minimum lead times, and storefront branding settings.
- `storefront_products`: Catalog products published to online storefronts with custom title, description, online price in cents, image path, and sold-out status.
- `storefront_pickup_windows`: Recurring day-of-week pickup windows defining operating hours and maximum order capacities for customer pickup.
- `storefront_closed_dates`: Blackout calendar dates when customer online ordering and pickups are disabled.
- `storefront_capacity_rules`: Operating constraint rules limiting daily orders, window orders, or product-specific daily limits during storefront checkout.
- `online_order_attempts`: Idempotency tracking records for public storefront checkout submissions to prevent duplicate order generation.
- `orders`: Master order records storing customer references, pickup date/time, order fulfillment status, total cents, payment status, and order source.
- `order_items`: Order line items capturing ordered recipe, product title, quantity, pricing, and notes.
- `starter_profiles`: Sourdough starter maintenance definitions storing flour, water, and seed ratios, build duration hours, and default status.
- `starter_builds`: Calculated starter production builds detailing flour/water/seed amounts, total build weight, usable starter yield, and retained starter weight.
- `inventory_transactions`: Append-only inventory ledger tracking stock deductions, restocks, adjustments, unit cost cents, and invoice references.
- `task_execution_logs`: Operational execution audit logs for production task timers, delays, skips, and task completions.

## 4. Planned Tables

- `bakery_settings` `[planned]`: Workspace operational settings including business hours, equipment capacity, scheduling buffers, inventory deduction triggers, and notification defaults.
- `notification_preferences` `[planned]`: User and bakery notification preferences governing channels, enabled event types, and lead times.
- `ingredient_purchases` `[planned]`: Detailed supplier purchase records storing package quantities, package prices in cents, supplier names, and purchase timestamps.
- `recipe_ingredients` `[planned]`: Detailed recipe composition table mapping ingredients to recipes with exact quantities, units, usage stages, and sort order.
- `manual_expenses` `[planned]`: Manual bakery operational expense entries recording category, description, amount in cents, expense date, and reference tags.
- `production_flows` `[planned]`: Reusable production flow templates defining anchor types, grouping policies, and flow descriptions.
- `flow_steps` `[planned]`: Production flow step definitions detailing timing methods, day offsets, clock times, relative step dependencies, durations, and instructions.
- `invoice_deliveries` `[planned]`: Outbound invoice delivery attempt records tracking recipient, delivery state, provider message IDs, sent/failed timestamps, and failure reasons.
- `production_tasks` `[planned]`: Scheduled production tasks scaled from confirmed orders, storing scheduled time, duration, status, dependencies, and grouping IDs.
- `starter_build_contributors` `[planned]`: Mapping table linking individual order items and tasks to a consolidated starter build requirements plan.
- `notifications` `[planned]`: In-app notification queue tracking recipient user, event type, title, body text, source reference link, and read/dismissed state.

## 5. Key Constraints

- **Last-Owner Protection**: Enforced at database policy and RPC level (`prevent_last_owner_removal` / `remove_bakery_member`), ensuring a bakery workspace can never have its last remaining owner removed or demoted without explicit bakery deletion.
- **Snapshot Immutability**: Confirmed orders and issued invoices snapshot customer, address, product, recipe, pricing, cost, and flow data (via JSONB snapshots or frozen table columns) at the point of confirmation/issuance; subsequent edits to master catalog items never alter historical financial or production records.
- **Integer Cents Rule**: All monetary values across all database tables (`subtotal_cents`, `total_cents`, `amount_paid_cents`, `balance_cents`, `unit_price_cents`, `selling_price_cents`, `batch_cost_cents`) MUST be stored as integer cents (`bigint` or `integer`, where `$12.50` = `1250`). Floating-point currency values are strictly prohibited.
