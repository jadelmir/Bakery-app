# Design - Add Ingredients and Stock Entry (Phase F3 / B3)

## Context

PRD Phase F3 & B3 requires persistent ingredient records, automated cost-per-base-unit calculation, stock entry/adjustments, low-stock alert thresholds, and multi-tenant RLS isolation in Supabase.

Phase F1 established the normalized reactive domain architecture (`BakeryDomainSnapshot`), and Phase B2 established Supabase Auth and multi-store bakery workspace isolation (`bakeries`, `bakery_memberships`). This change extends that foundation to persist ingredients and inventory movements.

## Architecture & Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                     React UI (InventoryScreen)                    │
│      - Create Ingredient Modal (Name, Unit, Package Qty/Price)    │
│      - Stock Movement Modal (Restock, Damage, Adjustment)         │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                    BakeryDomainAdapter / State                    │
│  - calculateCostPerUnit(packagePrice, packageQuantity)            │
│  - createIngredient(input), recordInventoryMovement(input)        │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Supabase Postgres DB & RLS                    │
│  - public.ingredients (bakery_id, name, unit, cost_per_unit...)   │
│  - public.inventory_movements (bakery_id, ingredient_id, qty...)  │
└───────────────────────────────────────────────────────────────────┘
```

## Decisions

### 1. Base-Unit Costing Formula
Cost per base unit is computed deterministically:
\[
\text{CostPerUnit} = \frac{\text{PackagePrice}}{\text{PackageQuantity}}
\]
For example, a $15.00 package of 5,000g flour yields a cost of $0.003 per gram. This base-unit cost is stored and made available to Recipe costing (Phase F4).

### 2. Database Schema & RLS Policies
Create Supabase migration `20260729150000_ingredients_and_costing.sql`:
- Table `ingredients`:
  - `id` (UUID, PK)
  - `bakery_id` (UUID, FK to bakeries.id)
  - `name` (TEXT, NOT NULL)
  - `unit` (TEXT, e.g. "g", "ml", "items")
  - `package_quantity` (NUMERIC, > 0)
  - `package_price` (NUMERIC, >= 0)
  - `cost_per_unit` (NUMERIC, generated/calculated)
  - `on_hand` (NUMERIC, DEFAULT 0)
  - `min_level` (NUMERIC, DEFAULT 0)
  - `kind` (TEXT, 'ingredient' | 'packaging')
  - `created_at`, `updated_at`
- Table `inventory_movements`:
  - `id` (UUID, PK)
  - `bakery_id` (UUID, FK)
  - `ingredient_id` (UUID, FK to ingredients.id)
  - `quantity_change` (NUMERIC, NOT NULL)
  - `reason` (TEXT, 'restock' | 'waste' | 'adjustment' | 'task-deduction')
  - `notes` (TEXT)
  - `created_at`
- RLS Policies:
  - Select/Insert/Update restricted to authenticated users with active membership in `bakery_memberships` for that `bakery_id`.

### 3. Domain Extension
Extend `BakeryDomainSnapshot` and adapter ports:
- `createIngredient(input)`
- `updateIngredient(input)`
- `recordInventoryMovement(input)`
