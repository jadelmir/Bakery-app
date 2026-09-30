## 1. Repository and domain exploration

- [ ] 1.1 Inspect the current order, order-item, fulfillment-date, recipe, recipe-ingredient, inventory-item, and production-flow contracts on `develop`.
- [ ] 1.2 Confirm the recipe yield/scaling convention and supported units; document how product quantity maps to recipe batches.
- [ ] 1.3 Identify whether prep scheduling belongs at order level, order-item level, or in a dedicated prep projection. Prefer order-item-level scheduling if one order can contain products with different production timing; otherwise document the order-level MVP constraint.
- [ ] 1.4 Identify existing Supabase tables, RLS policies, adapters, and test fixtures that can be reused. Do not introduce duplicate requirement or inventory-deduction logic.

## 2. Domain and persistence design

- [ ] 2.1 Define the Prep List read model with bakery ID, prep date, fulfillment date, source order/order-item identifiers, product quantity, ingredient quantity, unit, and calculation/source metadata.
- [ ] 2.2 Define the default-date rule as the fulfillment date minus one calendar day using the bakery's local date semantics.
- [ ] 2.3 Persist an explicit override indicator or equivalent state so a manually changed prep date is not silently overwritten when the fulfillment date changes.
- [ ] 2.4 Define reset-to-default behavior that clears the override and recalculates the date from fulfillment date.
- [ ] 2.5 Define validation for missing fulfillment dates, missing recipe mappings, unsupported units, invalid quantities, cancelled orders, and incomplete recipe data.
- [ ] 2.6 Confirm that prep-list reads and writes are bakery-scoped and protected by the existing tenant-membership RLS boundary.

## 3. Requirement calculation

- [ ] 3.1 Generate product-level preparation rows from eligible scheduled orders and order-item quantities.
- [ ] 3.2 Scale recipe ingredient quantities according to the repository's established recipe yield/batch rules.
- [ ] 3.3 Aggregate equivalent ingredients by stable ingredient/item ID and compatible base unit, not by display name alone.
- [ ] 3.4 Retain order-level traceability so an aggregated ingredient total can be expanded to its contributing orders.
- [ ] 3.5 Reuse existing inventory-requirement calculations where compatible, including packaging and starter-build inputs if they are already part of the established requirement model.
- [ ] 3.6 Report calculation warnings for unmapped products, missing recipes, incompatible units, or unavailable source data instead of silently excluding rows.
- [ ] 3.7 Keep available stock and required prep quantity as separate values; do not deduct inventory as a result of viewing or checking off prep items.

## 4. Frontend workflow

- [ ] 4.1 Add a Prep List screen or workspace section with a selected prep date and navigation to adjacent dates.
- [ ] 4.2 Display product quantities and ingredient quantities, with an expandable order-level breakdown.
- [ ] 4.3 Show fulfillment date, source order reference, and relevant order status for traceability.
- [ ] 4.4 Allow the user to edit a prep date and clearly distinguish default-derived dates from manually overridden dates.
- [ ] 4.5 Provide a reset-to-default action after an override.
- [ ] 4.6 Add optional local progress/check-off state only if it fits existing production-task conventions; checking an item must not create duplicate production tasks or inventory deductions.
- [ ] 4.7 Add loading, empty, error, missing-recipe, and calculation-warning states.
- [ ] 4.8 Preserve local/mock adapter behavior and existing workspace navigation patterns.

## 5. Verification

- [ ] 5.1 Add unit tests for default prep-date calculation, date override persistence, reset-to-default, fulfillment-date changes, and local date boundaries.
- [ ] 5.2 Add calculation tests for recipe scaling, multiple order aggregation, stable ingredient identity, unit compatibility, and order traceability.
- [ ] 5.3 Add tests for missing recipes, invalid quantities, cancelled/ineligible orders, and calculation warnings.
- [ ] 5.4 Add tenant-isolation tests for prep-list reads and mutations.
- [ ] 5.5 Add component/workspace tests for date editing, filtering, product/ingredient display, empty states, and error states.
- [ ] 5.6 Run affected database checks, typecheck, lint, focused tests, and build; record unrelated existing failures without weakening the feature scope.
- [ ] 5.7 Update OpenSpec program mapping and relevant architecture/database references after the implementation design is confirmed.
