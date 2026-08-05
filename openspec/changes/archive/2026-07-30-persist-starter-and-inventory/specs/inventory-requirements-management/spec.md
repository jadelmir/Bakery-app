# inventory-requirements-management Delta Specification

## ADDED Requirements

### Requirement: Database Persistence for Inventory Movements & Deductions
The backend database MUST store all inventory transactions (deductions, restocks, count adjustments) in `inventory_transactions` with RLS policies restricting operations to active bakery members.

#### Scenario: Inserting an inventory transaction in Supabase
- **GIVEN** an authenticated bakery staff member
- **WHEN** an ingredient restock or task deduction transaction is logged
- **THEN** a record is created in `inventory_transactions` with `bakery_id`, `item_id`, `quantity_change`, and `source_key`

### Requirement: Database Persistence for Starter Profiles and Daily Builds
The backend database MUST store starter build profiles and daily build records in `starter_profiles` and `starter_builds` scoped to the active bakery workspace.

#### Scenario: Saving a starter profile and calculating daily build
- **GIVEN** a bakery sourdough starter configuration
- **WHEN** a starter build is computed for an upcoming production day
- **THEN** `starter_builds` stores `seed_amount_g`, `flour_amount_g`, `water_amount_g`, and `usable_amount_g` with RLS protection
