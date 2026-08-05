# Implementation Plan: Remove Bakery Name from Login Header

request_feedback: true

## Objective

Implement the F2 authentication-shell polish requested by the user: remove the
visible `Earl's Bakery` label from the top of the live login page while keeping
the neutral header mark and all authentication behavior unchanged.

## OpenSpec Change

`remove-earls-bakery-login-branding`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/frontend-authentication-shell/spec.md`
- `tasks.md`

## Workstream Assignment

### Workstream 1 — Live Login Header and Regression Test

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 1.1, 2.1, 3.1–3.6
- Exclusive writable files:
  - `Front-end/src/app/LoginScreen.tsx`
  - `Front-end/src/app/App.test.tsx`
- Deliverable: the live login header no longer displays `Earl's Bakery`, a
  focused test protects the visible result, and the frontend verification
  commands pass.
- Acceptance criteria:
  - `LoginScreen.tsx` retains the leaf mark and `Production Studio` subtitle.
  - The live login screen renders no `Earl's Bakery` header text.
  - Login/signup behavior and existing auth assertions remain unchanged.
  - Focused and integrated checks pass.
- Must not change: `AuthScreen.tsx`, `ProtectedRoute.tsx`, auth adapters,
  Supabase files, domain fixtures, unrelated branding, or OpenSpec artifacts.
- Stopping rule: stop for any required route, shared-contract, legacy-screen,
  or fixture change and report the conflict to the orchestrator.

No concurrent workstreams are planned because the change is a tightly coupled,
two-file presentation correction.

## Verification Plan

From `Front-end`:

```text
pnpm exec vitest run src/app/App.test.tsx
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm exec playwright test e2e/authentication-and-account.spec.ts
```

The Playwright command is focused and should be run when the configured browser
harness is available; a failure caused by environment setup must be recorded
separately from a product failure.

## Approval Gate

Approved for execution by the user's `/orch` invocation. Source implementation,
integrated verification, and the focused browser journey are complete for the
scoped UI/test work. The delta was synchronized into the main authentication
shell specification; the OpenSpec CLI could not be used because the package
resolved by `pnpm dlx openspec` exposes no executable, so artifact consistency
was checked manually.
