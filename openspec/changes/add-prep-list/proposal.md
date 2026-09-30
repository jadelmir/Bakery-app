## Why

The bakery needs a preparation-focused view that tells the user which products and ingredient quantities are required for upcoming orders. Existing recipe, inventory-requirements, order, and production-flow capabilities provide the underlying data, but there is no consolidated prep-list workflow with a default preparation date that can be adjusted when operational needs change.

## What Changes

- Add a bakery-scoped Prep List capability that derives required product quantities and ingredient quantities from scheduled orders and their recipe definitions.
- Default each order's prep date to one calendar day before its fulfillment date.
- Allow the user to override the default prep date and persist the override.
- Provide a reset-to-default behavior when the user wants the prep date to follow the fulfillment date again.
- Aggregate products and ingredient requirements for a selected prep date while retaining order-level traceability.
- Reuse existing recipe scaling, ingredient, inventory, order, and production-flow domain contracts wherever possible.
- Keep inventory availability separate from required prep quantities so the prep list does not silently alter stock levels.
- Identify missing recipe mappings or unsupported units rather than silently omitting requirements.
- Preserve bakery tenant isolation and existing local/mock adapter behavior.

## Capabilities

### New Capabilities

- `prep-list`: prepare and review product and ingredient requirements grouped by an editable prep date.

### Modified Capabilities

- `order-management`: expose the fulfillment/prep-date relationship required for prep-list generation without changing existing order status semantics.
- `recipe-management`: provide recipe yield and ingredient scaling data required for reliable requirement calculation.
- `inventory-requirements-management`: reuse requirement and availability concepts without duplicating inventory deduction behavior.
- `production-flow-management`: preserve flow/task scheduling boundaries; the Prep List is a planning view and must not create duplicate production tasks.

## Impact

- Frontend Prep List feature, screens, components, domain contracts, and tests under `Front-end/src/features/`.
- Order and recipe projections used to calculate product and ingredient requirements.
- Potential persisted order/prep scheduling fields or a dedicated prep-list projection, depending on the existing Supabase schema and domain boundaries.
- Existing inventory-requirements and production-flow integrations.
- OpenSpec traceability and documentation for the new prep-list capability.

## Non-Goals

- Automatically deducting inventory when a prep item is checked off.
- Replacing the existing production-flow task scheduler.
- Introducing a separate recipe system or duplicating recipe ingredient definitions.
- Automatically changing order status or payment status.
- Treating available inventory as a substitute for the total quantity required for preparation.
