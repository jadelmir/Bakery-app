# Design: Return to Bakery Selector

## Findings

- `Sidebar.tsx` renders the desktop bakery icon/name/role header and already
  accepts an unused `onManageStores` callback.
- `BakeryWorkspace.tsx` renders the compact mobile active-bakery header and
  already owns the active-membership context needed to expose the same action.
- `BakeryWorkspace.tsx` passes its `onManageStores` prop to `Sidebar` and to
  settings-related flows.
- `App.tsx` currently passes `onManageStores={() => setActiveMembership(null)}`;
  the selector therefore can render, but the remembered session-storage bakery
  is not cleared by this callback.
- `WorkspaceSelector.tsx` is already the canonical authenticated bakery
  selection surface and does not need a new route.
- `AlertDialog` and the existing dirty-form guard provide established patterns
  for confirmation UI and guarded workspace exits.

## Decisions

1. Put the confirmation state and dialog trigger in `Sidebar.tsx`, closest to
   the clickable bakery identity. Use the existing `AlertDialog` primitives so
   focus trapping, Escape handling, and accessible labeling remain consistent.
2. Use an explicit `onManageStores`/`onReturnToSelector` callback from the
   workspace shell. The App-level callback removes
   `bakery:${session.user.id}` from session storage before clearing
   `activeMembership`.
3. Treat confirmation as a workspace exit and pass it through the existing
   guarded-exit mechanism so dirty forms can still block the transition.
4. Keep direct bakery switching unchanged. The new action returns to selection;
   it does not sign out and does not mutate membership records.
5. Add coverage at the component level for dialog open/cancel/confirm and at
   the App/workspace level for selector return plus remembered-bakery clearing.

## Workstream Boundaries

- Navigation UI: `Sidebar.tsx`, the compact mobile header in
  `BakeryWorkspace.tsx`, focused tests, and only the shared dialog imports
  needed by those components.
- App/session boundary: `App.tsx` and focused app tests for clearing active
  bakery state and session storage.
- Browser coverage: `e2e/shared-application-foundation.spec.ts` or the nearest
  existing authenticated workspace journey; no overlapping source ownership.

The App/session owner owns the callback contract. The navigation owner must not
edit `App.tsx`, workspace adapters, or active customer/order changes. Because
`BakeryWorkspace.tsx` overlaps the still-active customer persistence change,
its edits must be serialized with that change's integration state.

## Verification Boundary

Run focused navigation/App tests first, then typecheck, lint, full Vitest,
build, and desktop/mobile Playwright coverage for selecting a bakery, opening
the dialog, cancelling, confirming, and returning to selection after reload.
No database or hosted-environment verification is required.
