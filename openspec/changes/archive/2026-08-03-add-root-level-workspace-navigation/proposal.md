# Add Root-Level Workspace Navigation

## Why

The authenticated bakery workspace has navigation labels for Home, Orders,
Invoices, Production, Recipes, Inventory, Customers, Finances, Online Store,
and Settings, but the mounted workspace still changes screens through local
`Screen` state. The existing route registry is incomplete and uses `/app/...`
paths, so direct links, refreshes, browser history, and active navigation state
do not consistently represent the feature being viewed.

## What Changes

- Define canonical root-level URLs for every primary workspace destination,
  including the explicitly requested `/home`, `/orders`, and `/invoices`.
- Integrate the existing React Router route outlet below the authenticated,
  active-bakery-selected boundary.
- Convert desktop, mobile, and More navigation controls to URL-aware guarded
  navigation with route-derived active state.
- Preserve supported legacy `/app/...` paths through explicit redirects and
  leave public invoice/storefront and auth/invitation URLs unchanged.
- Add focused route, component, and responsive browser evidence for direct
  entry, refresh, history, gating, aliases, and fallback behavior.

## Capabilities

### New Capabilities

- None. This is a corrective delta to the synchronized
  `shared-application-foundation` capability.

### Modified Capabilities

- `shared-application-foundation`: tightens the URL-navigation requirement to
  canonical root-level paths and complete primary-destination coverage.

## Impact

- Expected frontend surfaces: the route registry/outlet, application entry,
  authenticated workspace shell, desktop/mobile navigation chrome, More view,
  and focused navigation tests.
- Active-change coordination: central shell edits must be serialized with the
  active manual-order and authentication changes; no order, invoice, auth, or
  membership behavior is otherwise changed.
- No database, Supabase, public URL, deployment, or production-data changes are
  included. Hosted history rewrites remain a later release gate.

## Goal

Give every primary workspace destination its own canonical root-level URL:

```text
/home
/orders
/invoices
/storefront
/production
/recipes
/inventory
/customers
/finances
/settings
```

Navigation controls must use those routes, browser history must remain aligned
with the rendered screen, and direct-entry routes must continue to pass through
authentication and active-bakery selection before rendering bakery data.

## Program Traceability

- Frontend roadmap phase: F1 Shared Application Foundation; F12 release
  rewrites/hosting remain a later deployment gate.
- Owning capability: `shared-application-foundation` URL-based workspace
  navigation requirement.
- Owning change: `add-root-level-workspace-navigation` (corrective delta).
- Prerequisites: authenticated workspace boundary, active bakery selection,
  existing React Router dependency, and the current dirty-form guard contract.
- Related active changes: `persist-manual-orders`,
  `add-manual-order-status-transitions`, and
  `repair-authentication-account-flows`. Central workspace integration must be
  serialized with those changes; this plan does not alter their behavior.

## Scope

- Replace the incomplete `/app/...` workspace registry with canonical root-level
  routes for every primary workspace destination.
- Make desktop sidebar, mobile bottom navigation, and mobile More actions use
  route navigation and derive their active state from the URL.
- Mount the route composition below the existing authenticated,
  active-bakery-selected boundary.
- Preserve safe aliases for existing internal `/app/...` paths where practical,
  redirecting them to canonical paths.
- Give payment settings, account/profile, starter management, and storefront
  configuration stable nested routes where they are separate rendered views;
  public `/invoice/:token`, `/store/:slug`, auth, and invitation URLs remain
  outside the workspace route registry.
- Add focused route/component tests and responsive browser coverage for direct
  entry, navigation, refresh, history, active states, and auth gating.

## Non-Goals

- Do not change order creation, order status transitions, invoice business
  logic, production behavior, or persisted data contracts.
- Do not change public invoice or storefront URL formats.
- Do not change authentication, membership, invitation, or tenant-isolation
  behavior.
- Do not add deployment rewrite configuration or claim hosted deep-link support;
  that remains a release/deployment acceptance gate.
- Do not remove the existing visual navigation design or introduce a new router
  dependency.

## Acceptance Evidence

- Each primary workspace destination has one canonical URL and renders its
  corresponding feature when entered directly after authentication and bakery
  selection.
- Selecting Home, Orders, Invoices, and every other primary destination updates
  the URL without a full page reload and marks the correct control active on
  desktop and mobile.
- Browser Back and Forward restore both the URL and rendered feature.
- Legacy `/app/...` workspace paths redirect to canonical root-level paths;
  public/auth paths remain unchanged.
- Unknown authenticated workspace paths render a safe not-found/fallback view.
- Dirty-form navigation remains guarded through the existing exit contract.
