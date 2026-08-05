# Design: Remove Bakery Name from Login Header

## Design Goals

1. Make the login header bakery-agnostic without changing its visual identity.
2. Keep the smallest possible ownership surface and preserve existing auth
   behavior.
3. Add behavioral evidence for the requested visible outcome.

## Current Evidence

- `Front-end/src/app/ProtectedRoute.tsx` imports and renders
  `Front-end/src/app/LoginScreen.tsx` for unauthenticated users.
- `LoginScreen.tsx` currently renders `Earl's Bakery` in the header above the
  auth card.
- `Front-end/src/app/AuthScreen.tsx` contains a duplicate header but is not
  referenced by the current protected route; it is outside this change.
- The existing authentication shell coverage is in
  `Front-end/src/app/App.test.tsx` and already verifies the live login screen.

## Decision

Remove only the bakery-specific text node from the live header while retaining
the leaf icon and `Production Studio` subtitle. The header remains structurally
present so its spacing and neutral product identity are stable.

The focused test SHALL assert that the rendered top header has no `Earl's
Bakery` text while still exposing the `Welcome back` heading and `Production
Studio` label. It SHALL not assert that the entire page is free of bakery
references, because the existing signup prompt is outside the requested top
header change. Existing auth interaction assertions remain intact.

## Workstream Boundaries

This change is intentionally a single bounded workstream because the UI edit
and its regression assertion are tightly coupled and too small to benefit from
parallel agents.

```text
Login header + auth-shell regression test
  LoginScreen.tsx
  App.test.tsx
          |
          v
  focused auth test -> integrated frontend verification
```

Exclusive writable ownership:

- `Front-end/src/app/LoginScreen.tsx`
- `Front-end/src/app/App.test.tsx`

The orchestrator owns all OpenSpec artifacts and `openspec/PROGRAM_MAP.md`.
No agent may edit `AuthScreen.tsx`, `ProtectedRoute.tsx`, domain fixtures,
Supabase files, or unrelated tests.

## Verification Strategy

1. Run the focused authentication-shell test from `Front-end`.
2. Run the frontend baseline: `pnpm run typecheck`, `pnpm run lint`,
   `pnpm run test`, and `pnpm run build`.
3. Because the login journey is covered by the existing browser suite, run the
   focused authentication Playwright test if the local browser harness is
   available; otherwise record that browser execution was not required for
   this static-only change.

## Stopping Rule

Stop and return to the orchestrator if removing the label requires changing
the route, shared auth contracts, the legacy `AuthScreen`, or any unrelated
branding/data fixture.
