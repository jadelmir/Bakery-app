## MODIFIED Requirements

### Requirement: Persisted manual orders remain visible from the authoritative snapshot

When the authenticated workspace uses the persisted manual-order service, the Orders screen SHALL render orders and generated tasks from the latest `ManualOrderSnapshot` returned by that service. The decision SHALL NOT depend on whether an unrelated domain snapshot collection such as `recipesById` is empty, present, or absent.

#### Scenario: A newly created order appears immediately

- **GIVEN** a member is using the Supabase-backed workspace and submits a valid manual order
- **WHEN** the persisted create operation succeeds and returns a refreshed manual-order snapshot
- **THEN** the Orders screen shows the new order and its generated production tasks without a page reload

#### Scenario: A persisted order appears after reload

- **GIVEN** a manual order was successfully persisted for the active bakery
- **WHEN** the member reloads the workspace and the persisted manual-order snapshot loads
- **THEN** the order remains visible with its persisted customer, items, status, payment fields, and generated tasks

#### Scenario: Local mode remains unchanged

- **GIVEN** the workspace is running in mock or local adapter mode without the persisted manual-order service
- **WHEN** a member creates an order
- **THEN** the existing local adapter projection remains available and this requirement does not force Supabase reads

