## ADDED Requirements

### Requirement: Manual orders use the active bakery's persisted catalog

The authenticated manual-order workflow SHALL load customers and recipes from
the active bakery's persisted domain snapshot and SHALL submit their stable
database identifiers without substituting fixture IDs or names.

#### Scenario: Selecting persisted catalog records

- **GIVEN** an authenticated member has selected a bakery
- **WHEN** the member opens the Add Order workflow
- **THEN** the customer and recipe options belong to that bakery and carry
  their persisted identifiers into submission

#### Scenario: Rejecting a cross-bakery catalog reference

- **WHEN** a manual-order request references a customer or recipe owned by a
  bakery in which the authenticated user has no current membership
- **THEN** the request is rejected and no order, item, or task is created

### Requirement: Manual order creation is atomic and persisted

The system SHALL create an authenticated manual order, its order items, and
its production tasks in one bakery-scoped transaction. The persisted order
SHALL store integer-cent totals, amount paid, derived payment status, pickup
details, notes, and `in-person` source metadata.

#### Scenario: Creating a manual order

- **GIVEN** a member submits an existing customer, one or more valid recipes,
  quantities, a pickup date/time, and an optional deposit
- **WHEN** the creation request succeeds
- **THEN** exactly one confirmed order and its items are stored for the active
  bakery, the server-calculated total is stored in cents, and production tasks
  are generated for that order

#### Scenario: Rolling back an invalid manual order

- **WHEN** any customer, recipe, quantity, membership, or task-generation
  validation fails during creation
- **THEN** the transaction leaves no partial order, item, or task records

### Requirement: Manual order creation is safely retryable

The system SHALL use a caller-generated stable order identifier for retries and
SHALL return the existing authoritative result when a successful request is
replayed with that identifier.

#### Scenario: Retrying a successful creation

- **WHEN** the same manual-order request is submitted again with the same order
  identifier
- **THEN** the system returns the existing order result without duplicating
  order items or production tasks

### Requirement: The manual-order UI reflects persistence outcomes

The Add Order workflow SHALL distinguish pending, successful, and failed
creation states. It SHALL not describe a successfully persisted order as local
prototype data or close the workflow before the authoritative save succeeds.

#### Scenario: Confirming a persisted order

- **WHEN** the member confirms a valid manual order
- **THEN** the UI shows a pending state, closes only after success, and the new
  order appears in the Orders screen from the shared persisted snapshot

#### Scenario: Handling a creation failure

- **WHEN** the persistence request fails
- **THEN** the UI keeps the entered draft available, shows an actionable error,
  and does not claim that the order or plan was saved

### Requirement: Persisted manual orders retain their production plan

The system SHALL retain generated production tasks under the new order's
identifier so the order detail view and production workspace can retrieve the
same plan after reload.

#### Scenario: Reloading a newly created order

- **WHEN** a member reloads the workspace and opens a previously created manual
  order
- **THEN** the order, its items, and its generated production tasks are shown
  from persisted records without relying on browser-local state

### Requirement: Production plans aggregate repeated recipes

The system SHALL create one recipe-level production plan per recipe within an
order. The plan's task quantity SHALL equal the sum of matching order-item
quantities so recipe and ingredient requirements scale with the batch size.

#### Scenario: Five repeated loaves use one scaled plan

- **GIVEN** an order contains two Sourdough Loaf lines with quantities 2 and 3
- **WHEN** production tasks are generated
- **THEN** one Sourdough recipe plan is retained with its three workflow steps,
  each showing quantity 5, and recipe requirements are calculated for five
  loaves rather than two separate plans
