# bakery-reporting Specification Delta

## ADDED Requirements

### Requirement: Finance distinguishes purchase spend from consumed product cost

The system SHALL expose inventory purchase cash spend, current inventory value,
and consumed product cost as separate financial measures. Gross profit SHALL
subtract consumed product cost from revenue and SHALL not subtract the same
purchase again.

#### Scenario: Receiving stock appears as purchase spend

- **WHEN** a bakery member receives a $120 flour purchase
- **THEN** Finance includes $120 in inventory purchase spend and increases the
  relevant inventory value

#### Scenario: Production usage appears as COGS

- **WHEN** production consumes ingredients with a recorded cost of $18
- **THEN** Finance includes $18 in consumed product cost and uses it in gross
  profit without adding another $18 purchase expense

### Requirement: Inventory financial measures are bakery-scoped and traceable

The system SHALL calculate inventory purchase spend and consumed product cost
from persisted inventory events for the selected bakery and period. Each amount
SHALL be traceable back to its inventory event source.

#### Scenario: Filtering inventory costs by period

- **WHEN** a member selects a financial date range
- **THEN** purchase spend, inventory value, and COGS include only events in the
  selected bakery and period, with source references available for drill-down
