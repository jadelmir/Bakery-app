## Context

The Finance route currently renders `FinancesScreen` without the active bakery
snapshot. The screen imports synthetic `ORDERS`, uses literal product rows and
comparison labels, applies no real date filtering, estimates cost as a fixed
percentage, and discards the generated CSV string instead of downloading it.

The application already has a shared bakery domain provider, order and recipe
selectors, a reporting helper, and an inventory-finance summary contract. This
change owns the Finance tab and derived reporting behavior. The active
`inventory-management` change owns inventory ledger persistence and the
financial inputs produced by inventory events.

## Goals / Non-Goals

**Goals:**

- Make Finance bakery-scoped and state-derived.
- Provide reliable period and product filtering, including mixed-product
  orders.
- Show useful summary, product, trend, and unpaid-balance information.
- Support drill-down interactions and a real filtered CSV download.
- Keep reporting pure and reusable by Dashboard and Finance surfaces.

**Non-Goals:**

- A double-entry accounting ledger, tax reporting, payroll, or bank
  reconciliation.
- New inventory persistence, purchase-entry workflows, or payment mutations.
- Replacing the existing Orders or Inventory workflows.
- Treating local prototype-derived recipe costs as hosted accounting truth.

## Decisions

### 1. Use the active domain snapshot as the single runtime source

`FinancesScreen` will receive the active bakery snapshot through the existing
domain provider or a workspace-owned selector. Runtime Finance code will not
import `ORDERS` or other synthetic constants. The reporting model will accept
normalized order headers, order lines, recipes, and optional inventory-finance
inputs so it can remain a pure derived computation.

The alternative is to keep a Finance-specific data cache, but that would allow
the Finance tab to disagree with Orders, Recipes, or Inventory after a
mutation. Shared selectors keep the current prototype and persisted adapters
on the same boundary.

### 2. Filter at the correct level

Date presets and custom ranges will use the canonical order date for sales
metrics. Inventory event measures will use their event dates when those inputs
are present. Product filters will select matching order lines, not entire
orders. For mixed orders, revenue and unpaid balance attributable to the
selected lines will be calculated from line totals and allocated proportionally
to the remaining order balance.

The product filter options will be derived from active recipes and order lines.
The existing reporting helper will be expanded or replaced with typed filter
and result models rather than adding more UI-only conditionals.

### 3. Separate product economics from cash measures

Product performance will use recipe or authoritative consumed-cost inputs for
product cost. Gross profit is revenue minus consumed product cost. Purchase
spend and current inventory value remain separate cash and balance measures and
are never subtracted a second time from gross profit. If authoritative
inventory-finance inputs are unavailable in a local prototype snapshot, the UI
will label the unavailable measures rather than presenting fabricated values.

### 4. Keep interactions lightweight and route-compatible

The first interaction layer will use local selection state: period/product
controls, trend selection, product-to-order drill-down, and unpaid-order
navigation through the existing workspace route callback. It will not add a
charting dependency; the existing visual language and lightweight CSS/SVG
rendering are sufficient for the compact trend view.

CSV export will build the current report result, create a browser Blob, and
trigger a download with a deterministic filename. The exported rows and
totals will be generated from the same result object rendered by the screen.

## Risks / Trade-offs

- **[Risk]** Historical order costs may not yet have authoritative snapshots.
  **Mitigation:** use available recipe-derived local costs only where defined,
  label unavailable measures, and consume persisted inventory finance inputs
  when the owning inventory change provides them.
- **[Risk]** Proportional unpaid allocation can look surprising for mixed
  orders. **Mitigation:** show the allocation rule in the report detail and
  keep the full order balance visible in drill-down.
- **[Risk]** Workspace integration overlaps active changes touching
  `BakeryWorkspace.tsx`. **Mitigation:** keep Finance selector wiring isolated
  and serialize the shared-surface integration after the current owner
  releases it.
- **[Risk]** A trend view can imply accounting precision beyond the data.
  **Mitigation:** label measures by period and source and keep full accounting
  explicitly out of scope.

## Migration Plan

1. Add pure reporting models and focused unit tests for dates, products,
   mixed-order attribution, costs, unpaid balances, and CSV output.
2. Connect Finance to the active snapshot and remove runtime synthetic-data
   imports.
3. Add the summary cards, filters, product table, trend view, and unpaid-order
   drill-down.
4. Add browser download behavior and desktop/mobile journey coverage.
5. Verify against local fixtures and live-shaped empty states without changing
   inventory persistence or payment mutation boundaries.

Rollback is limited to restoring the prior Finance route and derived helper;
the change introduces no destructive schema migration.

## Open Questions

- Should the first release navigate unpaid rows to the Orders route or open a
  Finance-owned order detail drawer?
- Should custom ranges be inclusive of the user's local start and end dates?
