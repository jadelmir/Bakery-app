# Repair Authentication Account Flows

## Executive Summary

Repair the F2 password-recovery and account-password workflows so recovery
emails return to a guarded update screen, password changes verify the current
credential, and automated evidence exercises the real behavior rather than
passing through optional mock-only assertions.

## Program Traceability

- Frontend roadmap phase: F2 Authentication and Account Experience.
- Backend dependency: B2 Authentication and Bakery Workspaces.
- Owning capability: `authentication-and-account-experience`.
- Supporting capability: `frontend-authentication-shell`.
- Prerequisites: `supabase-backend-foundation`, the existing Supabase browser
  client, and the authenticated workspace gate.
- Owning change: `repair-authentication-account-flows`.
- Related completed change: `remove-earls-bakery-login-branding` owns only the
  synchronized login-header presentation correction and must not be edited.

## Problem

Verification on 2026-08-03 found that password-reset requests omit an explicit
callback. Local Supabase therefore generated a recovery link whose
`redirect_to` was the application root, while the update-password UI is only
mounted at `/auth/reset-password`. The account screen also renders a Current
Password field but never validates or submits it before replacing the
password. Existing Playwright authentication checks use the mock backend and
guard important assertions with visibility conditions, so they can pass
without proving login, recovery, or account behavior.

## Scope

- Generate an environment-relative recovery callback ending in
  `/auth/reset-password` and include it in every password-reset request.
- Allow the reset-password update form only for a valid Supabase
  `PASSWORD_RECOVERY` flow; reject direct, expired, or otherwise invalid entry.
- End the recovery session after a successful password replacement and return
  the user to login with a clear result.
- Verify the signed-in user's current password before changing it from account
  settings, while preserving Supabase's configured secure-password-change
  behavior.
- Add deterministic component and adapter tests for success and failure paths.
- Replace conditional mock-only browser assertions with required assertions
  and add a local-Supabase verification path using synthetic/local data only.
- Add the exact local callback URLs to committed local Supabase configuration
  and document the hosted redirect-allowlist verification gate in evidence.

## Non-Goals

- Do not add MFA, passkeys, social login, SSO, phone authentication, email
  changes, account deletion, or administrator user management.
- Do not change bakery membership, tenant RLS, database tables, migrations, or
  workspace authorization.
- Do not place service-role keys or other secrets in browser code, tests, or
  committed files.
- Do not modify a hosted Supabase project's Auth settings automatically. The
  hosted callback allowlist remains an explicit deployment/manual gate.
- Do not redesign the login, recovery, or account pages beyond states required
  for correct and accessible behavior.

## Acceptance Evidence

- A recovery request produces a link whose callback is
  `/auth/reset-password` on the current allowed origin.
- A valid recovery link opens the update form, while direct or invalid entry
  cannot replace a password.
- A successful recovery replaces the password, ends the recovery session, and
  returns to login; expired or reused links show an actionable error.
- Account settings reject an empty or incorrect current password and change
  the password only after current-credential verification.
- Old credentials fail and new credentials succeed after a verified change.
- Required desktop/mobile browser assertions, focused Vitest coverage, the
  local Supabase auth verification, and the frontend baseline all pass.

