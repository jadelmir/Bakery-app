# frontend-quality-polish Delta Specification

## ADDED Requirements

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

