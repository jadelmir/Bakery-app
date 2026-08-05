# frontend-authentication-shell Delta Specification

## MODIFIED Requirements

### Requirement: Unauthenticated entry boundary

The frontend SHALL present the login experience before rendering bakery business
data when no frontend session is active, and its top header SHALL keep the
neutral product mark and `Production Studio` subtitle without displaying the
bakery-specific `Earl's Bakery` label.

#### Scenario: Opening the application without a session

- **WHEN** a user opens the application without an active frontend session
- **THEN** the login screen is displayed and the bakery workspace is not
  rendered

#### Scenario: Switching to signup

- **WHEN** the user selects the signup option from the login screen
- **THEN** the signup form replaces the login form without exposing the bakery
  workspace

#### Scenario: Returning to login

- **WHEN** the user selects the login option from the signup screen
- **THEN** the login form replaces the signup form

#### Scenario: Viewing the login screen while signed out

- **GIVEN** an unauthenticated visitor opens the login screen
- **WHEN** the authentication form is rendered
- **THEN** the top header does not contain visible `Earl's Bakery` text
- **AND** the leaf mark and `Production Studio` subtitle remain visible
- **AND** the `Welcome back` login heading and authentication controls remain
  available
