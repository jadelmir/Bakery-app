# Implementation Plan: Return to Bakery Selector

## Objective

Allow a signed-in user to click the active bakery identity in the navigation,
confirm the action, and return to the existing bakery selector without logging
out or losing membership access.

## Change

`return-to-bakery-selector` — F2 Authentication and Account Experience / B2
Authentication and Bakery Workspaces.

## Workstreams

| Workstream | Tasks | Exclusive ownership | Acceptance |
| --- | --- | --- | --- |
| Navigation confirmation | 1.1 | `Front-end/src/app/navigation/Sidebar.tsx`, the compact mobile header in `Front-end/src/app/BakeryWorkspace.tsx`, and focused navigation tests | Accessible desktop/mobile bakery-header triggers, cancel/confirm dialog, dirty-form guard preserved |
| App/session boundary | 2.1 | `Front-end/src/app/App.tsx`, focused App tests only | Confirm clears session storage and active membership; selector renders without logout |
| Browser coverage | 3.2 | Affected existing workspace E2E spec or new focused spec | Desktop/mobile open, cancel, confirm, reload, and re-entry journey |
| Orchestrator verification | 3.1, 4.1 | Integration-only conflict resolution, OpenSpec artifacts | All focused/full checks pass and manual acceptance is documented |

No workstream may edit another workstream's exclusive files. The App/session
owner integrates any callback naming changes needed by the navigation owner.
The `BakeryWorkspace.tsx` edit must be serialized with the still-active
`persist-customer-directory` change because that file is a shared integration
surface.

## Model policy

Use the default bounded model at medium reasoning for UI and tests. Use a
high-reasoning model only for resolving interaction with dirty-form guards or
the active authentication/workspace restoration lifecycle.

## Verification

1. Focused Sidebar/App tests.
2. Typecheck and changed-file lint.
3. Full Vitest and production build.
4. Desktop/mobile Playwright return-to-selector journey.
5. Manual authenticated confirmation that Cancel preserves the workspace and
   Confirm returns to selection and stays there after reload.

`request_feedback: true`
