# frontend-authentication-shell Specification

## Purpose

Provides a clear, accessible frontend entry boundary for bakery owners to sign up, log in, and leave the protected workspace before a real authentication provider is connected.
## Requirements
### Requirement: Unauthenticated entry boundary
The frontend SHALL present the login experience before rendering bakery business data when no frontend session is active, and its top header SHALL keep the neutral product mark and `Production Studio` subtitle without displaying the bakery-specific `Earl's Bakery` label.

#### Scenario: Opening the application without a session
- **WHEN** a user opens the application without an active frontend session
- **THEN** the login screen is displayed and the bakery workspace is not rendered

#### Scenario: Switching to signup
- **WHEN** the user selects the signup option from the login screen
- **THEN** the signup form replaces the login form without exposing the bakery workspace

#### Scenario: Returning to login
- **WHEN** the user selects the login option from the signup screen
- **THEN** the login form replaces the signup form

#### Scenario: Viewing the login screen while signed out
- **GIVEN** an unauthenticated visitor opens the login screen
- **WHEN** the authentication form is rendered
- **THEN** the top header does not contain visible `Earl's Bakery` text
- **AND** the leaf mark and `Production Studio` subtitle remain visible
- **AND** the `Welcome back` login heading and authentication controls remain available

### Requirement: Login form validation
The frontend SHALL require a valid email address and a non-empty password before submitting a login request.

#### Scenario: Invalid login fields
- **WHEN** the user submits a missing or invalid email address or an empty password
- **THEN** the form identifies each invalid field and does not send a login request

#### Scenario: Valid login submission
- **WHEN** the user submits a valid email address and non-empty password
- **THEN** the frontend sends one login request through the authentication adapter

### Requirement: Signup form validation
The frontend SHALL require a valid email address, a password of at least eight characters, and a matching password confirmation before submitting a signup request.

#### Scenario: Invalid signup fields
- **WHEN** the user submits invalid signup values
- **THEN** the form identifies the invalid fields and does not send a signup request

#### Scenario: Password confirmation mismatch
- **WHEN** the password confirmation does not match the password
- **THEN** the form identifies the mismatch and does not send a signup request

#### Scenario: Valid signup submission
- **WHEN** the user submits a valid email address, qualifying password, and matching confirmation
- **THEN** the frontend sends one signup request through the authentication adapter

### Requirement: Authentication request states
The frontend SHALL communicate authentication progress and results while preventing duplicate submissions, and a successful session SHALL enter bakery selection before any bakery business data is rendered.

#### Scenario: Request in progress
- **WHEN** a login or signup request is pending
- **THEN** the submitting action indicates progress and cannot be submitted again

#### Scenario: Request failure
- **WHEN** the authentication adapter rejects a login or signup request
- **THEN** the form remains visible and presents an accessible error without revealing password values

#### Scenario: Request success
- **WHEN** the authentication adapter accepts a login or signup request
- **THEN** the frontend activates the session and displays the bakery selection or onboarding flow without rendering bakery business data

### Requirement: Frontend logout
The frontend SHALL end the real Supabase Auth session, clear the active bakery and all mounted bakery-scoped frontend state, and return to the unauthenticated entry boundary.

#### Scenario: Successful logout
- **WHEN** an authenticated user selects logout
- **THEN** the Supabase session is ended, the active bakery and prior bakery view state are cleared, the login screen is displayed, and no bakery business data remains rendered

#### Scenario: Logout from bakery selection
- **WHEN** an authenticated user logs out before selecting a bakery
- **THEN** the Supabase session and any remembered bakery selection for that user are cleared and the login screen is displayed

### Requirement: Accessible responsive authentication
The login and signup experiences SHALL remain usable on supported mobile and desktop viewports and SHALL expose programmatic labels, validation messages, and keyboard-operable controls.

#### Scenario: Mobile authentication
- **WHEN** the authentication screen is displayed at a supported mobile viewport
- **THEN** all fields, messages, and primary actions remain visible and operable without horizontal scrolling

#### Scenario: Keyboard and assistive technology use
- **WHEN** a user navigates or submits an authentication form using a keyboard or assistive technology
- **THEN** controls have accessible names, focus remains usable, and validation or request errors are announced

### Requirement: Real sessions restore through the workspace gate
The frontend SHALL restore the current Supabase Auth session before choosing an authenticated-shell state and SHALL load current `bakery_memberships` before it can render bakery business data.

#### Scenario: A valid session is restored
- **WHEN** the application opens with a valid Supabase Auth session
- **THEN** it loads the user's current memberships and displays bakery selection or onboarding before rendering bakery business data

#### Scenario: No valid session is restored
- **WHEN** Supabase Auth reports no current session
- **THEN** the unauthenticated login experience is displayed and no workspace request is allowed to expose bakery data

#### Scenario: A remembered bakery is inaccessible
- **WHEN** session restoration finds a remembered active bakery that is absent from the user's current memberships
- **THEN** the remembered value is discarded and the user remains at bakery selection

### Requirement: Auth enforces the approved password policy
The frontend validation, local Supabase Auth configuration, and hosted Auth configuration SHALL enforce one approved password baseline and secure password-change behavior.

#### Scenario: A weak password is submitted
- **WHEN** a signup or password-change request does not satisfy the approved password baseline
- **THEN** the request is rejected consistently before an account or replacement password is activated
