# bakery-reporting Specification Delta

## ADDED Requirements

### Requirement: Finance uses active bakery data

The system SHALL derive Finance results from the active bakery's shared domain
state and SHALL NOT display synthetic or hardcoded order, product, cost,
payment, comparison, or best-seller values in the runtime dashboard.

#### Scenario: Viewing an empty bakery report

- **WHEN** a member opens Finance for an active bakery with no matching sales
- **THEN** the dashboard shows zero or empty-state values for that bakery and
  does not show records from another bakery or sample data

### Requirement: Finance filters apply consistently

The system SHALL support today, this week, this month, and custom date ranges,
plus a product filter derived from active bakery data. Every visible metric,
product result, unpaid balance, trend point, and export SHALL use the selected
filters.

#### Scenario: Filtering a mixed-product order

- **GIVEN** an order contains both sourdough and focaccia lines
- **WHEN** a member filters Finance to sourdough
- **THEN** revenue, units, product cost, profit, unpaid allocation, product
  results, and exported rows include only the sourdough line's attributable
  values

### Requirement: Finance presents useful performance measures

The system SHALL show revenue, product cost, gross profit, gross margin, units
sold, average order value, and unpaid balances for the selected report. When
inventory finance inputs are available, it SHALL also show purchase spend,
current inventory value, and consumed product cost as distinct measures.

#### Scenario: Reviewing a populated report

- **WHEN** a member selects a period containing completed sales
- **THEN** Finance shows the selected period's measures and product-level
  performance including units, revenue, cost, profit, and margin

### Requirement: Finance supports interactive investigation

The system SHALL provide a trend view for revenue and profit, allow a member
to inspect contributing orders from a product result, and allow a member to
open an unpaid order from the unpaid-balance section.

#### Scenario: Opening an unpaid order

- **WHEN** a member selects an unpaid balance in Finance
- **THEN** the related order details or order workflow opens with the balance
  still attributable to the selected report

### Requirement: Finance export matches the visible report

The system SHALL download a CSV containing the currently filtered orders,
product metrics, and financial totals shown in the Finance dashboard.

#### Scenario: Exporting filtered results

- **WHEN** a member applies a date or product filter and chooses export
- **THEN** the downloaded CSV contains only the filtered results and its totals
  reconcile with the values displayed in Finance
