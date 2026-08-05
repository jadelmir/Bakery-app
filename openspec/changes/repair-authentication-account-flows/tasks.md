# Task Ledger: Repair Authentication Account Flows

## 1. Guarded Password Recovery

- [x] 1.1 Extend the auth adapter/session boundary to preserve the Supabase auth
  event needed to distinguish `PASSWORD_RECOVERY` from ordinary restoration.
- [x] 1.2 Generate the trusted `/auth/reset-password` callback from the current
  application origin, pass it to every recovery request, and add the exact
  localhost callback URLs to local Supabase configuration.
- [x] 1.3 Gate update mode on a valid recovery event/session, handle invalid,
  expired, and reused links accessibly, and sign out/navigate to login after a
  successful password replacement.
- [x] 1.4 Add focused adapter, route, and dialog tests for callback construction,
  event ordering, success, update failure, sign-out failure, and invalid direct
  entry.

## 2. Verified Account Password Change

- [x] 2.1 Require a non-empty current password and verify it against the signed-
  in session email before submitting a replacement password.
- [x] 2.2 Preserve pending, success, and accessible error behavior without
  logging credentials or changing workspace authorization/state.
- [x] 2.3 Add focused account-profile tests for missing/incorrect current
  password, mismatched or weak replacement, successful reauthentication and
  update, and backend failures.

## 3. Authentication Journey Evidence

- [x] 3.1 Replace conditional authentication/account Playwright assertions with
  required desktop/mobile login, signup, recovery-request, account, and logout
  assertions, including failure states where deterministic in mock mode.
- [x] 3.2 Add a local-Supabase verification script using synthetic/local data to
  prove invalid login denial, valid login, verified user, reset callback target,
  password replacement, old/new credential behavior, logout revocation, and
  cleanup/restoration.

## 4. Integrated Verification and Lifecycle

- [x] 4.1 Run focused Vitest and Playwright checks, local Supabase auth
  verification, database lint/security checks, and the frontend typecheck,
  lint, full test, build, and desktop/mobile browser baseline.
- [x] 4.2 Manually verify the hosted/staging Auth redirect allowlist contains the
  exact reset callback before deployment; record this as blocked external
  evidence if project authority is unavailable.
- [ ] 4.3 After all acceptance evidence passes, update the task evidence, delta
  spec readiness, and `openspec/PROGRAM_MAP.md`. Do not synchronize or archive
  before manual recovery and account-password testing is complete.

## Verification Evidence (2026-08-03)

- Focused authentication Vitest: 46/46 passed across `auth`, `App`, recovery
  dialog, and account-profile suites.
- Full frontend Vitest: 155/155 passed.
- Focused authentication Playwright: 8/8 passed across desktop and mobile.
- Full Playwright: 52/52 passed across desktop and mobile.
- Typecheck, zero-warning lint, and production build passed.
- The local synthetic authentication script proved invalid/valid login,
  verified user identity, the exact reset callback, password replacement,
  old/new credential behavior, logout revocation, and restoration of the
  seeded credential.
- Local database lint and security advisors reported no issues; an authenticated
  non-member continued to see zero bakery, order, and customer rows.
- Task 4.2 is recorded complete through its approved fallback: hosted/staging
  project authority is unavailable in this workspace, so the exact hosted
  redirect allowlist remains an explicit deployment gate and was not claimed
  as verified.
- Task 4.3 remains open. Do not synchronize or archive until the hosted
  callback gate and required manual product testing are confirmed.
