## MODIFIED Requirements

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

## ADDED Requirements

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
