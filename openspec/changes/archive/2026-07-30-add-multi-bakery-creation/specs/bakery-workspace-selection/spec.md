# Specification: Bakery Workspace Selection & Multi-Bakery Creation

## ADDED Requirements

### Requirement: Multi-Bakery Workspace Creation
The application SHALL allow authenticated users to create additional bakery workspaces from both the workspace selection landing screen and within the workspace layout.

#### Scenario: User creates an additional bakery workspace when existing stores exist
- **GIVEN** an authenticated user who has access to one or more existing bakery stores
- **WHEN** the user views the workspace selection screen and submits the "+ Add a new bakery" form with a valid store name
- **THEN** a new bakery workspace record and owner membership SHALL be created atomically
- **AND** the new bakery SHALL appear in the user's available stores list and be selected as the active workspace

#### Scenario: User creates a new bakery workspace from the mock adapter
- **GIVEN** the mock workspace adapter with existing initial memberships
- **WHEN** `createDefaultBakery(name)` is invoked
- **THEN** the new bakery membership SHALL be appended to the active memberships list without overwriting existing memberships
