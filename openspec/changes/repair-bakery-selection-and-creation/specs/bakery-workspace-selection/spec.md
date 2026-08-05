# bakery-workspace-selection Delta Specification

## MODIFIED Requirements

### Requirement: New owners receive a default bakery

The system SHALL create one default bakery and an owner membership for an
authenticated user who completes onboarding without an existing bakery
membership, SHALL display every bakery accessible through the user’s current
memberships when the selector opens, and SHALL NOT create another bakery
automatically when an accessible membership already exists.

#### Scenario: First-time owner onboarding

- **WHEN** an authenticated user completes onboarding and has no bakery
  membership
- **THEN** the system creates a default bakery, assigns the user as its owner,
  and enters that bakery as the active workspace

#### Scenario: Existing member returns

- **WHEN** an authenticated user already belongs to at least one bakery
- **THEN** the selector displays those accessible bakery names and does not
  replace them with an empty onboarding form

### Requirement: Users can create and enter an additional bakery

The application SHALL allow an authenticated user to explicitly create an
additional bakery workspace, SHALL create its owner membership atomically,
SHALL retain all previously accessible memberships, and SHALL enter the newly
created bakery as the active workspace after the operation succeeds.

#### Scenario: User creates an additional bakery when an existing bakery is visible

- **GIVEN** an authenticated user has at least one accessible bakery shown in
  the workspace selector
- **WHEN** the user submits the additional bakery form with a valid name
- **THEN** a new bakery and owner membership are created for that user
- **AND** the previously accessible bakery remains in the selector list
- **AND** the new bakery appears in the selector list and becomes the active
  bakery for workspace entry

#### Scenario: Creation fails

- **WHEN** the explicit bakery creation operation fails
- **THEN** the selector remains visible, existing memberships remain intact,
  and an accessible error is presented without entering a new workspace
