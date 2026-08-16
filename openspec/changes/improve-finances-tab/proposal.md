## Why

The Finance tab currently presents a prototype view rather than a trustworthy
picture of the active bakery. It reads synthetic order constants, contains
hardcoded costs and comparison labels, and offers filters that do not fully
change the displayed results. The bakery already has shared domain state and
reporting foundations, so the tab can now become a useful decision-support
surface.

## What Changes

- Connect the Finance tab to the active bakery's shared domain snapshot instead
  of runtime synthetic constants.
- Replace hardcoded date labels, costs, margins, order counts, and best-seller
  rows with derived values.
- Add working today, this week, this month, custom-range, and product filters
  whose results remain accurate for mixed-product orders.
- Show revenue, product cost, gross profit, margin, units sold, average order
  value, unpaid balances, and available inventory-finance measures.
- Add product performance details, a compact revenue/profit trend, and
  drill-down access to contributing orders and unpaid balances.
- Make filtered CSV export download the same report currently shown.
- Preserve inventory persistence and ledger ownership in the active
  `inventory-management` change; this change consumes those inputs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bakery-reporting`: make the Finance tab live, filterable, informative,
  interactive, and exportable.

## Impact

- `Front-end/src/app/screens/FinancesScreen.tsx`, reporting selectors, and the
  Finance route integration in `BakeryWorkspace.tsx`.
- Shared order, recipe, inventory-finance, and payment data already exposed by
  the active bakery domain snapshot.
- Focused unit, component, and Playwright coverage for filters, totals,
  product performance, drill-downs, and export behavior.
- Product phase F11, depending on existing order, recipe, workspace, and
  inventory contracts. The active `inventory-management` change remains the
  owner of persisted inventory events and their financial cost inputs.

This change does not introduce a full accounting ledger, tax reporting, bank
reconciliation, supplier management, or new inventory persistence.
