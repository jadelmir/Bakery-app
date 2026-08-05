# inventory-requirements-management Specification Delta

## ADDED Requirements

### Requirement: Prep-day requirements reserve inventory without consuming it

The system SHALL create or activate reservations for an order's ingredients
and retail supplies at the beginning of its prep day. Reservations SHALL reduce
available quantity but SHALL not reduce physical on-hand quantity.

#### Scenario: Reserving an upcoming order

- **GIVEN** an order requires 8,000 g of flour and the bakery has 75,000 g on
  hand
- **WHEN** the order enters its prep day
- **THEN** the system shows 75,000 g on hand, 8,000 g reserved, and 67,000 g
  available

### Requirement: Shortages include reserved demand

The system SHALL calculate shortage from required demand compared with
available quantity after reservations. The Inventory and Shopping List views
SHALL distinguish physical on-hand, reserved, available, and required values.

#### Scenario: Reserved demand creates a shortage

- **GIVEN** an item has 5,000 g on hand and 4,000 g already reserved
- **WHEN** another order requires 2,000 g
- **THEN** available quantity is 1,000 g and the second order shows a 1,000 g
  shortage

### Requirement: Packaging completion consumes inputs once and creates output

The system SHALL use the final enabled packaging checkpoint for an order item
as the production checkpoint. Completing that checkpoint SHALL create negative
production-usage events for required ingredients and retail supplies and a
positive production-output event for the resulting finished good.

#### Scenario: Completing an order's packaging checkpoint

- **GIVEN** a sourdough order requires flour, water, and one bag
- **WHEN** its final packaging task is completed
- **THEN** those raw and packaging quantities decrease, the finished-good
  quantity increases, and the order reservation is fulfilled

### Requirement: Finished goods distinguish allocated and available stock

The system SHALL mark made-to-order finished goods as allocated to their order
and SHALL leave made-ahead output available for future fulfillment. Available
finished-good quantity SHALL exclude allocated output.

#### Scenario: Made-to-order output is allocated

- **WHEN** a packaging checkpoint completes for a made-to-order sourdough loaf
- **THEN** the system records one finished-good output allocated to that order
  and does not present it as free stock

#### Scenario: Made-ahead output remains available

- **WHEN** a member records production output not tied to a customer order
- **THEN** the finished-good quantity is available for a later sale or pickup

### Requirement: Production inventory mutations are idempotent and allow shortages

The system SHALL use a unique source key per bakery, order item, and packaging
checkpoint so retries cannot duplicate usage or output. The system SHALL allow
on-hand quantities to become negative while surfacing a shortage warning.

#### Scenario: Repeated packaging completion does not double-count

- **WHEN** the same completed packaging task is submitted more than once
- **THEN** only one set of usage, output, and reservation-fulfillment events is
  recorded

#### Scenario: Production proceeds with insufficient stock

- **WHEN** a packaging checkpoint completes with insufficient available stock
- **THEN** the completion succeeds, the relevant balance may become negative,
  and the Inventory and Shopping List views show the shortage
