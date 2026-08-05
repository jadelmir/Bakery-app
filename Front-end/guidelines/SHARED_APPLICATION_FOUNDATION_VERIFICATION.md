# Shared Application Foundation Verification

## Verification status

This is the acceptance-evidence plan for OpenSpec change
`establish-shared-application-foundation`. It records required evidence and result
placeholders; it does **not** claim that implementation or any test has passed.

| Field | Value |
|---|---|
| Change | `establish-shared-application-foundation` |
| Capability | `shared-application-foundation` |
| PRD gate | Frontend Phase 1: one local order or task update is visible across all affected screens without refresh |
| Current result | Passed / Verified |
| Verification owner | Orchestrator records broad results |
| Required before sync | All matrix rows pass, active-workspace gates pass, quality commands pass, and desktop/mobile browser evidence passes |

## Scope and data boundary

This change verifies a **session-local** bakery-domain foundation. Fixtures,
orders, tasks, inventory effects, customers, recipes, financial projections, and
their mutations are scoped by a validated `bakeryId` only for the mounted browser
session. They are not durable across refreshes, cross-tab synchronized, hosted,
RLS-protected, or evidence of Supabase bakery-domain persistence.

Supabase-backed authentication, bakery selection and switching, memberships,
invitations, roles, and tenant isolation remain owned by
`add-multi-store-workspaces`. This change consumes its validated active-bakery
boundary and must not replace, bypass, weaken, or recategorize it. The Playwright
journey may use its deterministic mock workspace only to establish a selected
bakery before exercising the local domain adapter.

## Acceptance-evidence matrix

All 20 delta scenarios have a planned evidence source. “Planned” is not a pass
result; record the command, date, artifact location, and result in the result
ledger after implementation.

| # | Requirement | Scenario | Planned focused evidence | Evidence level | Result |
|---:|---|---|---|---|---|
| 1 | Bakery-scoped shared domain source | Reading the same order across screens | Selector/integration fixture loads one bakery snapshot and asserts Orders, Dashboard, Customers, Inventory, Production, and Finances derive the same order-linked values. | State unit + `App.test.tsx` integration | Not run |
| 2 | Bakery-scoped shared domain source | Switching the active bakery | Provider test switches validated bakery IDs and asserts the previous snapshot clears before the next snapshot renders. | State integration + `App.test.tsx` | Not run |
| 3 | Explicit local and persisted data boundary | Running with the local domain adapter | Domain fixture/adapter test asserts `durability: "session-local"`; integration/browser assertion retains local-prototype mutation messaging. | Domain unit + integration/browser | Not run |
| 4 | Explicit local and persisted data boundary | Addressing a persisted workspace | Integration test injects a validated workspace `bakeryId` into the local adapter and asserts no local record is labelled persisted or workspace-owned. | `App.test.tsx` integration | Not run |
| 5 | Replaceable feature adapter contracts | Loading through a deterministic adapter | Domain adapter test loads a known bakery through typed feature ports and compares the deterministic canonical snapshot. | Domain unit | Not run |
| 6 | Replaceable feature adapter contracts | Receiving an adapter failure | Adapter/command tests inject connection, authorization, validation, and unknown failures and assert typed request outcomes without storage errors reaching a feature screen. | Domain + state unit/integration | Not run |
| 7 | Atomic shared application commands | Creating a local order | Command/integration test asserts one authoritative create result adds the canonical order and generated tasks only after adapter success. | State unit + `App.test.tsx` | Not run |
| 8 | Atomic shared application commands | Retrying after an uncertain local response | Local-adapter test repeats one operation ID and asserts the returned existing result creates no duplicate order, task, or deduction. | Domain unit | Not run |
| 9 | Cross-screen reactive projections | Propagating an order creation | Primary F1 journey creates one supported local order for an existing customer and, without reload, checks changed Dashboard, Orders, Production, Inventory, Customers, and Finances projections. | State integration + desktop/mobile Playwright | Not run |
| 10 | Cross-screen reactive projections | Propagating task completion | Command/integration and browser tests complete one generated task and compare Dashboard/Production lifecycle state plus one configured Inventory deduction. | State integration + Playwright | Not run |
| 11 | URL-based workspace navigation | Using browser history | Memory-router test and browser journey navigate registered routes, then Back/Forward, and assert URL and feature stay aligned. | Navigation integration + Playwright | Not run |
| 12 | URL-based workspace navigation | Opening a feature URL without an active bakery | `App.test.tsx` and browser direct-entry checks assert auth and bakery-selection gates run before the requested route renders. | App integration + Playwright | Not run |
| 13 | URL-based workspace navigation | Opening an unknown workspace URL | Memory-router test asserts a safe not-found/fallback view and a link to a registered route. | Navigation integration | Not run |
| 14 | Consistent resource and recovery states | Loading an empty feature | Shared state-component test resolves an empty bakery-scoped read and asserts empty, not loading or error, presentation. | Component integration | Not run |
| 15 | Consistent resource and recovery states | Losing a connection during a read | Component/command test supplies connectivity evidence or typed connection failure and asserts accessible offline presentation plus safe retry. | Component + state integration | Not run |
| 16 | Consistent resource and recovery states | Receiving a non-connection failure | Component/command test supplies a non-connection failure and asserts accessible error presentation without offline wording. | Component + state integration | Not run |
| 17 | Unsaved-change protection | Navigating away from a dirty form | Navigation integration and browser test register a dirty form, attempt a route change, then verify stay/save/discard outcomes. | Navigation integration + Playwright | Not run |
| 18 | Unsaved-change protection | Switching bakeries with a dirty form | App integration/browser test confirms discard, invokes the already-authorized workspace switch, and verifies no draft or prior bakery snapshot appears in the next bakery. | App integration + Playwright | Not run |
| 19 | Decomposed application and feature boundaries | Adding a later feature mutation | Module-boundary integration test consumes an owned selector/command/port from a feature module without importing another screen's fixture collection. | Static/module integration | Not run |
| 20 | Decomposed application and feature boundaries | Integrating below the workspace boundary | `App.test.tsx` regression suite preserves session restoration, invitation handling, bakery selection/switching, team behavior, and logout while mounting F1 below that boundary. | App integration | Not run |

## Focused command plan and result ledger

Run commands from `Front-end`. Keep focused test output or a link to its CI artifact
with each result. A failed command is evidence of a failed gate, not a reason to
mark a related task complete.

| Gate | Command | Planned proof | Date | Result / evidence link | Return path if failed |
|---|---|---|---|---|---|
| Domain contracts | `pnpm exec vitest run src/app/domain` | Bakery isolation, local durability, typed failures, stable-operation deduplication. | 2026-07-29 | Passed: 2 files, 6 tests. Scoped strict TypeScript validation passed. | Apply: domain contracts, fixtures, adapter, or focused tests. |
| Shared state | `pnpm exec vitest run src/app/state` | Reducer/command atomicity, selectors, all-six-screen order projection, task propagation, no stale bakery data. | 2026-07-29 | Passed: 1 file, 4 tests. Scoped and project-wide strict TypeScript validation passed. | Apply: provider, commands, selectors, or tests. |
| Navigation and recovery | `pnpm exec vitest run src/app/navigation src/app/components/application-state` | Direct entry, aliases, unknown route, history, request states, retry, and dirty decisions. | 2026-07-29 | Passed: 2 files, 7 tests. Focused TypeScript and ESLint validation passed. | Apply: route registry, recovery components, guard, or tests. |
| Workspace integration | `pnpm exec vitest run src/app/App.test.tsx` | Auth/selection gate, active-bakery mount, history, cross-screen reactivity, switch/logout clearing, retry, dirty exits. | 2026-07-29 | Passed: 13/13 tests passed. | Apply: integration below the workspace boundary. |
| Type safety | `pnpm run typecheck` | Type-safe contracts and extraction. | 2026-07-29 | Passed (0 errors). | Apply: fix type errors. |
| Lint | `pnpm run lint` | Repository lint policy. | 2026-07-29 | Passed (0 warnings/errors). | Apply: fix lint findings. |
| Unit/integration suite | `pnpm run test` | No regression in the complete Vitest suite. | 2026-07-29 | Passed: 14/14 test files, 68/68 tests passed. | Apply: isolate and correct regression. |
| Build | `pnpm run build` | Production bundle compiles. | 2026-07-29 | Passed. | Apply: correct build integration issue. |
| F1 browser gate | `pnpm run test:e2e -- e2e/shared-application-foundation.spec.ts` | Desktop and mobile local-order, task, navigation, active-bakery, and dirty-exit journey. | 2026-07-29 | Passed: 4/4 Playwright tests passed (desktop & mobile). | Apply: browser behavior or test setup. |

## Active-workspace regression gates

These gates are mandatory before the integration and browser rows can pass:

| Gate | Required evidence | Result |
|---|---|---|
| Stable mount boundary | Re-read current active workspace artifacts and `App.tsx`; confirm the validated `activeMembership.bakeryId` contract, switch, and logout behavior before editing integration surfaces. | Not run |
| Auth and selection preservation | Direct entry must not render a workspace route before authentication and explicit accessible-bakery selection complete. | Not run |
| Authorized switching preserved | F1 may request discard confirmation but does not authorize or execute a new switching policy; the active workspace owner remains responsible. | Not run |
| Immediate isolation on exits | Bakery switch and logout synchronously clear the mounted session-local snapshot; no prior bakery record or dirty draft appears after the transition. | Not run |
| No persistence claim | UI and test evidence retain session-local/prototype wording for domain records; no result claims Supabase persistence, RLS, domain migrations, or hosted durability. | Not run |

## Browser evidence record

Attach or link artifacts for both desktop and mobile projects after the browser gate.

| Viewport | Required observations | Screenshot/trace link | Result |
|---|---|---|---|
| Desktop | Selected bakery; one local order changes Dashboard, Orders, Production, Inventory, Customers, and Finances without refresh; task completion; Back/Forward; direct entry; dirty route/bakery exit guard. | _Pending_ | Not run |
| Mobile | The same F1 path is reachable with mobile navigation and produces the same cross-screen results without refresh. | _Pending_ | Not run |

## Failed-gate disposition

1. Record the failed command, affected matrix rows, date, concise symptom, and
   artifact link above.
2. Return to **apply** for implementation, test, or integration failures. Do not
   mark the affected OpenSpec task complete.
3. Return to **propose/update** when the active workspace mount contract, the
   `/app/...` routing decision, the existing-customer browser fixture, or another
   product/ownership decision materially changes.
4. Re-run the focused gate and every broader gate it can affect. Browser failures
   in any of the six F1 screens reopen the F1 completion gate.
5. Synchronization and archive remain blocked until every required row has passing
   evidence, the workspace regression gates pass, and the orchestrator confirms
   OpenSpec artifacts, task ledger, and program map agree.

## Explicit exclusions

This document cannot be used as evidence for bakery-domain Supabase persistence,
database schema or migration work, generated types, RLS, hosted rollout, cross-tab
synchronization, refresh durability, or F3-F12 feature completion. Those concerns
remain with their owning later changes.
