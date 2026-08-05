## Context

The frontend currently holds Phase 3 production plans in local shared state and generates tasks deterministically from confirmed orders. It has placeholder Starter and Inventory content, but no shared domain model or calculation boundary for starter feeds, requirements, shortages, or inventory movements. See proposal.md for motivation and the accompanying delta specs for required behavior.

## Goals / Non-Goals

**Goals:**
- Add typed local domain records and pure calculation utilities that derive starter builds, requirements, shortages, and a shopping list from the production plan and on-hand inventory.
- Make combined-build membership and inventory-deduction sources traceable so changing views does not change the underlying calculation.
- Integrate calculated starter information into generated starter-build tasks without coupling schedule calculations to screen components.

**Non-Goals:**
- Backend persistence, multi-user synchronization, purchase receiving, supplier ordering, automatic replenishment, or historical accounting.
- Revising the Phase 3 scheduling algorithm, automatically changing an incompatible schedule, or adding a generic recipe/ingredient editor.

## Decisions

### Use a single derived planning domain for starter and inventory calculations

Introduce typed starter profiles, starter-build plans, inventory items, requirement lines, and inventory transactions adjacent to the Phase 3 production domain. Pure utilities will accept generated tasks, orders, recipes, profiles, and on-hand quantities and return stable calculated models for the Starter, Inventory, and task-detail views.

The alternative—calculating each screen independently—would make starter flour and water easy to omit from inventory demand and would allow the same plan to present conflicting shortages.

### Combine builds with an explicit compatibility key

Starter-build generation will group only plans with the same profile and normalized peak window. Each generated build will keep contributor records containing order and usable-starter demand, allowing the UI to explain why requirements were combined and to keep per-order inventory attribution.

The alternative—combining all starter demand on a day—could mix starters or incompatible timing and would violate the production-plan constraints.

### Treat overrides as calculation inputs, not ad hoc task edits

Store a per-build optional override for seed, flour, water, and retained quantities. The calculator will use overrides when deriving displayed totals and requirements while retaining the recommended values for comparison. Starter-build tasks reference the final selected build rather than duplicating quantity fields.

The alternative—editing a task's display fields directly—would leave inventory calculations and combined-build details out of sync.

### Make inventory movement idempotent through source keys

Expose a single prototype setting for the deduction trigger: production task completion or order completion. Creating a deduction records a stable source key made from the configured event and contributing order item or task; a repeated event is ignored if its source key is already recorded.

The alternative—subtracting directly from on-hand quantities inside event handlers—would make double deductions likely and offers no way to explain a stock change.

### Derive requirements from recipe lines plus allocated starter inputs

Recipe and packaging requirement lines are scaled by the planned order quantity. Starter-build flour and water are added once per build and allocated across contributor orders for order-level inspection; the aggregate day view consumes the unallocated total. Availability, shortage, and shopping list remain projections over the same requirement lines.

The alternative—counting active starter as a purchased ingredient as well as its feed inputs—would double count demand and obscure the required flour and water.

## Risks / Trade-offs

- [Local values disappear after refresh] → Keep the local-only boundary visible and shape records so a later persistence adapter can own them.
- [Rounding causes a small mismatch between combined and allocated quantities] → Retain calculation precision internally and round only displayed quantities, assigning any remainder deterministically.
- [A manual override makes a build insufficient] → Show the resulting usable and retained amounts and preserve the availability warning rather than silently correcting it.
- [Task and order completion events can occur in either order] → Use the configured single trigger and transaction source keys to make events idempotent.

## Migration Plan

1. Add the local domain types, seed data, and pure calculation tests without changing existing production scheduling behavior.
2. Generate starter-build references for existing starter tasks and derive requirements from the shared production collection.
3. Replace Starter and Inventory placeholders with calculated views and connect the configured deduction action.
4. Run focused unit and UI tests plus the existing frontend quality checks.

Rollback is a normal source revert. The phase introduces no persisted schema or externally visible API migration.
