# Tasks: Add Root-Level Workspace Navigation

- [x] 1.1 Reconcile the current route registry, workspace mount, navigation
  controls, public/auth paths, and ownership of central files with the active
  manual-order and authentication changes; record any required sequencing.
- [x] 1.2 Expand the route registry to canonical root-level primary paths for
  Home, Orders, Invoices, Storefront, Production, Recipes, Inventory,
  Customers, Finances, and Settings, plus stable nested utility routes.
- [x] 1.3 Add explicit legacy `/app/...` aliases and safe unknown-path
  handling, preserving `/invoice/:token`, `/store/:slug`, `/auth/*`, and
  invitation URLs.
- [x] 1.4 Add focused route-registry and route-outlet tests for canonical paths,
  aliases, direct entry, history, and fallback rendering.
- [x] 2.1 Convert desktop sidebar navigation to URL-aware guarded navigation
  with active state derived from the current route.
- [x] 2.2 Convert mobile bottom navigation and More actions to the same route
  registry, including active More behavior and utility destinations.
- [x] 3.1 Mount the existing React Router dependency at the application entry
  and integrate the workspace route outlet below authentication and active
  bakery selection.
- [x] 3.2 Replace navigation-only `Screen` state in the workspace shell with
  route-derived feature rendering while preserving feature-local dialog,
  filter, mutation, and data state.
- [x] 3.3 Wire utility routes and feature callbacks, including payment settings,
  account/profile, starter management, and storefront configuration, without
  changing their business behavior.
- [x] 3.4 Add focused App/workspace tests proving direct entry remains gated and
  public invoice/storefront routes remain unchanged.
- [x] 4.1 Add desktop and mobile Playwright coverage for every canonical primary
  route, direct entry, refresh, back/forward, active navigation state, legacy
  redirects, and unknown-path fallback.
- [x] 4.2 Run focused tests first, then typecheck, lint, full Vitest, build, and
  the affected responsive browser suite; record any hosted rewrite limitation.
- [x] 5.1 Review the merged diff for route ownership conflicts and regressions
  against active order/auth changes; update task evidence and
  `openspec/PROGRAM_MAP.md`.
- [x] 5.2 Synchronize the verified delta only after manual desktop/mobile
  acceptance confirms each requested navigation and leave archive as a separate
  explicitly requested lifecycle step.
