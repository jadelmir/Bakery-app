## MODIFIED Requirements

### Requirement: Custom Production Flow Building & Task Dependency Resolution

The application SHALL allow users to create, modify, reorder, and save custom
multi-step production flows for recipe products. The saved flow SHALL be
persisted in the bakery workspace domain snapshot, and an authenticated hosted
workspace SHALL back that snapshot with bakery-scoped Supabase flow storage.

#### Scenario: User creates and saves a custom multi-step production flow for a recipe

- **GIVEN** a recipe manager or production administrator
- **WHEN** the user opens the Production Flow Builder for a recipe, adds custom steps with day offsets and target times, and saves the flow
- **THEN** the custom production flow SHALL be persisted in the bakery workspace domain snapshot
- **AND** when the hosted adapter is active, the flow and its ordered steps SHALL be durably persisted for the active bakery
- **AND** subsequent orders for that recipe SHALL generate tasks adhering to the custom step flow

#### Scenario: Task dependency resolution

- **GIVEN** a generated production task that depends on a prerequisite flow step
- **WHEN** the prerequisite task is still pending or incomplete
- **THEN** the downstream task SHALL display a dependency warning indicator in the production workspace

## ADDED Requirements

### Requirement: Bakery-scoped persisted flow storage

The system SHALL persist each production flow and its ordered steps under the
active bakery, preserving the existing string flow and step identifiers and all
current scheduling, instruction, enablement, groupability, and dependency
fields. Reads and writes SHALL be authorized by active bakery membership using
database-enforced row-level security.

#### Scenario: Saving a flow in an authenticated hosted workspace

- **GIVEN** an authenticated user is an active member of bakery A
- **WHEN** the user saves a new or edited flow from the Flow Builder
- **THEN** the database SHALL store the flow and its complete ordered step set for bakery A
- **AND** the domain snapshot SHALL expose the authoritative saved flow after the mutation succeeds

#### Scenario: Reloading a persisted flow

- **GIVEN** a flow was saved successfully for bakery A
- **WHEN** an authorized member reloads or reopens bakery A
- **THEN** the flow cards and full builder SHALL show the saved name, recipe, step order, timing, instructions, dependencies, and enabled state

#### Scenario: Persisting imported flow data

- **GIVEN** the user imports an existing flow or valid organized JSON into a new draft
- **WHEN** the user saves the populated draft
- **THEN** the imported data SHALL be stored and reloaded as a normal editable production flow
- **AND** the import path SHALL not create a separate orphans-only JSON record

#### Scenario: Atomic flow replacement

- **GIVEN** a saved flow has existing steps
- **WHEN** the user saves a changed step list
- **THEN** the flow row and replacement step set SHALL commit as one mutation
- **AND** a failed mutation SHALL not leave a partial step list visible as a successful save

#### Scenario: Bakery isolation

- **GIVEN** a user is a member of bakery A but not bakery B
- **WHEN** the user loads, saves, or deletes a production flow while scoped to bakery B
- **THEN** the database SHALL deny the unauthorized operation
- **AND** flows saved for bakery A SHALL not appear in bakery B's snapshot

#### Scenario: Local adapter compatibility

- **GIVEN** the application is running in local/demo mode without the hosted adapter
- **WHEN** the user saves or edits a production flow
- **THEN** the existing local adapter SHALL continue to update the local bakery snapshot with the same domain result shape
