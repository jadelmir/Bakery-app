## Why

Frontend Phase 1 — Shared Application Foundation remains incomplete even though the runtime and aligned prototype baselines are synchronized. The current implementation keeps most bakery-domain fixture collections, screen components, navigation state, and selected mutations inside the approximately 1,800-line `Front-end/src/app/App.tsx`. Creating an order updates the local Orders and Production inputs, but Dashboard, Inventory, Customers, and Finances still read independent constants or calculations and therefore cannot satisfy the F1 completion gate that one local order or task update appear across all affected screens without a refresh.

This change is the owning change for the remaining F1 shared-data, adapter, navigation, request-state, and decomposition coverage recorded as unmapped in `openspec/PROGRAM_MAP.md`. It is a prerequisite for F3 Ingredients and Stock Entry, F4 Recipe Management, F5 Customer Management, and F6 Orders and Payments: those phases need one stable frontend domain boundary before separate feature work can safely proceed without recreating incompatible stores, types, or persistence assumptions.

## What Changes

- Establish one bakery-scoped application data layer for the local bakery-domain records and derived views used by Dashboard, Orders, Production, Inventory, Customers, Recipes, and Finances.
- Define feature-facing adapter contracts for loading and mutating bakery-domain state, including explicit bakery identity, async request outcomes, retry behavior, and deterministic local adapters for development and tests.
- Route commands such as local order creation and production-task updates through the shared data layer so every dependent screen recomputes from the same normalized source without a refresh.
- Introduce URL-based workspace navigation with a route-to-screen registry that preserves authenticated and active-bakery boundaries, supports direct links and browser history, and gives later phases stable feature entry points.
- Provide reusable loading, error, empty, connection-loss, retry, and unsaved-change contracts and presentation boundaries instead of screen-specific ad hoc handling.
- Decompose the bakery workspace below the authenticated workspace boundary: keep `App.tsx` responsible for session/workspace composition, move route and feature composition into bounded modules, and expose feature state through selectors and commands rather than shared mutable screen props.
- Add focused state, adapter, route, and integration tests proving that representative local order and task mutations update Dashboard, Orders, Production, Inventory, Customers, and Finances from one source of truth.
- Treat the active `add-multi-store-workspaces` change as the sole owner of Supabase Auth, bakery selection, membership, invitation, role, tenant-isolation, and workspace-security behavior. Foundation integration begins from that boundary and must not duplicate or weaken its active delta.
- Keep bakery-domain records local for this change. Supabase persistence, schema, migrations, generated database types, RLS, hosted rollout, and authoritative adapters for ingredients, recipes, customers, orders, payments, inventory, and reporting remain owned by their later backend/domain phases.

## Capabilities

### New Capabilities

- `shared-application-foundation`: Defines bakery-scoped shared domain state, feature adapter and request-state contracts, URL navigation, cross-screen reactive projections, and application-shell decomposition for PRD F1.

### Modified Capabilities

- None. The synchronized `frontend-runtime-verification` and `frontend-prototype-alignment` capabilities remain prerequisites and evidence inputs; this change adds the missing F1 capability without reopening their immutable source archives.

## Impact

- Roadmap and dependencies: owns remaining PRD F1 coverage and is a directional prerequisite for F3-F6 and, through those phases, later operational and reporting work. `openspec/PROGRAM_MAP.md` must be updated by the orchestrator in its authorized planning/integration pass because this proposal agent does not own that file.
- Active-change coordination: `add-multi-store-workspaces` retains exclusive ownership of authentication, workspace selection/switching, team management, and persisted workspace state. Any overlap in `App.tsx` must be serialized: first establish or reconcile the active workspace boundary, then decompose the mounted `BakeryWorkspace` below it.
- Expected frontend surfaces: `Front-end/src/app/App.tsx`, new application/domain/route/state modules below `Front-end/src/app/`, extracted feature screen modules, and focused unit/integration/browser tests.
- Data boundary: Auth sessions, bakeries, memberships, invitations, and default-bakery preferences may remain Supabase-backed through the workspace adapters. Bakery-domain fixtures and mutations introduced here remain explicit local development/test state scoped by `bakeryId`; they are not evidence of persistence, tenant RLS, synchronization, or hosted durability.
- No migrations, Supabase schema or policy changes, domain CRUD completeness, scheduling-engine expansion, financial/accounting rules, production deployment, or hosted data migration are included.
