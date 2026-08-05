## MODIFIED Requirements

### Requirement: Password recovery and account profile management

The application SHALL allow users to request password-reset links that return
to a trusted application callback, replace a password only from a valid active
recovery flow, verify the current credential before an authenticated account
password change, edit display names, and configure account preferences.

#### Scenario: Requesting a password reset

- **GIVEN** a user opens password recovery
- **WHEN** they submit a valid registered email address
- **THEN** the application requests a reset email with a trusted callback at
  `/auth/reset-password`
- **AND** it displays a confirmation that does not disclose whether the account
  exists

#### Scenario: Opening a valid recovery link

- **GIVEN** Supabase has established an active `PASSWORD_RECOVERY` session
- **WHEN** the callback opens `/auth/reset-password`
- **THEN** the application displays the new-password form
- **AND** it does not render bakery business data during the recovery step

#### Scenario: Opening an invalid or expired recovery callback

- **WHEN** a visitor opens the reset path without a valid active recovery flow,
  or the recovery link is expired or already used
- **THEN** the application refuses the password update
- **AND** it presents an accessible path to request a new link or return to
  login

#### Scenario: Completing password recovery

- **GIVEN** a valid active recovery flow and a qualifying matching replacement
  password
- **WHEN** the password update succeeds
- **THEN** the application ends the recovery session
- **AND** returns the user to login with confirmation that the new credential
  can be used

#### Scenario: Changing a password from account settings

- **GIVEN** an authenticated user enters their current password and a
  qualifying matching replacement password
- **WHEN** they submit the account password-change form
- **THEN** the application verifies the current credential with Supabase before
  activating the replacement password
- **AND** it never stores or logs either password

#### Scenario: Rejecting an invalid current password

- **WHEN** the authenticated user submits an empty or incorrect current
  password
- **THEN** the replacement password is not activated
- **AND** the form presents an accessible error without clearing a valid new
  password solely because verification failed

## ADDED Requirements

### Requirement: Authentication recovery evidence covers success and denial

The authentication flow SHALL have deterministic automated evidence for reset
callback construction, valid recovery, invalid or expired recovery, current
password denial, successful replacement, session termination, and responsive
browser behavior, plus a local-Supabase verification using synthetic data.

#### Scenario: Running focused authentication verification

- **WHEN** the focused unit, component, browser, and local-Supabase checks run
- **THEN** each required success and denial path produces a mandatory assertion
- **AND** no assertion is skipped merely because the expected UI is absent

#### Scenario: Protecting secrets and production state during verification

- **WHEN** local-Supabase authentication verification runs
- **THEN** it uses local synthetic data and runtime-provided local credentials
- **AND** commits no secret, accesses no production tenant data, and leaves no
  changed test credential behind

