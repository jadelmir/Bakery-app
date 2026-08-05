# frontend-performance-optimization Specification

## Purpose

Keep the application responsive and its initial delivery bounded as features
grow, while preserving tenant isolation and production timer accuracy.

## Requirements

### Requirement: Bounded Initial JavaScript Delivery

The application SHALL keep the production entry JavaScript asset at or below
500 KB minified and 150 KB gzip, measured from the Vite manifest.

#### Scenario: Building the optimized application

- **GIVEN** the complete production application
- **WHEN** the production build and bundle-budget check run
- **THEN** the entry asset satisfies both configured size budgets
- **AND** the measured raw and gzip sizes are printed as verification evidence

### Requirement: Navigation-Based Feature Loading

The application SHALL load non-shell feature screens and public invoice and
storefront views through asynchronous navigation boundaries.

#### Scenario: Opening an unloaded feature screen

- **GIVEN** an authenticated user in the lightweight workspace shell
- **WHEN** the user navigates to a feature screen that has not loaded
- **THEN** the app presents accessible loading feedback
- **AND** the requested screen becomes usable without reloading the page
- **AND** existing navigation and dirty-form protection behavior remains intact

### Requirement: Isolated Domain Selection

Domain-state consumers SHALL be able to observe a selected value without being
notified when an unrelated update leaves that selected value unchanged.

#### Scenario: Updating an unrelated domain slice

- **GIVEN** a consumer subscribed to a stable selected slice
- **WHEN** another domain slice changes
- **THEN** the selected consumer retains the same value
- **AND** bakery-switch isolation still prevents prior-bakery data exposure

### Requirement: Shared Production Timer Clock

The production workspace SHALL use one shared ticking source for all active task
timers and derive elapsed time from persisted timestamps.

#### Scenario: Displaying multiple active timers

- **GIVEN** multiple production tasks with running timers
- **WHEN** elapsed time updates
- **THEN** one shared clock update refreshes the displayed elapsed values
- **AND** pause, resume, completion, and accumulated duration remain accurate

### Requirement: Performance Regression Gate

The repository SHALL include repeatable automated checks for bundle size and
optimized user journeys.

#### Scenario: Verifying an optimization change

- **WHEN** the complete frontend verification suite runs
- **THEN** typecheck, lint, unit tests, build, bundle budget, and the complete
  desktop/mobile browser suite pass (44 tests at synchronization time)
- **AND** no browser test is skipped or weakened to satisfy the optimization
