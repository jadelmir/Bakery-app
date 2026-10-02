# bakery-onboarding Delta Specification

## ADDED Requirements

### Requirement: First-time owners receive a focused setup experience

The application SHALL show a bakery-scoped onboarding surface to an owner who
has entered a bakery without completed or dismissed onboarding, and SHALL keep
that surface focused on the minimum path to the first useful Prep List.

#### Scenario: New owner enters a newly created bakery

- **WHEN** an authenticated owner creates a bakery with no onboarding
  completion or dismissal marker
- **THEN** the application shows a welcome/setup surface before the normal Home
  experience
- **AND** the surface presents the next actionable step as the primary action
- **AND** the surface does not require full inventory, team, storefront, or
  financial configuration

### Requirement: Onboarding guides the activation path

The onboarding SHALL guide the owner through product, materials, and order
outcomes using the existing feature workflows rather than duplicating their
forms or persistence logic. The Prep List remains available from the normal
workspace after setup and is not an onboarding step.

#### Scenario: Owner follows the recommended path

- **WHEN** the owner completes product setup, attaches usable materials, and
  creates an eligible order
- **THEN** the onboarding marks each corresponding step complete
- **AND** it completes onboarding without requiring the owner to open the Prep
  List
- **AND** the Prep List remains bakery-scoped and uses the existing derived
  quantities when opened from the normal workspace

### Requirement: Onboarding is skippable and resumable

The owner SHALL be able to skip onboarding without losing access to the normal
workspace and SHALL be able to resume the incomplete steps later.

#### Scenario: Owner skips setup

- **WHEN** the owner selects “Skip for now”
- **THEN** the application enters the normal bakery workspace
- **AND** it provides a quiet “Continue setup” entry point from Home or the
  existing setup area
- **AND** it does not show the first-run surface again on every refresh

### Requirement: Onboarding state is isolated per bakery and user

The application SHALL keep onboarding dismissal and completion state scoped to
the active user and bakery membership, and SHALL derive business step progress
from active bakery records.

#### Scenario: Owner switches bakeries

- **GIVEN** an owner has two accessible bakeries with different setup states
- **WHEN** the owner switches the active bakery
- **THEN** the application shows only the selected bakery's onboarding state
- **AND** no product, order, material, or Prep List data crosses the bakery
  boundary

### Requirement: Invited members do not receive owner onboarding

The application SHALL not present owner setup tasks to an invited member who
enters an existing bakery.

#### Scenario: Staff member enters an invited bakery

- **WHEN** a non-owner member accepts an invitation and opens the bakery
- **THEN** the member enters the normal workspace with their existing role
  permissions
- **AND** owner-only setup actions are hidden or unavailable

### Requirement: The onboarding UI is polished and accessible

The onboarding SHALL use the bakery visual system and SHALL remain usable at
the supported mobile and desktop breakpoints.

#### Scenario: Owner uses onboarding on a narrow screen

- **WHEN** the onboarding is viewed on a mobile viewport
- **THEN** the primary action, skip action, progress indicator, and current
  step remain visible without horizontal scrolling
- **AND** controls have accessible names, visible keyboard focus, and readable
  contrast

#### Scenario: Owner has a long bakery name or an error

- **WHEN** the bakery name is long or a handoff action fails
- **THEN** the layout preserves hierarchy without clipping the primary action
- **AND** the error is presented inline near the affected action
- **AND** the owner can retry or return without losing the active bakery
