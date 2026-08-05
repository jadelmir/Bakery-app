## Purpose

Provides a clear, accessible frontend entry boundary for bakery owners to sign up, log in, and leave the protected workspace before a real authentication provider is connected.

## ADDED Requirements

### Requirement: Unauthenticated entry boundary
The frontend SHALL present the login experience before rendering bakery business data when no frontend session is active.

#### Scenario: Opening the application without a session
- **WHEN** a user opens the application without an active frontend session
- **THEN** the login screen is displayed and the bakery workspace is not rendered

#### Scenario: Switching to signup
- **WHEN** the user selects the signup option from the login screen
- **THEN** the signup form replaces the login form without exposing the bakery workspace

#### Scenario: Returning to login
- **WHEN** the user selects the login option from the signup screen
- **THEN** the login form replaces the signup form

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
The frontend SHALL communicate authentication progress and results while preventing duplicate submissions.

#### Scenario: Request in progress
- **WHEN** a login or signup request is pending
- **THEN** the submitting action indicates progress and cannot be submitted again

#### Scenario: Request failure
- **WHEN** the authentication adapter rejects a login or signup request
- **THEN** the form remains visible and presents an accessible error without revealing password values

#### Scenario: Request success
- **WHEN** the authentication adapter accepts a login or signup request
- **THEN** the frontend activates a mock session and renders the bakery workspace

### Requirement: Frontend logout
The frontend SHALL let an authenticated user end the current frontend session.

#### Scenario: Successful logout
- **WHEN** an authenticated user selects logout
- **THEN** the frontend clears the mock session, returns to the login screen, and no longer renders bakery business data

### Requirement: Accessible responsive authentication
The login and signup experiences SHALL remain usable on supported mobile and desktop viewports and SHALL expose programmatic labels, validation messages, and keyboard-operable controls.

#### Scenario: Mobile authentication
- **WHEN** the authentication screen is displayed at a supported mobile viewport
- **THEN** all fields, messages, and primary actions remain visible and operable without horizontal scrolling

#### Scenario: Keyboard and assistive technology use
- **WHEN** a user navigates or submits an authentication form using a keyboard or assistive technology
- **THEN** controls have accessible names, focus remains usable, and validation or request errors are announced
