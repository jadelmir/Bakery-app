# Proposal: Repair Bakery Discovery and Creation Flow

## Executive Summary

Correct the authenticated bakery workspace boundary so an existing bakery
membership is displayed after login and an explicitly created bakery is
persisted, added to the available list, and selected for entry immediately.

## Program Traceability

- Roadmap phase: F2 Authentication and Account Experience; B2 Authentication
  and Bakery Workspaces.
- Owning capability: `bakery-workspace-selection`.
- Prerequisites: authenticated session restoration, workspace membership/RLS
  foundation, and the existing workspace selector.
- Corrective change: `repair-bakery-selection-and-creation`.
- Related archived change: `2026-07-30-add-multi-bakery-creation`; this change
  repairs gaps in that delivered flow and does not modify the archive.

## Scope

- Ensure the seeded or otherwise accessible bakery membership for the signed-in
  user is returned by the Supabase workspace adapter and rendered in the
  selector.
- Make the explicit create-bakery operation create a new bakery and owner
  membership even when the user already has another bakery.
- After creation, reload memberships, retain the new membership in the list,
  remember its ID, and enter that bakery as the active workspace.
- Add focused adapter, application-shell, and browser coverage for both an
  existing bakery and a newly created bakery.

## Non-Goals

- Do not expose bakeries that are not connected to the current user through an
  accepted membership; global bakery discovery would violate tenant isolation.
- Do not change bakery-domain data, invitation permissions, or the login flow.
- Do not rewrite the archived multi-bakery change or bypass the versioned SQL
  migration workflow.

## Acceptance Evidence

- The seeded admin account sees `J'adore Bakery` in the selector before any
  create action.
- A user with an existing bakery can create a second bakery without replacing
  or hiding the first one.
- The newly created bakery appears in the accessible list and is selected as
  the active bakery when the user chooses “Create & Enter Bakery”.
- The existing and new bakery journeys pass focused Vitest and Playwright
  checks, followed by the frontend verification baseline.
