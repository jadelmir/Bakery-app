# order-status-transitions Specification

## ADDED Requirements

### Requirement: Bakery members can advance orders through the manual lifecycle

The system SHALL allow an authenticated bakery member to manually advance an
order only through the following sequential transitions:

`confirmed -> in-production -> ready -> completed`.

#### Scenario: Starting production for a confirmed order

- **GIVEN** a member has an active bakery and an order in `confirmed` status
- **WHEN** the member selects `Start Production`
- **THEN** the order changes to `in-production` for that bakery

#### Scenario: Marking an in-production order ready

- **GIVEN** an order is in `in-production` status
- **WHEN** the member selects `Mark Ready`
- **THEN** the order changes to `ready` and remains associated with the same
  customer, items, pickup details, and production plan

#### Scenario: Completing a ready order

- **GIVEN** an order is in `ready` status
- **WHEN** the member selects `Mark Completed`
- **THEN** the order changes to `completed` and no further lifecycle action is
  offered

### Requirement: Order transitions reject invalid or unauthorized changes

The system SHALL reject a status mutation when the requested transition is
not the next sequential lifecycle step, when the order is outside the active
bakery, or when the caller lacks membership in that bakery.

#### Scenario: Preventing a skipped transition

- **GIVEN** an order is `confirmed`
- **WHEN** a request attempts to change it directly to `ready` or `completed`
- **THEN** the request is rejected and the order remains `confirmed`

#### Scenario: Preventing a repeated or backward transition

- **GIVEN** an order is `ready` or `completed`
- **WHEN** a request attempts to move it to an earlier status or repeat a
  completed transition
- **THEN** the request is rejected and the existing status remains unchanged

#### Scenario: Denying a cross-bakery transition

- **WHEN** a member submits a transition for an order belonging to a bakery in
  which the member has no current membership
- **THEN** the request is rejected without changing the order

### Requirement: The Orders detail view exposes the next valid action

The Orders detail view SHALL show only the next valid manual action for the
selected order, await the authoritative result, and preserve the previous
state when the mutation fails.

#### Scenario: Showing status-specific actions

- **WHEN** the selected order is `confirmed`, `in-production`, or `ready`
- **THEN** the view shows respectively `Start Production`, `Mark Ready`, or
  `Mark Completed`

#### Scenario: Handling transition failure

- **WHEN** a status transition fails
- **THEN** the view keeps the prior status, shows an actionable error, and
  allows the member to retry without duplicating the mutation

#### Scenario: Reloading a transitioned order

- **WHEN** a member reloads the active bakery after a successful persisted
  transition
- **THEN** the Orders view displays the stored new status and does not show an
  action that is no longer valid

