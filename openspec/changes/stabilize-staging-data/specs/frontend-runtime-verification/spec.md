# Delta: Frontend Runtime Verification

## ADDED Requirements

### Requirement: Supabase-backed runtime does not present synthetic persisted entities

When the application is running in its real Supabase-backed mode, customer, order, and other persisted bakery records MUST come from the active bakery's persisted data source rather than prototype fixtures.

#### Scenario: Empty bakery customer directory

- **WHEN** the active bakery has no persisted customers
- **THEN** the Customers UI shows its empty state
- **AND** no hard-coded prototype customers are displayed.

#### Scenario: Empty bakery order list

- **WHEN** the active bakery has no persisted orders
- **THEN** the Orders UI shows its empty state
- **AND** no hard-coded prototype orders are displayed.

#### Scenario: persisted records exist

- **WHEN** the active bakery has persisted customers or orders
- **THEN** the UI renders those authoritative records
- **AND** reload does not replace them with synthetic fixture data.

### Requirement: synthetic fixtures are explicit

Synthetic persisted-entity fixtures MAY be used by automated tests or an explicitly enabled mock-development mode, but MUST NOT be a silent fallback for a real Supabase-backed deployment.

#### Scenario: explicit mock test mode

- **WHEN** a test intentionally enables mock backend behavior
- **THEN** deterministic synthetic fixtures may be loaded for that test environment.

#### Scenario: real backend unavailable

- **WHEN** the application expects Supabase-backed runtime data and a required service cannot load it
- **THEN** the UI exposes an appropriate loading, empty, or error state
- **AND** it does not substitute prototype customer/order records.
