## Purpose

Lets authenticated users enter, create, select, and switch among bakery workspaces while maintaining one explicit frontend active-bakery boundary for local prototype screens and future persisted business operations.

## ADDED Requirements

### Requirement: New owners receive a default bakery
The system SHALL create one default bakery and an owner membership for an authenticated user who completes onboarding without an existing bakery membership.

#### Scenario: First-time owner onboarding
- **WHEN** an authenticated user completes onboarding and has no bakery membership
- **THEN** the system creates a default bakery, assigns the user as its owner, and presents that bakery in the workspace selector

#### Scenario: Existing member returns
- **WHEN** an authenticated user already belongs to at least one bakery
- **THEN** the system SHALL NOT create another default bakery automatically

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
