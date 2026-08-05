# bakery-workspace-selection Specification

## Purpose
Lets authenticated users enter, create, select, and switch among bakery workspaces while maintaining one explicit frontend active-bakery boundary for local prototype screens and future persisted business operations.
## Requirements
### Requirement: New owners receive a default bakery
The system SHALL create one default bakery and an owner membership for an authenticated user who completes onboarding without an existing bakery membership, SHALL display every bakery accessible through the user’s current memberships when the selector opens, and SHALL NOT create another bakery automatically when an accessible membership already exists.

#### Scenario: First-time owner onboarding
- **WHEN** an authenticated user completes onboarding and has no bakery membership
- **THEN** the system creates a default bakery, assigns the user as its owner, and enters that bakery as the active workspace

#### Scenario: Existing member returns
- **WHEN** an authenticated user already belongs to at least one bakery
- **THEN** the selector displays those accessible bakery names and does not replace them with an empty onboarding form

### Requirement: Bakery selection gates business data
The system SHALL require an authenticated user to establish an active bakery before rendering local or persisted bakery business data. Selection SHALL remain presentation state and SHALL NOT replace database authorization.

#### Scenario: Login succeeds
- **WHEN** a user establishes an authenticated session
- **THEN** the bakery selector is displayed before orders, production, inventory, reporting, or other bakery data is rendered

#### Scenario: Default bakery is available
- **WHEN** the bakery selector opens and the user has a valid default bakery membership
- **THEN** that bakery is preselected while the user remains able to choose another bakery before entering the workspace

#### Scenario: No accessible bakery exists
- **WHEN** an authenticated user has no bakery membership and no eligible invitation
- **THEN** the selector presents an onboarding state for creating the user's default bakery without exposing bakery business data

### Requirement: Users can select and switch bakeries
The system SHALL list only bakeries accessible through the current user's memberships and SHALL let the user change the active bakery without signing out.

#### Scenario: Selecting a bakery
- **WHEN** a user confirms a bakery from the selector
- **THEN** the system establishes that bakery as active and renders only its business context

#### Scenario: Switching bakeries
- **WHEN** a user selects another accessible bakery from the authenticated workspace switcher
- **THEN** the system discards the prior mounted bakery view state before loading bakery-scoped screens for the newly active bakery

#### Scenario: Previously active bakery is no longer accessible
- **WHEN** a stored active bakery is not present in the user's current memberships
- **THEN** the system discards that selection and returns the user to the bakery selector

### Requirement: Users can manage their default bakery preference
The system SHALL let a user designate one accessible bakery as their default and SHALL use that preference only to preselect the bakery selector.

#### Scenario: Setting a default bakery
- **WHEN** a user marks an accessible bakery as their default
- **THEN** future bakery selectors preselect that bakery

#### Scenario: Default bakery membership is removed
- **WHEN** a user no longer belongs to their default bakery
- **THEN** the invalid default is cleared and another accessible bakery may be chosen

### Requirement: Accessible responsive workspace selection
The bakery selector and switcher SHALL remain keyboard-operable and usable at supported mobile and desktop widths.

#### Scenario: Mobile bakery selection
- **WHEN** the selector is displayed at a supported mobile viewport
- **THEN** bakery names, selection state, and primary actions remain visible without horizontal scrolling

#### Scenario: Assistive technology selection
- **WHEN** a user navigates the selector with a keyboard or assistive technology
- **THEN** each bakery has an accessible name, selection state is announced, and focus remains usable after entering or switching a bakery

### Requirement: Multi-Bakery Workspace Creation
The application SHALL allow authenticated users to explicitly create an additional bakery workspace, SHALL create its owner membership atomically, SHALL retain all previously accessible memberships, and SHALL enter the newly created bakery as the active workspace after the operation succeeds.

#### Scenario: User creates an additional bakery workspace when existing stores exist
- **GIVEN** an authenticated user who has access to one or more existing bakery stores
- **WHEN** the user views the workspace selection screen and submits the "+ Add a new bakery" form with a valid store name
- **THEN** a new bakery workspace record and owner membership SHALL be created atomically
- **AND** the previously accessible bakery remains in the selector list
- **AND** the new bakery appears in the selector list and becomes the active bakery for workspace entry

#### Scenario: Creation fails
- **WHEN** the explicit bakery creation operation fails
- **THEN** the selector remains visible, existing memberships remain intact, and an accessible error is presented without entering a new workspace

#### Scenario: User creates a new bakery workspace from the mock adapter
- **GIVEN** the mock workspace adapter with existing initial memberships
- **WHEN** `createDefaultBakery(name)` is invoked
- **THEN** the new bakery membership SHALL be appended to the active memberships list without overwriting existing memberships

### Requirement: Deterministic local bakery seed and mock fixtures

The local development environment SHALL derive bakery memberships from
committed migrations and `Front-end/supabase/seed.sql`, SHALL keep mock
workspace fixtures free of runtime-created bakery records, and SHALL provide a
repeatable verification that the seeded admin sees only the committed bakery
before explicit creation.

#### Scenario: Clean local seed restores the admin workspace

- **WHEN** the local Supabase database is reset from committed migrations and
  seed data
- **THEN** `admin@jadorebakery.com` has exactly one accessible bakery named
  `J'adore Bakery`
- **AND** no `Runtime Check Bakery` row exists in the local bakery data

#### Scenario: Default mock workspace contains no runtime verification bakery

- **WHEN** the default mock workspace adapter is loaded for the admin journey
- **THEN** it exposes the committed mock bakery fixture
- **AND** it does not expose a `Runtime Check Bakery` membership

#### Scenario: Explicit creation remains the only addition path

- **GIVEN** the clean-seeded admin has the existing `J'adore Bakery`
  membership
- **WHEN** the user explicitly creates a valid new bakery
- **THEN** the new bakery is added to the user's accessible memberships and
  becomes active
- **AND** the existing seeded bakery remains accessible

### Requirement: Default onboarding and explicit creation use distinct operations

The system SHALL use an idempotent default-bakery operation for first-time
onboarding and a separate explicit additional-bakery operation for users who
choose to add another workspace.

#### Scenario: Default onboarding is retried

- **WHEN** an authenticated user with an existing bakery membership retries
  default onboarding
- **THEN** the existing accessible bakery is returned and no duplicate bakery
  or owner membership is created

#### Scenario: Explicit additional creation is requested

- **WHEN** an authenticated user with an existing bakery submits the add-new-
  bakery form
- **THEN** exactly one new bakery and owner membership are created, the
  original bakery remains accessible, and the new bakery becomes active
