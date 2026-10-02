## Why

The bakery needs a preparation-focused view that tells the user which products and ingredient quantities are required for upcoming orders. Existing recipe, inventory-requirements, order, and production-flow capabilities provide the underlying data, but there is no consolidated prep-list workflow with a default preparation date that can be adjusted when operational needs change.

## What Changes

- Add a bakery-scoped Prep List capability that derives required product quantities and ingredient quantities from scheduled orders and their recipe definitions.
- Add a recipe-level preparation lead-time setting, defaulting to one calendar day before fulfillment.
- Allow each recipe's lead time to be set to same day, one day before, two days before, or another non-negative number of days.
- Derive each eligible order item's prep date from its recipe setting and fulfillment date without duplicating a per-order date in the MVP.
- Aggregate products and ingredient requirements for a selected prep date while retaining order-level traceability.
- Reuse existing recipe scaling, ingredient, packaging, inventory, order, and production-flow domain contracts wherever possible.
- Include active recipe-linked ingredients and packaging/retail supplies in the materials view, with warnings for missing or archived references.
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
- A persisted `recipes.prep_lead_days` setting and a derived Prep List read model; no separate order/prep table is required for the MVP.
- Existing inventory-requirements and production-flow integrations.
- OpenSpec traceability and documentation for the new prep-list capability.

## Non-Goals

- Automatically deducting inventory when a prep item is checked off.
- Supporting one-off per-order or per-order-item prep-date overrides.
- Parsing the existing free-text recipe yield into numeric batch conversions.
- Replacing the existing production-flow task scheduler.
- Introducing a separate recipe system or duplicating recipe ingredient definitions.
- Automatically changing order status or payment status.
- Treating available inventory as a substitute for the total quantity required for preparation.
