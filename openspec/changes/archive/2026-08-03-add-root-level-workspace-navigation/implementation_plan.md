# Implementation Plan: Add Root-Level Workspace Navigation

request_feedback: true

## Objective

Make every primary authenticated bakery destination independently addressable
through canonical root-level URLs, with URL-driven desktop/mobile navigation,
browser history, direct-entry gating, legacy redirects, and focused responsive
evidence. Preserve all existing feature behavior and public/auth routes.

## OpenSpec Change

`add-root-level-workspace-navigation`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/shared-application-foundation/spec.md`
- `tasks.md`

## Execution Preconditions

- Resolve ownership and sequencing with `persist-manual-orders`,
  `add-manual-order-status-transitions`, and
  `repair-authentication-account-flows` before editing `App.tsx`,
  `BakeryWorkspace.tsx`, or shared browser tests.
- Use only local synthetic/mock data; no database migration or linked/production
  operation is in scope.
- Stop for a product decision if the requested paths expand to public customer
  URLs, bakery IDs in URLs, deployment rewrites, or a change to auth/workspace
  authorization.

## Workstream 1 - Route contract and outlet

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 1.1-1.4
- Exclusive writable ownership:
  - `Front-end/src/app/navigation/routeRegistry.ts`
  - `Front-end/src/app/navigation/WorkspaceRoutes.tsx`
  - `Front-end/src/app/navigation/navigation.test.tsx`
- Deliverable: a complete canonical route registry, legacy aliases, utility
  route definitions, fallback behavior, and focused route tests.
- Must not change: `App.tsx`, `BakeryWorkspace.tsx`, navigation chrome,
  feature screens, public-view matching, or order/auth behavior.
- Verification: focused navigation Vitest tests.
- Stop when: route IDs or utility-route semantics require a new product
  decision, or the active shell changes the router contract.

## Workstream 2 - Navigation chrome

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 2.1-2.2
- Exclusive writable ownership:
  - `Front-end/src/app/navigation/Sidebar.tsx`
  - `Front-end/src/app/navigation/BottomNav.tsx`
  - `Front-end/src/app/screens/MoreScreen.tsx`
- Deliverable: URL-aware, guarded navigation controls with correct active
  states for desktop, mobile, More, and nested utility destinations.
- Must not change: workspace data commands, screen business logic, public paths,
  `BakeryWorkspace.tsx`, or `App.tsx`.
- Dependency: consume the route contract from Workstream 1; integrate after
  its route IDs and paths are reviewed.
- Verification: focused component tests or existing navigation tests plus a
  typecheck of changed modules.
- Stop when: a control requires changing the central workspace mount or an
  unsaved-form exit path cannot use the existing guard.

## Workstream 3 - Authenticated workspace integration

- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 3.1-3.4
- Exclusive writable ownership:
  - `Front-end/src/main.tsx`
  - `Front-end/src/app/App.tsx`
  - `Front-end/src/app/BakeryWorkspace.tsx`
  - `Front-end/src/app/types.ts` (route/screen mapping section only)
  - focused `Front-end/src/app/App.test.tsx` route sections only
- Deliverable: router mount and workspace route composition below the existing
  auth/selection boundary, URL-derived feature rendering, guarded route
  callbacks, utility route wiring, and preserved public/auth behavior.
- Must not change: Supabase adapters/migrations, order/invoice business logic,
  active membership authorization, or unrelated active-change behavior.
- Dependency: serialize after Workstreams 1 and 2, and after central-file
  ownership handoff from active order/auth changes.
- Verification: focused App/workspace Vitest tests, typecheck, and direct-entry
  checks in local mock mode.
- Stop when: routing requires changing auth callbacks, membership semantics,
  public URL formats, or active order-flow ownership.

## Workstream 4 - Responsive browser evidence

- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Task IDs: 4.1-4.2
- Exclusive writable ownership:
  - `Front-end/e2e/navigation-routes.spec.ts` (new file only)
- Deliverable: desktop/mobile coverage for all canonical primary routes, direct
  entry, refresh, browser history, active navigation, legacy redirects, public
  path preservation, and unknown-path fallback.
- Must not change: existing order-flow tests in `Front-end/e2e/app.spec.ts`,
  authentication specs, or application source.
- Dependency: run against the merged Workstreams 1-3 implementation.
- Verification: `pnpm run test:e2e -- e2e/navigation-routes.spec.ts`.
- Stop when: a failure indicates an auth/order regression outside route scope;
  record it for the orchestrator rather than editing unrelated tests.

## Workstream 5 - Integration and lifecycle evidence

- Owner: orchestrator; serialized after Workstreams 1-4
- Model: `gpt-5.6-sol`
- Reasoning effort: `high`
- Task IDs: 5.1-5.2
- Exclusive writable ownership:
  - `openspec/changes/add-root-level-workspace-navigation/`
  - `openspec/PROGRAM_MAP.md`
- Deliverable: ownership-conflict review, integrated verification, manual
  responsive acceptance record, coherent task/spec/map state, and sync
  readiness assessment.
- Must not change: implementation files owned by Workstreams 1-4, linked or
  production state, historical OpenSpec archives, or unrelated active changes.
- Stop when: any canonical route, auth gate, legacy redirect, browser-history,
  dirty-form, or responsive acceptance criterion fails; return to apply and
  record the exact evidence.

## Verification Plan

From `Front-end`, run focused checks first, then the frontend baseline:

```text
pnpm exec vitest run src/app/navigation/navigation.test.tsx
pnpm exec vitest run src/app/App.test.tsx
pnpm run test:e2e -- e2e/navigation-routes.spec.ts
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Manual acceptance must cover direct entry to `/home`, `/orders`, and
`/invoices`, plus each other primary destination, desktop and mobile active
states, Back/Forward, refresh, a legacy `/app/...` redirect, an unknown path,
and unchanged public `/invoice/:token` and `/store/:slug` behavior. Hosted
history-rewrite support remains an external release gate.

## Ownership Validation

The planned concurrent ownership sets are disjoint. Workstream 3 is serialized
behind Workstreams 1-2 and the active central-shell ownership handoff;
Workstream 4 is serialized behind the merged route integration. Run
`findOwnershipConflicts()` against the assignment objects before spawning
implementation agents and require zero conflicts.

## Approval Gate

The user approved execution by invoking `/orch
add-root-level-workspace-navigation`. Implementation is complete for the
automated acceptance scope; manual product acceptance remains before the
change can be marked verified, synchronized, or archived.

## Execution Evidence (2026-08-03)

- Workstream 1 delivered canonical primary and utility routes, explicit
  `/app/...` aliases, safe fallback behavior, and 6/6 focused navigation tests.
- Workstream 2 converted desktop/mobile/More navigation to guarded URL-driven
  controls and passed typecheck plus the focused navigation suite.
- Workstream 3 integrated route rendering below the existing auth and bakery
  selection boundary, preserved public invoice/storefront handling, and passed
  focused App/navigation tests (32/32).
- Workstream 4 added `e2e/navigation-routes.spec.ts`; desktop/mobile Playwright
  coverage passed 12/12.
- Integrated frontend verification passed: typecheck, zero-warning lint,
  Vitest 188/188, production build, and the complete responsive Playwright
  suite (66/66, including the existing order and bakery-switch journeys).
- Manual product acceptance and archive remain separate lifecycle gates; hosted
  history-rewrite configuration remains an external release concern.
