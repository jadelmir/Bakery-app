## ADDED Requirements

### Requirement: Staff can settle an order's outstanding balance

For F6 Orders and Payments, the application SHALL allow an authorized member
of the active bakery to mark a manual order's entire remaining balance as paid
from the order detail payment summary. The mutation SHALL persist the order's
full total as the amount paid and derive payment status as `paid` without
changing the order lifecycle status.

#### Scenario: Marking a balance as paid

- **GIVEN** an order has an unpaid or partially paid balance
- **WHEN** an authorized bakery member selects `Mark as Paid`
- **THEN** the application persists the order's full total as paid
- **AND** the payment summary changes to `Paid in full`
- **AND** the order lifecycle status remains unchanged

#### Scenario: Reviewing an already-paid order

- **GIVEN** an order's paid amount equals its total
- **WHEN** the order detail renders
- **THEN** the payment summary shows `Paid in full`
- **AND** no `Mark as Paid` action is available

### Requirement: Order payment mutation is safe and bakery scoped

The full-balance payment mutation SHALL be atomic, SHALL authorize against the
active bakery, SHALL return authoritative persisted payment fields, and SHALL
be safe when repeated for an order that is already fully paid.

#### Scenario: Refreshing from the saved result

- **WHEN** a full-balance payment mutation succeeds
- **THEN** the visible order and payment filters use the authoritative saved
  amount and payment status

#### Scenario: Rejecting a cross-bakery payment change

- **WHEN** a member attempts to mark an order outside an authorized bakery as
  paid
- **THEN** the mutation is denied
- **AND** no order payment fields are changed

#### Scenario: Repeating a completed payment mutation

- **GIVEN** an order is already fully paid
- **WHEN** the full-balance mutation is repeated
- **THEN** the operation returns the same paid state without increasing the
  paid amount beyond the order total

### Requirement: Payment action communicates mutation state

The order detail SHALL prevent duplicate submissions while payment persistence
is pending and SHALL retain the prior payment state with actionable feedback
when the mutation fails.

#### Scenario: Payment save is pending

- **WHEN** a bakery member starts the `Mark as Paid` action
- **THEN** the action is disabled and communicates that the update is in
  progress

#### Scenario: Payment save fails

- **WHEN** payment persistence fails
- **THEN** the prior balance remains visible
- **AND** the detail shows a retryable error without claiming the order is paid
