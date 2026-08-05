## MODIFIED Requirements

### Requirement: New owners receive a default bakery

The system SHALL create one default bakery and owner membership for an
authenticated user who has no bakery membership, SHALL make the default
onboarding operation idempotent for users with an existing membership, SHALL
display every bakery accessible through current memberships, and SHALL NOT
create another bakery automatically when an accessible membership already
exists.

#### Scenario: First-time owner onboarding

- **WHEN** an authenticated user completes onboarding and has no bakery
  membership
- **THEN** the system creates one default bakery, assigns the user as its
  owner, and enters that bakery as the active workspace

#### Scenario: Existing member retries onboarding

- **WHEN** an authenticated user already belongs to at least one bakery and
  the default onboarding operation is called again
- **THEN** the operation returns an accessible existing bakery, creates no new
  bakery or membership, and the selector displays the accessible bakery names

#### Scenario: Existing member returns

- **WHEN** an authenticated user already belongs to at least one bakery
- **THEN** the selector displays those accessible bakery names and does not
  replace them with an empty onboarding form

### Requirement: Multi-Bakery Workspace Creation

The application SHALL allow authenticated users to explicitly create an
additional bakery workspace through a distinct creation operation, SHALL create
its owner membership atomically, SHALL retain all previously accessible
memberships, and SHALL enter the newly created bakery as the active workspace
after the operation succeeds.

#### Scenario: User creates an additional bakery workspace when existing stores exist

- **GIVEN** an authenticated user who has access to one or more existing bakery
  stores
- **WHEN** the user submits the explicit “Add a new bakery” form with a valid
  store name
- **THEN** the additional-bakery operation creates one new bakery workspace
  and owner membership atomically
- **AND** the previously accessible bakery remains in the selector list
- **AND** the new bakery appears in the selector list and becomes active

#### Scenario: Default onboarding is retried instead of creating an additional bakery

- **WHEN** the default onboarding operation is called while an accessible
  bakery already exists
- **THEN** it returns the existing bakery and does not create an additional
  workspace

#### Scenario: Creation fails

- **WHEN** the explicit additional-bakery operation fails
- **THEN** the selector remains visible, existing memberships remain intact,
  and an accessible error is presented without entering a new workspace
