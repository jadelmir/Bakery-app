## Why

The production engine schedules confirmed orders but leaves bakers to calculate starter feeds and aggregate ingredient demand manually. Phase 4 makes those plans actionable by showing the starter build, what stock is needed, and what must be purchased before production begins.

## What Changes

- Add starter profiles and calculated starter builds that show seed starter, flour, water, total build, usable amount, and expected retained amount.
- Combine compatible starter needs across relevant orders and warn when available retained starter cannot satisfy the calculated seed amount.
- Calculate ingredient and packaging requirements by day and by order, including flour and water required for starter builds.
- Add inventory availability, shortage, and shopping-list views derived from on-hand quantities and upcoming requirements.
- Support one configurable inventory-deduction point and prevent the same order or production work from being deducted twice.

## Capabilities

### New Capabilities

- `starter-build-management`: Define starter feed settings and calculate, combine, review, and override starter builds for scheduled production.
- `inventory-requirements-management`: Calculate upcoming ingredient and packaging demand, surface shortages and a shopping list, and record inventory deductions without double counting.

### Modified Capabilities

- `production-task-generation`: Enrich generated starter-related tasks with the calculated starter-build information needed to complete them.

## Impact

- Affected frontend areas include production tasks, the Starter and Inventory screens, shared local production state, and focused frontend tests.
- Adds typed local starter, inventory, requirement, and transaction models plus deterministic calculation utilities; persistence, authentication, purchasing integrations, and automatic inventory replenishment remain out of scope.
- Uses the existing React, TypeScript, Vite, Tailwind, shadcn/ui, and Vitest frontend stack.
