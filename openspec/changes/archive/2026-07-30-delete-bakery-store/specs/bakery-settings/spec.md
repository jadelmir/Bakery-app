# Specification: Bakery Store Deletion in Settings

## ADDED Requirements

### Requirement: Delete Bakery Store
The application SHALL allow bakery owners to permanently delete an active bakery store workspace from the Settings screen.

#### Scenario: Bakery owner deletes an active bakery store with name confirmation
- **GIVEN** an authenticated user logged in as an `owner` of an active bakery workspace
- **WHEN** the user navigates to Settings, opens the Delete Bakery dialog, enters the exact bakery store name, and confirms deletion
- **THEN** the workspace adapter SHALL delete the bakery store and associated memberships
- **AND** the application SHALL clear active session memory for that bakery and redirect the user to their remaining stores or workspace selector screen

#### Scenario: Non-owner user attempts to delete a bakery store
- **GIVEN** an authenticated user logged in with a `manager` or `staff` role
- **WHEN** the user views the Settings screen
- **THEN** the store deletion control SHALL be hidden or disabled with an ownership requirement message
