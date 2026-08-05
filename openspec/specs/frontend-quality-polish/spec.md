# frontend-quality-polish Specification

## Purpose

Ensures primary bakery workflows remain usable and understandable on desktop and mobile screens.
## Requirements
### Requirement: Responsive accessible workflow states
The system SHALL provide accessible labels and clear loading, empty, error, and completion feedback for primary workflows at desktop and mobile widths.

#### Scenario: Viewing an empty report
- **WHEN** no records match the selected report filters
- **THEN** the interface displays an accessible empty state with guidance to change the filters

### Requirement: Dynamic Date, Bakery, and User Header Rendering
The application header and home screen MUST render live localized calendar dates, active database bakery names, and current user profile details derived from the active domain snapshot and Supabase Auth session.

#### Scenario: User opens home screen on any day
- **Given** an authenticated user in an active bakery workspace
- **When** the home screen renders
- **Then** the header displays the current localized weekday and date
- **And** the bakery title reflects the active database bakery name
- **And** the active order count and production tasks reflect live database records.

### Requirement: Dynamic Customer and Starter Entity Name Binding
Customer payment alerts, unpaid balance lists, starter feeding warnings, and storefront links MUST bind directly to database entity records.

#### Scenario: User views unpaid balance alert
- **Given** active unpaid invoices or orders in the database snapshot
- **When** the user views the home screen or finances screen
- **Then** the alert displays the actual database customer names and exact unpaid balances
- **And** storefront links point to the active database storefront slug (`/store/:slug`).

### Requirement: Dynamic Navigation Badges in Submenus
Submenu navigation items in `MoreScreen` and sidebar MUST display real-time counters for low stock inventory items, customer counts, unpaid balance totals, and active starter names.

#### Scenario: User navigates to the More menu
- **Given** an active bakery workspace with domain inventory and invoices
- **When** the user views `MoreScreen`
- **Then** "Inventory" displays the exact count of low stock items requiring attention
- **And** "Customers" displays the active database customer count
- **And** "Finances" displays the exact total unpaid balance formatted in local currency
- **And** "Starter Manager" displays the actual database starter name and feeding schedule.

### Requirement: Clean Static Quality Gate

The frontend SHALL pass its configured TypeScript and ESLint quality gates
without disabling required rules or introducing broad untyped boundaries.

#### Scenario: Running the release static checks

- **GIVEN** the current frontend source and test suite
- **WHEN** the release quality commands run
- **THEN** `pnpm run typecheck` completes successfully
- **AND** `pnpm run lint` completes with zero warnings and zero errors

### Requirement: Calendar-Independent Browser Verification

The frontend browser suite SHALL verify the same user outcomes regardless of
the calendar date on which the suite runs.

#### Scenario: Running browser tests on a later calendar date

- **GIVEN** deterministic bakery records and a controlled test date
- **WHEN** the complete desktop and mobile Playwright suite runs
- **THEN** all 42 tests pass
- **AND** store-switching assertions use the rendered current date contract
  rather than a hard-coded month
- **AND** production scenarios contain actionable timer, delay, and prerequisite
  task records for the controlled date

### Requirement: Browser Regression Assertions Remain Behavioral

Corrective test changes SHALL retain assertions for the user-visible behavior
that each scenario is intended to prove.

#### Scenario: Correcting a stale browser test

- **GIVEN** a failing browser test caused by fixture or calendar drift
- **WHEN** the test is corrected
- **THEN** it still verifies the original store-switching or production-task
  outcome
- **AND** the test is not skipped, quarantined, or reduced to a generic
  page-presence assertion
