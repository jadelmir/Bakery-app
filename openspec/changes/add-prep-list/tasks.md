## 1. Repository and domain exploration

- [x] 1.1 Inspect the current order, order-item, fulfillment-date, recipe, recipe-ingredient, inventory-item, and production-flow contracts on `develop`.
- [x] 1.2 Confirm the current one-to-one recipe-line scaling convention and supported units; document that the existing free-text yield is not parsed for numeric batch conversion.
- [x] 1.3 Confirm recipe-level lead time as the MVP scheduling model: `prep_lead_days` defaults to 1, supports 0..N days before fulfillment, and derives each order-item prep date without a per-order override.
- [x] 1.4 Identify existing Supabase tables, RLS policies, adapters, and test fixtures that can be reused. Do not introduce duplicate requirement or inventory-deduction logic.

## 2. Domain and persistence design

- [x] 2.1 Define the Prep List read model with bakery ID, derived prep date, fulfillment date, source order/order-item identifiers, product quantity, material quantity, unit, material kind, and calculation/source metadata.
- [x] 2.2 Add `recipes.prep_lead_days` with default 1 and a non-negative constraint; define date-only subtraction using the bakery's local date semantics.
- [x] 2.3 Update recipe domain contracts, local/Supabase adapters, save RPC, generated database types, and recipe editor persistence for the lead-time setting.
- [x] 2.4 Define recalculation behavior when fulfillment dates or recipe lead times change; no separate reset operation is needed while prep dates remain derived.
- [x] 2.5 Define validation for missing fulfillment dates, missing recipe mappings, archived/missing material references, unsupported units, invalid quantities, cancelled orders, and incomplete recipe data.
- [x] 2.6 Confirm that prep-list reads and recipe timing writes are bakery-scoped and protected by the existing tenant-membership RLS boundary.

## 3. Requirement calculation

- [x] 3.1 Generate product-level preparation rows from eligible scheduled orders and order-item quantities.
- [x] 3.2 Scale persisted recipe-line quantities by ordered product quantity under the established one-to-one convention; do not parse the free-text recipe yield.
- [x] 3.3 Include active inventory items of kind ingredient or packaging, exclude finished goods, and preserve warnings for archived or missing references.
- [x] 3.4 Aggregate equivalent materials by stable inventory-item ID and compatible base unit, not by display name alone.
- [x] 3.5 Retain order-level traceability so an aggregated material total can be expanded to its contributing orders.
- [x] 3.6 Reuse compatible availability calculations without calling reservation/deduction mutations; keep any starter-build material contribution explicit.
- [x] 3.7 Report calculation warnings for unmapped products, missing recipes, incompatible units, archived materials, or unavailable source data instead of silently excluding rows.
- [x] 3.8 Keep available stock and required prep quantity as separate values; do not deduct inventory as a result of viewing or checking off prep items.

## 4. Frontend workflow

- [x] 4.1 Add a Prep List screen or workspace section with a selected prep date and navigation to adjacent dates.
- [x] 4.2 Display product quantities and ingredient quantities, with an expandable order-level breakdown.
- [x] 4.3 Show fulfillment date, source order reference, and relevant order status for traceability.
- [x] 4.4 Add a recipe-editor control for prep lead time and clearly show each Prep List date as derived from the recipe setting.
- [x] 4.5 Show the effective lead-time rule and recalculate affected upcoming orders when the recipe setting changes.
- [x] 4.6 Keep check-off state out of the MVP because it has no persistence boundary yet; the view remains read-only and cannot create duplicate tasks or inventory deductions.
- [x] 4.7 Add loading, empty, missing-recipe, and calculation-warning states; unavailable snapshot data is represented by the loading state because the domain hook does not expose a separate error channel.
- [x] 4.8 Preserve local/mock adapter behavior and existing workspace navigation patterns.

## 5. Verification

- [x] 5.1 Add unit tests for recipe lead-time defaults, same-day/two-day timing, fulfillment-date changes, recipe-setting changes, and local date boundaries.
- [x] 5.2 Add calculation tests for one-to-one recipe scaling, ingredient and packaging inclusion, multiple-order aggregation, stable material identity, unit compatibility, and order traceability.
- [x] 5.3 Add tests for missing recipes, invalid quantities, archived materials, cancelled/ineligible orders, and calculation warnings.
- [x] 5.4 Confirm tenant isolation through the existing membership-gated recipe RPC and bakery-scoped snapshot boundary; no separate Prep List persistence table or mutation was introduced.
- [x] 5.5 Add component/workspace tests for lead-time editing, date filtering, product/ingredient/packaging display, empty states, and error states; the screen's unavailable snapshot path is covered by its loading state.
- [x] 5.6 Run affected database checks, typecheck, lint, focused tests, and build; record unrelated existing failures without weakening the feature scope. Focused tests, lint, build, migration application, and generated-type checks pass. Full Vitest remains 321/324 with three unrelated pre-existing failures; typecheck remains blocked by four unrelated existing errors.
- [x] 5.7 Update OpenSpec program mapping and relevant architecture/database references after the implementation design is confirmed.
