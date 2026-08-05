# bakery-reporting Specification

## Purpose

Lets bakers review performance and export selected operational results from the local prototype.

## Requirements

### Requirement: Filtered sales and profit reporting
The system SHALL show revenue, costs, gross profit, unpaid balances, units sold, and average selling price filtered by date range and product.

#### Scenario: Filtering a report
- **WHEN** a baker selects a date range or product
- **THEN** all report metrics reflect only matching orders

### Requirement: Exportable report results
The system SHALL allow a baker to export the currently filtered reporting results in a portable tabular format.

#### Scenario: Exporting a report
- **WHEN** a baker chooses export from a filtered report
- **THEN** the exported data contains the same filtered results shown in the report
