# Tasks - Add Authentication Shell and User Account Experience (Phase F2)

## 1. Supabase Auth Integration & Session Persistence

- [x] 1.1 Extend `Front-end/src/lib/supabase/client.ts` with Supabase Auth session initialization and token refresh listeners.
- [x] 1.2 Build `AuthProvider.tsx` context provider exposing user session, login, signup, logout, and password reset methods.
- [x] 1.3 Add unit tests in `Front-end/src/app/auth.test.ts` for authentication state transitions and token persistence.

## 2. Authentication UI & Password Reset Components

- [x] 2.1 Build `LoginScreen.tsx` and `SignupScreen.tsx` with form validation, error banners, and loading indicators.
- [x] 2.2 Build `PasswordResetDialog.tsx` for requesting password reset emails and submitting new passwords.

## 3. Account Profile & Protected Route Gating

- [x] 3.1 Build `AccountProfileScreen.tsx` for managing display name, email preferences, avatar, and password changes.
- [x] 3.2 Build `ProtectedRoute.tsx` route guard preserving deep-link return paths upon login.
- [x] 3.3 Mount `/auth/login`, `/auth/reset-password`, and `/app/settings/account` in application routing shell.

## 4. Integrated Verification & Quality Gates

- [x] 4.1 Run TypeScript typecheck (`npm run typecheck`) and Vitest test suite (`npm test`).
- [x] 4.2 Add Playwright E2E journey in `Front-end/e2e/authentication-and-account.spec.ts` testing user signup, login, protected route redirection, password reset, and logout.
- [x] 4.3 Update `openspec/PROGRAM_MAP.md` marking Phase F2 as verified.
