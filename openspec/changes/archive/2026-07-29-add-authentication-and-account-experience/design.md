# Design - Add Authentication Shell and User Account Experience (Phase F2)

## Context

Bakery owners and staff need a secure authentication experience, password recovery, persistent login sessions, and accessible profile settings.

This design specifies the Supabase Auth integration, session state architecture, route gating guards, and React UI components.

## Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Application                             │
│      - AuthProvider (Manages session, user context, token refresh)     │
│      - ProtectedRoute (Guards workspace routes)                        │
│      - LoginScreen, PasswordResetDialog, AccountProfileScreen          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Supabase Auth Engine                           │
│      - supabase.auth.signUp(), signInWithPassword(), signOut()         │
│      - supabase.auth.resetPasswordForEmail()                           │
│      - supabase.auth.onAuthStateChange()                               │
└────────────────────────────────────────────────────────────────────────┘
```

## Decisions

### 1. Unified `AuthProvider` Context
Wrap the React tree in an `AuthProvider` that listens to `supabase.auth.onAuthStateChange`. It exposes `user`, `session`, `loading`, `login()`, `signup()`, `logout()`, and `resetPassword()`.

### 2. Protected Route Gating with Deep-Link Preservation
`ProtectedRoute` checks `session`. If unauthenticated, it stores `location.pathname` in state, redirects to `/auth/login`, and redirects back upon successful authentication.

### 3. Password Reset Flow
Users can request a password reset email via `PasswordResetDialog`. Clicking the link redirects to `/auth/reset-password` where they enter a new password validated by client-side strength checks.
