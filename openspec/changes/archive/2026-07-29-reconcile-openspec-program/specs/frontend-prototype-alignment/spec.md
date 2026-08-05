## MODIFIED Requirements

### Requirement: Prototype scope transparency
The frontend SHALL communicate the current persistence boundary accurately: Supabase-backed authentication and bakery-workspace capabilities SHALL NOT be described as mock-only, while bakery-domain records, generated production plans, calculations, deductions, and optimization that remain local SHALL NOT be represented as persisted or backend-complete.

#### Scenario: Confirming an example order
- **WHEN** a user completes the add-order flow for a supported product
- **THEN** the confirmation identifies the order and production plan as local prototype data unless repository evidence shows that capability has been migrated to persistence

#### Scenario: Entering a bakery workspace
- **WHEN** a user authenticates and selects an accessible bakery in the normal configured runtime
- **THEN** the interface does not describe that authenticated session or workspace membership as a mock session
