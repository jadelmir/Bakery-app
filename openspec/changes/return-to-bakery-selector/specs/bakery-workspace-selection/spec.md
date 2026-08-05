# bakery-workspace-selection Specification

## ADDED Requirements

### Requirement: Users can return to bakery selection without signing out

The application SHALL provide an accessible action from the active bakery
navigation identity that confirms the user's intent and returns the signed-in
user to the bakery selection screen without changing authentication state.

#### Scenario: Opening the return-to-selector confirmation

- **WHEN** an authenticated user activates the bakery identity in the workspace
  navigation header
- **THEN** the application shows a confirmation dialog asking whether to return
  to bakery selection

#### Scenario: Cancelling the return

- **WHEN** the user cancels the confirmation dialog
- **THEN** the dialog closes and the current bakery workspace remains active

#### Scenario: Confirming the return

- **WHEN** the user confirms that they want to return to bakery selection
- **THEN** the application clears the remembered active bakery, clears the
  active membership, and displays the existing bakery selector without signing
  the user out

#### Scenario: Reloading after returning to selection

- **WHEN** the signed-in user reloads after confirming the return
- **THEN** the bakery selector remains visible until the user explicitly selects
  an accessible bakery

#### Scenario: Dirty workspace blocks the return

- **WHEN** the user confirms the return while a registered workspace form has
  unsaved changes
- **THEN** the existing unsaved-changes guard controls whether the return
  proceeds and the bakery remains active if the user chooses to stay
