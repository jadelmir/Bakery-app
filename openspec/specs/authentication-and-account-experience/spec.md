# authentication-and-account-experience Specification

## Purpose
Provides user registration, email/password login, persistent session management, password recovery, user profile management, and workspace route protection for bakery operations.
## Requirements
### Requirement: User registration, login, and session persistence
The application SHALL support email and password signup, login, session persistence across page refreshes, and graceful logout.

#### Scenario: User login with email and password
Given an existing user on the login screen
When they enter valid email and password credentials and submit
Then the system authenticates the user, stores the session JWT, and redirects to the active bakery workspace.

#### Scenario: Session persistence across page reloads
Given an authenticated user refreshing the browser page
When the application mounts
Then the `AuthProvider` restores the active session without prompting for login again.

### Requirement: Password recovery and account profile management
The application SHALL allow users to request password reset links, update passwords, edit display names, and configure account preferences.

#### Scenario: Requesting a password reset
Given a user on the password recovery screen
When they submit their registered email address
Then the system sends a password reset link and displays a confirmation message.

### Requirement: Protected route gating and auth error recovery
The application SHALL restrict workspace routes to authenticated users, preserving target redirect paths and handling expired session errors.

#### Scenario: Accessing a protected route while unauthenticated
Given an unauthenticated visitor navigating directly to `/app/orders`
When the page loads
Then the system redirects them to `/auth/login` and preserves `/app/orders` as the return destination.

