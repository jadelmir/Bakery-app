# Proposal - Add Ingredients and Stock Entry (Phase F3 / B3)

## Why

Following the completion and verification of Phase F1 (`establish-shared-application-foundation`), the Bakery App requires persistent ingredient management, automated base-unit costing, and stock movement tracking (PRD Phase F3 & B3).

Currently, inventory items read static prototype data or local deductions. Bakery owners cannot add custom ingredients, update package pricing (e.g., $18 for a 5kg bag of organic flour), automatically calculate cost-per-gram/ml, record restock movements, or isolate ingredient records across bakeries in Supabase.

This change establishes the Supabase database tables, RLS isolation policies, domain contracts, and React UI components for Phase F3 / B3.

## What Changes

- Add Supabase migration for `ingredients` and `inventory_movements` tables with strict `bakery_id` foreign keys, constraints, and Row Level Security (RLS) policies.
- Extend `BakeryDomainSnapshot`, adapters, and domain commands to support loading, adding, updating, and recording stock movements for ingredients.
- Automatically calculate base-unit costs (`cost_per_unit = package_price / package_quantity`) when ingredient package pricing is saved.
- Build the Ingredient Management UI inside the Inventory screen allowing bakery owners/managers to create ingredients, adjust stock, set minimum alert thresholds, and view stock movement histories.
- Add focused unit tests for cost calculations and RLS policies, and Playwright E2E journey tests for ingredient entry.

## Capabilities

### New Capabilities
- `ingredients-and-stock-entry`: Defines ingredient package pricing, unit cost calculations, stock movement logs, and Supabase RLS isolation for PRD Phase F3 / B3.

## Impact
- **Database Schema**: Adds `ingredients` and `inventory_movements` tables in Supabase with RLS policies scoped to `bakery_memberships`.
- **Frontend UI**: Expands `InventoryScreen` with ingredient creation modals, stock adjustment forms, and unit cost indicators.
- **Dependencies**: Depends on Phase B2 (`add-multi-store-workspaces`) for authenticated `bakery_id` authorization and Phase F1 (`establish-shared-application-foundation`) for normalized domain state.
