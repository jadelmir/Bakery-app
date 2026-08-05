# Proposal - Add Authentication Shell and User Account Experience (Phase F2)

## Why

Bakery operations require secure user accounts, authenticated sessions, password recovery, profile settings, and workspace route protection. Previously, authentication was managed via local mock state in `App.tsx`. Implementing Phase F2 provides Supabase Auth integration, persistent sessions, password reset flows, account profile settings, and route gating.

## What Changes

- **Supabase Auth Integration**:
  - Integrate Supabase Auth client (`supabase.auth`) for email/password signups, logins, and session refreshes.
  - Implement session listener (`onAuthStateChange`) to sync user session state across tabs.
- **UI Components**:
  - Build `AuthModal.tsx` / `LoginScreen.tsx` for seamless login and registration.
  - Build `PasswordResetDialog.tsx` for requesting password reset links and updating passwords securely.
  - Build `AccountProfileScreen.tsx` for managing display names, emails, avatar uploads, and notification preferences.
- **Route Gating & Security**:
  - Wrap workspace routes in `ProtectedRoute.tsx` ensuring unauthenticated users are redirected to login.
  - Preserve redirect paths after login (e.g., attempting to access `/app/orders` redirects to login and returns after authentication).
  - Add error recovery state handlers for expired JWT tokens, invalid credentials, and rate limits.

## Capabilities

### New Capabilities
- `authentication-and-account-experience`: Defines user registration, login, session persistence, password reset, profile management, and workspace route gating.

## Impact
- **Dependencies**: Depends on Phase B1 (`supabase-backend-foundation`) and Phase B2 (`add-multi-store-workspaces`).
- **Frontend Navigation**: Adds `/auth/login`, `/auth/reset-password`, and `/app/settings/account` routes.
