# Proposal: Remove Bakery Name from Login Header

## Executive Summary

Remove the visible `Earl's Bakery` label from the top header of the live login
screen so the authentication entry point is not tied to a specific bakery
name. This is a presentation-only correction; login, signup, password reset,
session handling, and workspace branding remain unchanged.

## Program Traceability

- Roadmap phase: F2 Authentication and Account Experience.
- Owning capability: `frontend-authentication-shell`.
- Prerequisites: F1 shared application foundation and the existing F2 auth
  shell are complete.
- Owning change: `remove-earls-bakery-login-branding`.

## Scope

- Remove the `Earl's Bakery` text from the top header rendered by
  `Front-end/src/app/LoginScreen.tsx`.
- Preserve the leaf mark, neutral `Production Studio` label, layout spacing,
  login/signup controls, password recovery, and auth-provider behavior.
- Add a focused regression assertion that the live login screen no longer
  renders the bakery-specific header label.

## Non-Goals

- Do not rename bakery fixtures, storefronts, invoices, payment instructions,
  or other domain data that legitimately uses Earl's Bakery.
- Do not change the legacy, unused `AuthScreen` component unless routing
  evidence shows it is made live.
- Do not alter authentication behavior, routes, persistence, or Supabase code.
- Do not redesign the login page or remove the top header mark entirely.

## Acceptance Evidence

- The live login screen does not render `Earl's Bakery` in its top header.
- The neutral header mark and `Production Studio` label remain visible.
- Existing login/signup auth-shell tests continue to pass.
- `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`
  pass from `Front-end`.
