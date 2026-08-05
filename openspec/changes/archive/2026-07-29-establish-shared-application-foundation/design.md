## Context

PRD Frontend Phase 1 requires URL navigation, a shared application data layer, feature service adapters, consistent request/recovery states, and one source of truth whose local order or task updates are visible across Dashboard, Orders, Production, Inventory, Customers, and Finances without refresh. The synchronized runtime and prototype-alignment capabilities are evidence inputs, but `openspec/PROGRAM_MAP.md` still records the remaining F1 coverage as unmapped.

The current React application concentrates its bakery-domain types, fixture collections, screens, navigation, modal workflow, and several mutations in `Front-end/src/app/App.tsx`. `BakeryWorkspace` owns mutable orders and generated production tasks, while Dashboard has its own task state and static order totals; Customers, Recipes, and Finances read static collections; Inventory combines passed tasks with other defaults. This creates multiple valid-looking but contradictory views of one bakery.

The runtime boundary is intentionally mixed. The active `add-multi-store-workspaces` change owns Supabase Auth, bakeries, memberships, invitations, role enforcement, tenant isolation, selection, and switching. Bakery-domain records and calculations are still local prototype behavior. This change consumes an already validated `activeMembership.bakeryId` and must neither duplicate workspace behavior nor imply that domain records are persisted or RLS-protected.

Directional prerequisites are:

`frontend-runtime-verification` + `frontend-prototype-alignment` + stable active-bakery mount contract from `add-multi-store-workspaces` -> `shared-application-foundation` -> F3 Ingredients / F4 Recipes / F5 Customers / F6 Orders -> later operational and reporting phases.

Planning may proceed while the workspace change is active, and non-overlapping new modules may be implemented after approval. Any edit to `App.tsx` or its mounted workspace boundary must be serialized after the active workspace owner confirms that boundary is stable. F1 cannot pass its completion gate until the integrated active-bakery behavior is preserved.

## Goals / Non-Goals

**Goals:**

- Make one bakery-scoped domain snapshot the authoritative source for all currently represented bakery-domain screens.
- Define small, replaceable feature ports with explicit bakery scope, durability, request outcomes, and safe retry semantics.
- Route supported order and task commands through one application service and recompute dependent projections from normalized entities.
- Add URL-based feature navigation, browser history, direct-entry behavior, and a route registry that later feature phases can extend without reopening the application shell.
- Standardize loading, error, empty, offline/connection-loss, retry, and unsaved-change behavior.
- Decompose the authenticated bakery workspace into an application boundary, route composition, domain modules, shared state/recovery components, and feature screen modules.
- Preserve current visual behavior and existing local production, planning, reporting, authentication, and workspace evidence while adding focused F1 acceptance coverage.

**Non-Goals:**

- Changing Supabase Auth, profiles, bakeries, memberships, invitations, team roles, workspace RLS, or active-bakery authorization.
- Creating or changing migrations, database types, domain tables, RLS policies, Edge Functions, hosted configuration, or production deployment.
- Persisting ingredients, recipes, customers, orders, tasks, inventory, payments, or reports; cross-tab sync and refresh durability are not promised.
- Completing F3-F12 CRUD, business calculations, scheduling, invoicing, notification, settings, or release workflows.
- Replacing the existing production/planning/reporting algorithms except where they must consume the shared snapshot.
- Selecting a global third-party state library. The required boundary can be implemented with React and pure TypeScript already in the repository.
- Claiming a product phase complete from source files or unit tests alone; the PRD completion gate and integrated browser evidence remain required.

## Decisions

### 1. Use a normalized bakery-domain snapshot with pure selectors

Create canonical domain types and a `BakeryDomainSnapshot` keyed by stable identifiers for customers, ingredients/inventory, recipes/flows, orders/items, tasks, and transactions represented by the prototype. Relationships use identifiers rather than copied screen-owned objects. A small immutable reducer applies adapter results, and pure selectors derive each screen model, including active orders, task views, requirements/shortages, customer order history and balances, and financial summaries.

The provider is mounted with one validated `bakeryId`; state from another bakery is never retained in the mounted provider. Component-only interaction state such as an open card, search text, filters, and modal step stays local unless it is part of a shareable URL or an unsaved form.

The alternative is independent React state per screen with callbacks threaded through `BakeryWorkspace`. That preserves the current contradiction and makes later feature teams coordinate every mutation across many components. A second alternative is a new global state dependency, but F1 does not need its operational and migration cost.

### 2. Compose the root adapter from bounded feature ports

Define a root `BakeryDomainAdapter` as a composition of typed ports rather than one growing service object. The initial ports load the shared snapshot and support only existing representative mutations, such as creating a local order with its generated tasks and updating a production task with any local deduction result. Every call receives `bakeryId`; every mutation receives a stable operation identifier; successful results return the authoritative changed entities needed by the reducer.

The adapter exposes a data-source descriptor such as `durability: "session-local" | "persisted"` and typed failures such as connection, authorization, validation, and unknown. F1 ships a deterministic session-local adapter for development and tests. Later backend phases may replace one port at a time, but they own schema, transport, authorization, server idempotency, and persistence verification.

The alternative is importing Supabase or fixture constants directly in feature components. That couples UI work to storage and would let local prototype data bypass the workspace boundary. The alternative of defining full future CRUD now would prematurely own F3-F6 product decisions.

### 3. Put mutations behind application commands and commit adapter results once

Feature screens invoke application commands, not reducer dispatch or adapters. A command marks its request pending, calls the bakery-scoped adapter port, and commits one returned result to the snapshot. Initial F1 commands are pessimistic: shared state changes only after adapter success, so a failed request cannot leave different screens showing different outcomes.

Any retryable mutation reuses its original operation identifier, and the session-local adapter deduplicates it. Reads may retry freely. Future persisted adapters must satisfy the same contract, but their database idempotency implementation belongs to the owning backend phase.

Creating an order updates canonical customer/order/task inputs in one result. Selectors then update Orders and Production directly and recompute Dashboard, Inventory, Customers, and Finances. Completing a task updates Dashboard and Production and, when the existing deduction trigger applies, Inventory from the same result.

The alternative is optimistic screen-local updates with bespoke rollback. That increases F1 complexity and can recreate the inconsistency this change exists to remove.

### 4. Model resource and mutation states explicitly

Use a shared discriminated request-state contract for `idle`, `loading`, `ready`, `empty`, `error`, and `offline`. An empty successful collection is not an error. Offline is used only when browser connectivity or a typed adapter failure supplies evidence; arbitrary failures are not mislabeled as connection loss. Recovery components provide accessible status/alert announcements and invoke the exact read or command retry supplied by the application service.

The alternative is a single boolean plus an error string in each screen. It cannot distinguish first load, empty success, stale/ready content, connection loss, and retry state consistently.

### 5. Keep unsaved-form state local but guard all exit paths

Feature forms own their draft and a dirty flag. A reusable guard blocks in-app route changes, bakery switching, logout, dialog dismissal, and browser unload until the user saves or explicitly discards. The guard exposes a registration contract to the bakery workspace boundary; it does not persist drafts or decide feature validation rules.

The active workspace owner still decides whether a bakery switch is authorized. F1 only asks for confirmation before invoking an already authorized switch.

The alternative is moving every draft into global domain state. That confuses uncommitted UI data with authoritative records and complicates later server-backed validation.

### 6. Use one declarative URL route registry inside the authenticated bakery boundary

Introduce a registry for the existing workspace destinations and render them through the repository's existing React Router dependency. Canonical paths are stable feature paths beneath the authenticated application boundary; aliases may redirect to preserve existing labels. Browser back/forward and direct entry restore the requested feature after authentication and explicit bakery selection. Unknown workspace paths resolve to a safe not-found/fallback route.

The active bakery identifier remains in validated workspace state rather than being trusted from a URL parameter. Hosted rewrite rules are a deployment concern and remain an F12 rollout gate, while local dev-server and memory-router tests provide F1 source evidence.

The alternative is synchronizing `useState<Screen>` with `window.history` manually. It creates a second routing implementation and makes blocking unsaved navigation harder to verify.

### 7. Decompose below, not through, the active workspace boundary

After the workspace owner confirms the mounted boundary, keep `App.tsx` focused on auth/session restoration, invitation routing, membership loading, explicit bakery selection, and active-bakery composition. Move the bakery-domain provider, workspace chrome, route registry, and route outlet into bounded application modules. Move each existing bakery-domain screen to its feature directory, with feature modules consuming selector/command hooks rather than fixture constants or mutable arrays from sibling screens.

`AuthScreen.tsx`, `auth.ts`, `workspace.ts`, `WorkspaceSelector.tsx`, `TeamManagement.tsx`, `InvitationLanding.tsx`, Supabase files, and workspace migration/policy tests remain outside this change's ownership. One integration owner handles `App.tsx` and extraction moves; concurrent agents, if explicitly requested, may own only non-overlapping new domain, routing/recovery, or test files. No two agents edit `App.tsx`, a central type file, or the same extracted feature file concurrently.

The alternative is a broad file split that moves code without establishing dependency direction. Smaller files alone would not prevent screens from retaining separate sources of truth.

### 8. Verify behavior at three evidence levels

Pure tests cover reducer transitions, selectors, bakery scoping, and local-adapter deduplication. Component/integration tests cover request/recovery states, URL history, direct entry, unsaved guards, workspace-switch clearing, and cross-screen updates using one provider. A Playwright journey creates a local order, visits all six F1 gate screens, completes a task, uses back/forward navigation, and verifies no refresh is required.

These tests prove the session-local F1 contract only. They do not prove Supabase domain persistence, RLS, hosted routing, or production durability.

The alternative is relying on snapshots or file existence. Neither demonstrates data flow or the PRD completion gate.

## Risks / Trade-offs

- [The active workspace change edits `App.tsx` or changes the mount contract during F1 integration] -> Keep domain/routing work in new files, serialize the integration edit, re-read the active artifacts and current source immediately before integration, and return to proposal/update if the contract changes materially.
- [Canonical types prematurely encode later domain decisions] -> Model only fields already needed by current prototype behavior and extension points; F3-F6 own new fields, validation, and persisted schema.
- [A large extraction causes visual or accessibility regressions] -> Move behavior in bounded steps, preserve existing focused tests, and run desktop/mobile browser comparisons after each feature group.
- [Derived selectors drift from existing calculations] -> Reuse `production.ts`, `planning.ts`, and `reporting.ts` as pure calculation dependencies and add parity fixtures before deleting duplicate constants.
- [A local adapter is mistaken for persisted functionality] -> Expose session-local durability, retain local-preview messaging, and state the evidence boundary in tests and verification notes.
- [Mutation retry creates duplicate orders or deductions] -> Require a stable operation identifier and test local adapter deduplication; persisted enforcement remains a later backend acceptance gate.
- [Workspace switching leaks prior bakery data] -> Key the provider by validated `bakeryId`, discard the old snapshot synchronously, show loading/empty states, and test two deterministic bakery fixtures.
- [URL direct entry bypasses auth or bakery selection] -> Keep routes inside the existing authenticated/selected bakery boundary and test unauthenticated and unselected entry paths.
- [Browser history loses an unsaved form] -> Route all navigation and workspace exit actions through the shared guard and cover back, switch, logout, close, and unload behavior.
- [Offline detection is unreliable] -> Use offline language only with explicit connectivity evidence and keep ordinary errors distinct.
- [Tests pass but the F1 cross-screen gate still fails] -> Return the change to apply, record the failing screen and source/projection, and do not sync or archive until the full browser journey passes.
- [A later backend adapter cannot satisfy a frontend port without broadening scope] -> Return to propose/update in that later owning change; do not hide persistence or authorization changes inside this foundation.

## Migration Plan

1. Confirm proposal approval, update `openspec/PROGRAM_MAP.md` in an orchestrator-owned planning pass, and record the active workspace change's current `App.tsx` contract before implementation.
2. Add canonical domain types, deterministic bakery-scoped fixtures, adapter ports, the session-local adapter, request/error types, and pure tests in new files.
3. Add the reducer/provider, application commands, selectors, and cross-screen projection tests in new files.
4. Add the route registry, request/recovery components, unsaved-change guard, and focused route/state tests without changing the active workspace code.
5. After the workspace owner confirms the boundary is stable, use one integration owner to extract the bakery workspace and feature screens, wire the provider and routes below the existing auth/workspace gate, and remove duplicate screen-owned domain collections.
6. Preserve the local-vs-persisted messaging and verify bakery switch/logout synchronously clear mounted domain state.
7. Run focused tests, then `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build`, and the F1 Playwright journey on desktop and mobile.
8. If any gate fails, record the evidence and return to apply for implementation/test failures or proposal/update for a changed boundary or product decision. Synchronize the new capability and archive only after specs, tasks, verification, and the program map agree.

Rollback before release is a normal source revert of the F1 modules and integration edits. There is no domain data migration to roll back. Because the local adapter is session-only, rollback must not touch Supabase workspace data or the active change's migrations.

## Resolved implementation decisions

- The canonical workspace URL prefix is `/app/...`; the registry isolates feature modules from this prefix.
- Unsaved-change confirmation reuses the current alert-dialog visual treatment and preserves the shared guard contract.
- The F1 Playwright gate uses an existing customer and verifies that customer's derived order history and totals, avoiding F5 inline-customer-creation scope.
