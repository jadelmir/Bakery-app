# Tasks: Return to Bakery Selector

- [x] 1.1 Make the desktop Sidebar bakery identity and compact mobile
  active-bakery header accessible triggers, with a confirmation dialog and
  cancel/confirm actions using existing UI primitives and dirty-form
  protection.
- [x] 2.1 Update the App workspace-exit callback to clear the remembered bakery
  selection before returning to `WorkspaceSelector`, without signing out.
- [x] 3.1 Add focused Sidebar and App tests for open, cancel, confirm, selector
  return, session-storage clearing, and dirty-form behavior.
- [x] 3.2 Add desktop/mobile Playwright coverage for the return-to-selector
  journey and explicit re-entry into a bakery afterward.
- [x] 4.1 Run typecheck, lint, Vitest, build, and affected Playwright tests;
  record evidence and leave the change ready for manual acceptance.

## Evidence

- Focused Vitest: 35 tests passed across `navigation.test.tsx` and `App.test.tsx`.
- Full serial Vitest: 209 tests passed across 25 test files.
- Typecheck, full lint, and production build passed.
- Affected Playwright: 6 tests passed across desktop and mobile, including
  cancel, confirm, reload persistence, and bakery re-entry.
- Manual authenticated acceptance is still required before archiving this
  change: confirm Cancel preserves the workspace, Confirm returns to bakery
  selection, and re-entering a bakery restores the workspace without logout.
