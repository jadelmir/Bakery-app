# Return to Bakery Selector

## Executive Summary

Give signed-in users an explicit way to leave the active bakery workspace and
return to the bakery selection screen. Clicking the active bakery identity in
the navigation header should open a confirmation dialog; confirming returns the
user to the selector without signing out.

## Program Traceability

- Frontend roadmap phase: F2 Authentication and Account Experience.
- Backend roadmap phase: B2 Authentication and Bakery Workspaces.
- Owning capability: `bakery-workspace-selection`.
- Prerequisites: the synchronized bakery workspace-selection baseline and the
  existing authenticated `WorkspaceSelector`/`activeMembership` boundary.

## Problem

The application can enter a selected bakery and can switch directly between
multiple bakeries, but there is no visible action for returning to the full
bakery selector. The sidebar header already displays the bakery identity and
role, but it is not actionable. The app also remembers the active bakery in
session storage, so simply clearing active state would not fully express an
intentional return to selection after reload.

## Scope

- Make the desktop navigation header's bakery identity and the compact mobile
  active-bakery header accessible triggers.
- Show a confirmation dialog asking whether the user wants to return to bakery
  selection.
- On confirmation, clear the remembered bakery, clear the active membership,
  and render the existing selector without signing out.
- Preserve the current bakery when the user cancels.
- Keep dirty-form protection in the existing guarded-exit path.
- Cover desktop and mobile workspace journeys and keyboard-accessible dialog
  behavior.

## Non-Goals

- Do not sign the user out or change authentication state.
- Do not delete bakeries, memberships, or business data.
- Do not redesign direct bakery switching or the selector's create/select flow.
- Do not add backend endpoints or schema changes.

## Acceptance Evidence

- Clicking the active bakery header opens the confirmation dialog.
- Cancel keeps the current workspace and active bakery intact.
- Confirm returns to `Select a bakery` and clears the remembered bakery.
- Reloading after confirmation keeps the selector visible until a bakery is
  selected again.
- Existing dirty-form and logout guards remain unaffected.
