# Design: Repair Authentication Account Flows

## Findings

- `PasswordResetDialog` calls `requestPasswordReset(email)` without a callback,
  although the helper supports a `redirectTo` argument.
- Local Supabase emitted a recovery email targeting the application root. The
  application only mounts update mode when `window.location.pathname` equals
  `/auth/reset-password`.
- The current reset route mounts update mode based on pathname alone and does
  not distinguish a `PASSWORD_RECOVERY` event from ordinary or missing
  sessions.
- `AccountProfileScreen` stores `currentPassword`, but its submit handler only
  validates the new password and calls `updateUser({ password })`.
- The current browser suite always starts with `VITE_USE_MOCK_BACKEND=true`.
  Its authentication/account file uses conditional visibility checks, so the
  absence of the expected UI does not necessarily fail the test.
- Core login, verified-user lookup, logout token revocation, RLS membership
  isolation, typecheck, lint, unit tests, browser tests, and production build
  passed during the audit. This change must preserve those working boundaries.

## Decisions

1. Build the recovery callback from the current trusted application origin and
   the fixed `/auth/reset-password` path. Do not accept an arbitrary callback
   from user input or query parameters.
2. Preserve the Supabase auth event in the frontend adapter boundary so the
   application can distinguish `PASSWORD_RECOVERY` from normal session
   restoration. The update form is enabled only after that event establishes
   an active recovery state.
3. Treat a direct visit, missing recovery session, expired link, and reused
   link as invalid recovery states. Keep the login boundary available and do
   not expose a generic Update Password tab to unauthenticated visitors.
4. After a successful recovery update, sign out the recovery session and
   navigate to login. This makes the message and actual session state agree.
5. In account settings, reauthenticate with the session email and submitted
   current password before calling `updateUser` with the replacement password.
   Do not compare or store passwords locally. Expose the operation through an
   injectable handler or narrow helper so success and denial paths are
   deterministic in tests.
6. Keep local Auth configuration aligned by allowlisting the exact callback for
   both `127.0.0.1` and `localhost`. Hosted allowlisting is verified manually
   during deployment because it requires external project authority.
7. Use three evidence layers: focused adapter/component tests, strict
   mock-browser journey tests, and a local-Supabase verification script that
   uses synthetic/local users and leaves no changed credential behind.

## Integration Shape

```text
Reset request
    -> trusted origin + /auth/reset-password
    -> Supabase recovery email
    -> PASSWORD_RECOVERY event + active recovery session
    -> guarded password update
    -> sign out recovery session
    -> login

Authenticated account password change
    -> current session email + entered current password
    -> Supabase credential verification
    -> updateUser(new password)
    -> success or accessible denial
```

## Workstream Boundaries

- Recovery owns the auth event contract, callback helper, reset dialog, reset
  route wiring, local callback configuration, and its focused tests.
- Account reauthentication owns only the account profile component and its
  focused tests.
- Journey verification owns only the authentication Playwright file and a new
  local verification script; it must not change production behavior to make a
  test pass.
- The orchestrator owns integration, broad verification, OpenSpec evidence,
  and `PROGRAM_MAP.md` updates.

## Risks and Mitigations

- Auth events can occur during initial client restoration. Subscribe before
  deciding the reset-route state and test event ordering explicitly.
- Recovery links can expire or be scanned/reused. Require the recovery event
  and handle update/sign-out failures without treating pathname as proof.
- Reauthentication can rotate the active session. Keep the existing auth-state
  subscription authoritative and verify account/workspace state remains
  mounted after success or failure.
- Local browser tests can overstate production readiness. Record hosted Auth
  callback allowlisting as a separate manual gate and never claim it was
  changed by local verification.
- Local verification must not leave the seeded password changed. Use a
  synthetic local user with cleanup or restore the original credential before
  reporting success; stop if cleanup cannot be guaranteed.

## Verification Boundary

Implementation and automated verification are limited to the local frontend
and local Docker Supabase stack. No linked reset, production user mutation,
hosted Auth configuration change, or production data access is authorized.
Failed focused or integration checks return the change to apply; a hosted
allowlist mismatch returns to deployment configuration rather than weakening
the callback guard.

