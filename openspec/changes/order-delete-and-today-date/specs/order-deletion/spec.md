## ADDED Requirements

### Requirement: A bakery member can request order deletion from order detail

For F6 Orders and Payments, an authenticated member of the active bakery SHALL be able to start deleting an order from its opened order-detail view. The action SHALL be available for the order statuses currently exposed by the Orders workflow and SHALL identify the destructive nature of the operation.

#### Scenario: Delete action is available after opening an order

- **GIVEN** a bakery member opens an order from the Orders queue
- **WHEN** the order detail renders
- **THEN** the detail shows a clearly named `Delete order` action

#### Scenario: Delete action is not available without an order

- **WHEN** no order is selected
- **THEN** no delete action is rendered and no order mutation is started

### Requirement: Order deletion requires explicit confirmation

The application SHALL require an explicit confirmation before deleting an order. The confirmation SHALL identify the selected order, provide a cancel action, and support keyboard and assistive-technology navigation.

#### Scenario: Member cancels deletion

- **GIVEN** the member opens the delete confirmation for an order
- **WHEN** the member selects Cancel or dismisses the confirmation
- **THEN** the order remains visible and no delete request is sent

#### Scenario: Member confirms deletion

- **GIVEN** the member opens the delete confirmation for an order
- **WHEN** the member selects Delete order
- **THEN** the delete request starts and the confirmation prevents duplicate submissions while it is pending

### Requirement: Successful deletion removes the order and generated work

The delete operation SHALL be scoped to the active bakery and order identifier. On success, the authoritative order projection SHALL no longer contain the order, its order items, or its generated production tasks, and the Orders UI SHALL close the detail and remove the order from all applicable queue counts and lists.

#### Scenario: Local order deletion succeeds

- **GIVEN** a local workspace contains a selected order with generated tasks
- **WHEN** the member confirms deletion
- **THEN** the order and its generated tasks are removed from the local authoritative state
- **AND** the detail closes and the order is absent from the queue

#### Scenario: Persisted order deletion succeeds

- **GIVEN** an authenticated member has a persisted order in the active bakery
- **WHEN** the member confirms deletion
- **THEN** the persisted order is deleted only when its bakery and identifier match the active scope
- **AND** dependent order items and generated production tasks are removed through the database relationship contract
- **AND** a refreshed persisted snapshot no longer contains the order or its generated tasks

#### Scenario: Deleted order stays absent after reload

- **GIVEN** a persisted order was deleted successfully
- **WHEN** the member reloads the Orders workspace
- **THEN** the deleted order remains absent from the authoritative snapshot and all order views

### Requirement: Failed deletion preserves visible state and explains recovery

When deletion fails, the application SHALL retain the selected order and its current task/payment/lifecycle display, prevent a false success state, and show an actionable retryable error.

#### Scenario: Delete request fails

- **GIVEN** the delete request returns an error or no matching bakery-scoped row
- **WHEN** the failure is handled
- **THEN** the order remains visible in the detail and queue
- **AND** the interface communicates that deletion failed and allows the member to retry

#### Scenario: Cross-bakery deletion is rejected

- **GIVEN** a member attempts to delete an order outside the active bakery
- **WHEN** the delete operation is evaluated
- **THEN** the operation is denied
- **AND** no order, item, or production-task record is changed

