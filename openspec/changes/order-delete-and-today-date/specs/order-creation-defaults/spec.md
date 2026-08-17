## ADDED Requirements

### Requirement: New orders default to today's local calendar date

When a baker opens the new-order form, the pickup date SHALL initialize to the current local calendar date in `YYYY-MM-DD` form. The default SHALL be calculated when the form instance opens rather than stored as a fixed constant.

#### Scenario: New order opens today

- **GIVEN** the local calendar date is 2026-08-17
- **WHEN** the baker opens New Order
- **THEN** the Pickup Date field contains `2026-08-17`

#### Scenario: New order opened on a later day uses the later day

- **GIVEN** the local calendar date advances to a different day
- **WHEN** the baker opens a new order form again
- **THEN** the Pickup Date field contains that new local calendar date

### Requirement: The selected pickup date is the date persisted and scheduled

The order creation flow SHALL pass the final Pickup Date field value to the local or persisted create operation and to generated production-task scheduling. A baker's intentional date change SHALL be preserved.

#### Scenario: Baker keeps today's default

- **GIVEN** the new-order form is opened and the baker does not change Pickup Date
- **WHEN** the order is created
- **THEN** the saved order and generated tasks use today's local calendar date

#### Scenario: Baker changes the pickup date

- **GIVEN** the new-order form is opened with today's date
- **WHEN** the baker selects a different valid pickup date and creates the order
- **THEN** the saved order and generated tasks use the selected date instead of overwriting it with today

### Requirement: Date defaulting is stable across timezone boundaries

The date-default helper SHALL use local calendar parts and SHALL not convert the current instant to a UTC date before formatting.

#### Scenario: Local date is west of UTC near midnight

- **GIVEN** the local clock is just before midnight in a timezone west of UTC
- **WHEN** the baker opens New Order
- **THEN** the Pickup Date field matches the local calendar date shown by the device

#### Scenario: Local date is east of UTC near midnight

- **GIVEN** the local clock is just after midnight in a timezone east of UTC
- **WHEN** the baker opens New Order
- **THEN** the Pickup Date field matches the new local calendar date shown by the device

