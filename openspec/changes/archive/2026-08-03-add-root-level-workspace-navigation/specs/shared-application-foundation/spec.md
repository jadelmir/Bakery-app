# shared-application-foundation Specification

## MODIFIED Requirements

### Requirement: URL-based workspace navigation

The authenticated bakery workspace SHALL define every primary workspace
destination in one route registry, SHALL use canonical root-level paths,
SHALL synchronize rendered features with browser URL and history, and SHALL
keep direct-entry routes behind authentication and explicit active-bakery
selection.

The canonical primary paths SHALL be `/home`, `/orders`, `/invoices`,
`/storefront`, `/production`, `/recipes`, `/inventory`, `/customers`,
`/finances`, and `/settings`. Utility views SHALL use stable nested paths under
their owning feature. Public invoice, public storefront, auth, and invitation
paths SHALL remain outside this registry.

**Trace:** PRD F1 Shared Application Foundation; corrective owner
`add-root-level-workspace-navigation`; upstream `frontend-authentication-shell`
and the validated active-bakery selection boundary.

#### Scenario: Navigating every primary workspace destination

- **WHEN** an authenticated member with an active bakery selects Home, Orders,
  Invoices, Storefront, Production, Recipes, Inventory, Customers, Finances,
  or Settings
- **THEN** the matching feature renders at its canonical root-level path and
  the selected desktop or mobile navigation control is marked active

#### Scenario: Opening a feature URL without an active bakery

- **WHEN** a user directly opens `/home`, `/orders`, `/invoices`, or another
  registered workspace URL before authentication or bakery selection is
  complete
- **THEN** the existing authentication and bakery-selection gates run before
  the requested feature renders, without trusting a bakery identifier from the
  URL

#### Scenario: Using browser history

- **WHEN** a member navigates between registered workspace features and then
  activates browser Back or Forward
- **THEN** the URL and rendered feature move together without a full page reload
  or remounting an unauthorized bakery workspace

#### Scenario: Redirecting legacy workspace paths

- **WHEN** a member opens a supported legacy `/app/...` workspace path
- **THEN** the router redirects to the corresponding canonical root-level path
  while preserving the existing authenticated workspace boundary

#### Scenario: Opening an unknown workspace URL

- **WHEN** an authenticated user with an active bakery opens an unregistered
  workspace path
- **THEN** the application renders a safe not-found or fallback route with
  navigation to a registered destination, while public invoice and storefront
  URLs retain their existing behavior outside workspace routing
