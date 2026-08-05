# production-task-generation Delta Specification

## ADDED Requirements

### Requirement: Database Task Generation and Idempotent Rescheduling
The database engine MUST automatically generate and update production schedule tasks in `production_tasks` when an order is created or rescheduled without overwriting completed tasks or creating duplicate entries.

#### Scenario: Idempotent task regeneration for an updated order date
- **GIVEN** an existing customer order with generated production tasks
- **WHEN** the order fulfillment date is changed
- **THEN** pending task scheduled dates are updated in `production_tasks` while completed step records remain intact
