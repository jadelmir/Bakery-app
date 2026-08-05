# customer-directory-persistence Specification

## ADDED Requirements

### Requirement: Authenticated customer directory uses persisted bakery data

The application SHALL load customer profiles from the active bakery's
persisted backend records in authenticated mode and SHALL retain fixture data
only in explicitly configured mock mode.

#### Scenario: Loading the Customers tab

- **WHEN** an authenticated bakery member opens Customers
- **THEN** the directory displays only persisted customers for the active bakery

#### Scenario: Reloading the workspace

- **WHEN** the member reloads the page after a successful customer creation
- **THEN** the created customer remains visible in the directory

### Requirement: Customer creation is persisted and reflected immediately

The application SHALL save a valid customer through the backend and SHALL
apply the backend result to the shared domain snapshot.

#### Scenario: Creating a customer

- **WHEN** a member submits valid name, email, phone, type, address, and notes
- **THEN** the backend creates a bakery-scoped record and the returned customer
  appears in the directory without a full page reload

#### Scenario: Creation failure

- **WHEN** the backend rejects customer creation
- **THEN** the form remains available, an error is shown, and no success-only
  customer is added to the directory

### Requirement: Customer editing remains bakery-scoped and persisted

The application SHALL persist edits to an existing customer and SHALL reject
cross-bakery access through the existing authenticated tenant boundary.

#### Scenario: Editing a customer

- **WHEN** a member saves changed customer details
- **THEN** the persisted record and directory show the updated values

#### Scenario: Cross-bakery customer access

- **WHEN** a member attempts to read or mutate a customer from another bakery
- **THEN** the backend denies the operation and the UI does not display a false success
