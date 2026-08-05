## ADDED Requirements

### Requirement: Newly created orders retain generated-plan association
The system SHALL retain the generated-plan association for a newly created order so order details can retrieve its tasks by that order identifier.

#### Scenario: Opening a newly created order
- **WHEN** a baker opens an order after completing its creation workflow
- **THEN** the order details show the tasks generated for that order
