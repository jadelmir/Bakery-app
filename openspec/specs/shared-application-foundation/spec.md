# shared-application-foundation Specification

## Purpose
TBD - created by archiving change establish-shared-application-foundation. Update Purpose after archive.
## Requirements
### Requirement: Bakery-scoped shared domain source
The application SHALL maintain one authoritative bakery-domain snapshot for the active bakery, SHALL key canonical entities and relationships by stable identifiers, and SHALL derive each bakery-domain screen's read model from that snapshot rather than from screen-owned fixture collections.

**Trace:** PRD F1 Shared Application Foundation; owner `establish-shared-application-foundation`; upstream `frontend-runtime-verification`, `frontend-prototype-alignment`, and the validated active-bakery mount supplied by `add-multi-store-workspaces`.

#### Scenario: Reading the same order across screens
- **WHEN** Orders, Dashboard, Customers, Inventory, Production, and Finances render information related to the same local order
- **THEN** each screen derives its displayed values from the order and related entities in the active bakery's shared snapshot

#### Scenario: Switching the active bakery
- **WHEN** the authenticated workspace boundary switches from one validated bakery membership to another
- **THEN** the previous bakery's domain snapshot is discarded before the next bakery's domain data is displayed

### Requirement: Explicit local and persisted data boundary
The bakery-domain data layer SHALL expose whether its adapter is session-local or persisted, SHALL scope every adapter operation by the validated `bakeryId`, and SHALL NOT represent session-local bakery-domain records as durable, synchronized, RLS-protected, or hosted data.

**Trace:** PRD F1 and B2-B6 boundary; owner `establish-shared-application-foundation` for frontend contracts; upstream/overlap owner `add-multi-store-workspaces` for persisted Auth/workspace state; later B3-B6 changes own bakery-domain persistence and security.

#### Scenario: Running with the local domain adapter
- **WHEN** the application loads deterministic bakery-domain fixtures for development or tests
- **THEN** the data source identifies session-local durability and the interface retains local-prototype messaging for mutations

#### Scenario: Addressing a persisted workspace
- **WHEN** a session-local bakery-domain adapter operates beneath a Supabase-backed authenticated workspace
- **THEN** it receives the validated bakery identifier without treating the local domain records as persisted workspace records

### Requirement: Replaceable feature adapter contracts
The application SHALL access bakery-domain data through typed feature ports that define bakery-scoped reads, supported mutations, authoritative results, typed failures, and retry inputs without exposing fixture or Supabase implementation details to feature screens.

**Trace:** PRD F1 feature service adapters; owner `establish-shared-application-foundation`; upstream active-bakery identity from `add-multi-store-workspaces`; F3-F6 and B3-B6 extend or replace their owning ports.

#### Scenario: Loading through a deterministic adapter
- **WHEN** an integration test supplies the session-local bakery-domain adapter for a known bakery
- **THEN** the application loads a deterministic snapshot through the same feature-port contracts a future persisted adapter must implement

#### Scenario: Receiving an adapter failure
- **WHEN** a feature port returns a typed connection, authorization, validation, or unknown failure
- **THEN** the application command exposes the corresponding request outcome without allowing the feature screen to inspect storage-specific error objects

### Requirement: Atomic shared application commands
The application SHALL route supported bakery-domain mutations through shared commands, SHALL commit an adapter's authoritative result once, and SHALL reuse a stable operation identifier for any retryable mutation so a retry does not duplicate local orders, generated tasks, or inventory deductions.

**Trace:** PRD F1 cross-screen reactivity and reliability; owner `establish-shared-application-foundation`; existing local calculation inputs from `production-task-generation` and `inventory-requirements-management`; persisted idempotency remains with B5-B10 owners.

#### Scenario: Creating a local order
- **WHEN** a user confirms a supported local order for an existing customer
- **THEN** one command adds the canonical order and its generated tasks and all dependent screen projections update from the committed result without a refresh

#### Scenario: Retrying after an uncertain local response
- **WHEN** a retryable local mutation is invoked again with the same operation identifier
- **THEN** the session-local adapter returns the existing result without creating duplicate domain side effects

### Requirement: Cross-screen reactive projections
The shared application data layer SHALL recompute affected selectors after a committed order or task mutation so the F1 gate screens show a mutually consistent result during the same mounted application session.

**Trace:** PRD F1 completion gate; owner `establish-shared-application-foundation`; upstream shared snapshot and application commands in this capability.

#### Scenario: Propagating an order creation
- **WHEN** a supported local order is created without refreshing the application
- **THEN** Dashboard shows the changed active/upcoming order and summary values, Orders shows the order, Production shows its generated tasks, Inventory shows recalculated requirements, Customers shows the linked customer's updated order-derived values, and Finances shows recalculated revenue or unpaid values

#### Scenario: Propagating task completion
- **WHEN** a supported production task is completed without refreshing the application
- **THEN** Dashboard and Production show the same task lifecycle state and Inventory reflects any existing configured local deduction from that single completion result

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

### Requirement: Consistent resource and recovery states
Feature data boundaries SHALL distinguish idle, loading, ready, empty, error, and evidenced offline states, SHALL announce pending and failure outcomes accessibly, and SHALL offer a retry action when the failed adapter operation is safe to retry.

**Trace:** PRD F1 loading/error/empty/connection-loss/retry states; owner `establish-shared-application-foundation`; F12 later owns release-wide accessibility and reliability completion.

#### Scenario: Loading an empty feature
- **WHEN** a bakery-scoped read succeeds with no records
- **THEN** the feature renders its empty state rather than a loading indicator or error

#### Scenario: Losing a connection during a read
- **WHEN** browser connectivity evidence or a typed adapter failure identifies a connection loss
- **THEN** the feature renders the shared offline state and a safe retry action

#### Scenario: Receiving a non-connection failure
- **WHEN** an adapter read fails without evidence of connection loss
- **THEN** the feature renders the shared error state without describing the application as offline

### Requirement: Unsaved-change protection
The bakery workspace SHALL track registered dirty forms and SHALL require the user to save or explicitly discard changes before an in-app route change, bakery switch, logout, dismiss action, or browser unload can abandon the draft.

**Trace:** PRD F1 unsaved-form states; owner `establish-shared-application-foundation`; feature phases F3-F7 own their form fields and validation; `add-multi-store-workspaces` continues to own authorization and execution of bakery switching/logout.

#### Scenario: Navigating away from a dirty form
- **WHEN** a user attempts route navigation with a registered unsaved draft
- **THEN** the application blocks the transition until the user stays, saves, or confirms discard

#### Scenario: Switching bakeries with a dirty form
- **WHEN** a user confirms discard while initiating an otherwise authorized bakery switch
- **THEN** the draft is discarded before the existing workspace switch proceeds and no draft data appears in the next bakery

### Requirement: Decomposed application and feature boundaries
`App.tsx` SHALL remain the composition boundary for authentication and bakery workspace entry, while bakery-domain state, routes, recovery behavior, and feature screens SHALL be organized in bounded modules that consume selector and command contracts rather than importing mutable data from sibling features.

**Trace:** PRD F1 maintainable shared foundation; owner `establish-shared-application-foundation`; `add-multi-store-workspaces` exclusively owns Auth/workspace modules and the active membership contract; F3-F6 consume the resulting feature boundaries.

#### Scenario: Adding a later feature mutation
- **WHEN** an F3-F6 implementation adds behavior inside its assigned feature module
- **THEN** it can use or extend its owned selector, command, and adapter port without editing another feature's screen-owned collection

#### Scenario: Integrating below the workspace boundary
- **WHEN** the F1 bakery-domain provider and route composition are mounted
- **THEN** existing session restoration, invitation handling, bakery selection, switching, team behavior, and logout remain governed by the active workspace boundary

