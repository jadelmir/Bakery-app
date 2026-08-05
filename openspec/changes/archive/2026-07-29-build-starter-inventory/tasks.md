## 1. Domain modeling and calculation utilities

- [x] 1.1 Add typed local models and seed data for starter profiles, planned starter builds, inventory items, requirement lines, deduction settings, and inventory transactions.
- [x] 1.2 Implement and unit-test starter-demand calculation from scheduled orders, including feeding-ratio math, retained targets, last-feeding data, and insufficient-seed warnings.
- [x] 1.3 Implement and unit-test compatibility grouping for starter builds, preserving order contributors and separating incompatible profiles or peak windows.
- [x] 1.4 Add override inputs to planned builds and recalculate final build totals, usable starter, expected retained amount, and warnings from the selected values.
- [x] 1.5 Implement and unit-test requirement aggregation by day and order, combining scaled recipe and packaging lines with allocated starter-build flour and water without double counting.
- [x] 1.6 Implement and unit-test available, required, shortage, and shopping-list projections plus idempotent inventory deductions keyed to the configured completion trigger.

## 2. Production-plan integration

- [x] 2.1 Connect generated starter-build tasks to their calculated individual or compatible combined build while retaining source-order traceability.
- [x] 2.2 Display associated starter-build quantities and contributors in task detail without changing the existing schedule-generation behavior.
- [x] 2.3 Route production-task and order completion through the configured deduction trigger and surface the recorded inventory movement once per source event.

## 3. Starter and inventory experience

- [x] 3.1 Replace the Starter placeholder with current profile information, upcoming calculated builds, contributor visibility, and insufficient-starter warnings.
- [x] 3.2 Add Starter controls for default/custom ratios and build overrides, showing adjusted build totals and retained amounts immediately.
- [x] 3.3 Replace the Inventory placeholder with on-hand, selected-period requirements, available/required/shortage columns, and per-order inspection.
- [x] 3.4 Add a shopping-list view that contains only shortage items and their required replenishment quantities.
- [x] 3.5 Preserve desktop and mobile navigation, accessible labels, status feedback, and the explicit local-prototype limitation across the new views.

## 4. Verification

- [x] 4.1 Add focused unit tests for starter calculations, compatible and incompatible combinations, overrides, requirement attribution, shortages, and duplicate-deduction prevention.
- [x] 4.2 Add focused UI tests for starter-task detail, build warnings/overrides, daily and per-order inventory requirements, and the shopping list.
- [x] 4.3 Run the frontend lint, type/build, and test quality checks; manually smoke-test Starter, Inventory, production-task completion, and order-completion deduction paths at desktop and mobile widths.
