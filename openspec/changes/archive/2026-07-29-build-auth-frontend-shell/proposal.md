## Why

The bakery application currently opens directly into business data and has no account entry experience. A small frontend-only authentication shell establishes the login and signup journeys before real Supabase authentication and data protection are introduced in later changes.

## What Changes

- Add responsive login and signup screens that match the existing bakery visual system.
- Add client-side email, password, and password-confirmation validation with accessible feedback.
- Add loading, failure, and success presentation states driven by a replaceable mock authentication adapter.
- Add a frontend session boundary that keeps the bakery workspace out of view until the mock user is authenticated.
- Add logout behavior that returns the user to the login screen.
- Clearly retain a prototype-only boundary: this change does not create accounts, persist sessions, connect Supabase, or provide real security.

## Capabilities

### New Capabilities

- `frontend-authentication-shell`: Provides the login, signup, validation, protected-shell, and logout behavior for the frontend prototype.

### Modified Capabilities

None.

## Impact

- Affects the React application entry point, new authentication components and state, shared form styling, and frontend tests.
- Introduces no backend, database, authentication provider, environment variables, or persisted business data.
- Establishes a frontend authentication contract that a later Supabase change can implement without redesigning the screens.
