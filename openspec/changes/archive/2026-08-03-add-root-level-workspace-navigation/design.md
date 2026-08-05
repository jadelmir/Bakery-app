# Design: Add Root-Level Workspace Navigation

## Findings

- `Front-end/src/app/navigation/routeRegistry.ts` currently registers only
  Dashboard, Orders, Production, Inventory, Customers, Recipes, and Finances
  under `/app/...` paths; Invoices, Storefront, Settings, More, and utility
  views are not registered.
- `Front-end/src/app/navigation/WorkspaceRoutes.tsx` already provides a
  declarative route outlet and alias redirects, but it is covered only by
  isolated `MemoryRouter` tests.
- `Front-end/src/app/BakeryWorkspace.tsx` still initializes `screen` from
  `window.location.pathname` and passes `setScreen` through the shell, so the
  mounted workspace does not use the route registry for navigation.
- `Sidebar.tsx`, `BottomNav.tsx`, and `MoreScreen.tsx` use buttons that call
  screen-state setters instead of URL-aware navigation.
- `App.tsx` owns public invoice/storefront detection and the authentication,
  invitation, membership, and active-bakery gates; those boundaries must remain
  outside the feature route registry.
- `dirtyFormGuard.tsx` already exposes `useGuardedNavigate`, so route controls
  can preserve unsaved-change protection without inventing a second exit path.

## Decisions

1. Use React Router's existing declarative primitives. Mount one browser router
   at the application entry and use `MemoryRouter` for direct component tests.
   Do not synchronize a second `Screen` state machine with `window.history`.
2. Define canonical root-level paths in one registry. The primary route IDs and
   paths are:

   | Route ID | Canonical path | Rendered feature |
   | --- | --- | --- |
   | `home` | `/home` | Home |
   | `orders` | `/orders` | Orders |
   | `invoices` | `/invoices` | Invoices |
   | `storefront` | `/storefront` | Online Store |
   | `production` | `/production` | Production |
   | `recipes` | `/recipes` | Recipes |
   | `inventory` | `/inventory` | Inventory |
   | `customers` | `/customers` | Customers |
   | `finances` | `/finances` | Finances |
   | `settings` | `/settings` | Settings |

   Utility views use nested canonical paths such as
   `/invoices/payment-settings`, `/settings/account`, and
   `/inventory/starter`; `more` is a mobile menu surface rather than a second
   copy of a feature destination.
3. Keep public URLs (`/invoice/:token`, `/store/:slug`), auth URLs, and
   invitation query flows outside the authenticated workspace registry. The
   existing `App.tsx` gate continues to decide whether a workspace route may
   render.
4. Treat old `/app`, `/app/home`, `/app/dashboard`, and `/app/<feature>` paths
   as aliases that redirect to the canonical root path. Do not alias `/` to
   Home because `/` remains the unauthenticated entry point.
5. Render the feature selected by the router and pass guarded route commands to
   feature callbacks that currently accept `setScreen`. Remove navigation-only
   screen state after the route outlet is authoritative; retain local UI state
   for dialogs, filters, and in-progress workflows.
6. Use URL-derived active state in the sidebar and bottom navigation. Mobile
   More opens the menu route/surface, while selecting an item navigates to that
   item's canonical route and closes the menu by leaving `/more`.
7. Keep the route integration owner responsible for `App.tsx`,
   `BakeryWorkspace.tsx`, and `main.tsx`. Those files overlap the active order
   and auth changes and must be edited only after their ownership handoff is
   resolved.

## Workstream Boundaries

- Route contract: registry, route outlet, aliases, route mapping tests.
- Navigation chrome: desktop sidebar, mobile bottom navigation, and More
  actions; no edits to domain screens or workspace data commands.
- Workspace integration: router mount, authenticated route composition, URL to
  feature rendering, utility routes, and central-shell tests; serialized due to
  shared ownership of `App.tsx` and `BakeryWorkspace.tsx`.
- Browser evidence: a new navigation-focused Playwright spec, avoiding the
  active order-flow sections of `e2e/app.spec.ts`.
- Orchestrator: final integrated verification, task ledger, program map, and
  OpenSpec synchronization; no concurrent edits to implementation files.

## Risks and Mitigations

- [The active manual-order or order-status change edits the same workspace
  files] -> Do not apply concurrently. Reconfirm ownership after those changes
  are accepted, or serialize route integration after their current workstream.
- [Direct entry renders login or loses the requested path] -> Keep the browser
  URL intact through auth and bakery selection, then let the workspace router
  resolve it after the existing gates complete.
- [Root routes conflict with public URLs] -> Reserve `/invoice/:token`,
  `/store/:slug`, `/auth/*`, and the login entry before workspace matching;
  verify each public path in browser tests.
- [Legacy links break] -> Add explicit aliases and assert canonical redirects;
  do not use a broad wildcard redirect that could swallow public routes.
- [Unsaved forms bypass protection] -> Route all shell controls through the
  existing guarded navigation helper and retain browser-unload handling.
- [A route exists but a screen callback still changes local state] -> Cover
  every current `setScreen` call during integration and require URL assertions
  in component/browser tests.
- [Hosted refresh fails despite local tests] -> Record deployment rewrite
  configuration as an external F12 gate; do not change hosted infrastructure in
  this frontend change.

## Verification Boundary

Use only local synthetic/mock data. Focused tests should cover the route
registry, canonical/alias resolution, route rendering, active navigation state,
guarded navigation, direct entry, history, refresh, and unknown-path behavior.
Finish with frontend typecheck, lint, unit tests, build, and desktop/mobile
navigation journeys. No Supabase migration, linked project, or production data
operation is required.

