## 1. Reporting foundation

- [x] 1.1 Define typed Finance filters and report result models for date,
  product, orders, product performance, trends, and unpaid balances.
- [x] 1.2 Replace runtime `ORDERS` usage with active snapshot-derived order,
  recipe, payment, and inventory-finance inputs.
- [x] 1.3 Implement today, week, month, and custom date-range filtering using
  canonical local dates and derive product options from active data.
- [x] 1.4 Implement line-item accurate mixed-order revenue, product cost,
  profit, units, margin, average order value, and proportional unpaid balance
  calculations.
- [x] 1.5 Add focused reporting tests for empty results, date boundaries,
  mixed-product orders, cost sources, and unpaid allocation.

## 2. Finance tab experience

- [x] 2.1 Wire `FinancesScreen` to the active bakery state and remove all
  hardcoded metrics, labels, product rows, and comparison values.
- [x] 2.2 Build the summary measures for revenue, cost, gross profit, margin,
  units, average order value, unpaid balances, and available inventory-finance
  measures.
- [x] 2.3 Add the period and product controls with clear selected-period
  context, loading, empty, and unavailable-measure states.
- [x] 2.4 Add product performance rows with units, revenue, cost, profit, and
  margin plus contributing-order inspection.
- [x] 2.5 Add a compact revenue/profit trend view and accessible labels for
  plotted values.
- [x] 2.6 Add unpaid-order drill-down navigation or detail presentation while
  preserving the selected report filters.

## 3. Export and verification

- [x] 3.1 Implement filtered CSV download from the rendered report result,
  including totals, product metrics, and contributing orders.
- [x] 3.2 Add component tests for filter interactions, metric updates,
  drill-down behavior, empty states, and export feedback.
- [x] 3.3 Add desktop and mobile Playwright coverage for the Finance journey,
  including filters, product performance, unpaid drill-down, and export.
- [x] 3.4 Run typecheck, lint, Vitest, build, and affected Playwright checks;
  Finance-focused checks pass. The repository-wide Vitest run remains blocked by
  7 unrelated failures across production timeline, orders sorting, and catalog
  workflow tests already present in the dirty worktree.
  record evidence before marking the change complete.
