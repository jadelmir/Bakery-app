All tasks are unchecked until their focused evidence passes. Local implementation evidence in this change does not claim bakery-domain persistence or hosted rollout. When multi-agent execution is explicitly requested, the named lanes below have exclusive, non-overlapping files; the orchestrator alone integrates, updates shared planning documents, runs broad verification, and marks tasks complete.

## 1. Confirm prerequisites, decisions, and ownership

- [x] 1.1 [Orchestrator planning ownership: `openspec/PROGRAM_MAP.md`] Register `establish-shared-application-foundation` as the owner of remaining F1 coverage, record F1 -> F3/F4/F5/F6 directional prerequisites, and keep `add-multi-store-workspaces` as the sole owner of Auth/workspace/security scope; evidence is a reviewed program-map diff matching proposal dependencies.
- [x] 1.2 [Verification lane exclusive: `Front-end/guidelines/SHARED_APPLICATION_FOUNDATION_VERIFICATION.md`] Create an acceptance-evidence matrix mapping every `shared-application-foundation` requirement and scenario to its focused unit, integration, or browser evidence, and state that domain data remains session-local; evidence is a complete matrix with no scenario left unmapped.
- [x] 1.3 [Orchestrator decision gate] Approve the canonical workspace URL prefix, shared unsaved-change dialog treatment, and existing-customer F1 browser fixture, or update the design before implementation; stop rather than allowing an implementation lane to make a product or routing decision implicitly.
- [x] 1.4 [Integration owner read-only checkpoint] Re-read the active `add-multi-store-workspaces` proposal, design, specs, tasks, and current `App.tsx`; confirm the validated `activeMembership.bakeryId` mount/switch/logout contract is stable and that no concurrent owner will edit `App.tsx`, otherwise return to proposal/update.

## 2. Define bakery-domain contracts and the session-local adapter

The domain-contract lane exclusively owns `Front-end/src/app/domain/types.ts`, `fixtures.ts`, `adapters.ts`, `localAdapter.ts`, and their colocated tests. It must not edit `App.tsx`, feature screens, Auth/workspace modules, Supabase files, or migrations.

- [x] 2.1 [Domain-contract lane] Define the minimal normalized `BakeryDomainSnapshot`, stable entity relationships, request/error types, data-source durability descriptor, and composed feature-port contracts needed by current order/task behavior; this satisfies Bakery-scoped shared domain source, Explicit local and persisted data boundary, and Replaceable feature adapter contracts.
- [x] 2.2 [Domain-contract lane] Move current bakery-domain examples into deterministic fixtures keyed by at least two bakery IDs without adding future F3-F6 schema fields or persisting records; evidence is a focused fixture test showing different bakery snapshots and `session-local` durability.
- [x] 2.3 [Domain-contract lane] Implement the session-local adapter with bakery-scoped snapshot loads, authoritative create-order/task-update results, typed failures, and stable-operation deduplication for orders, generated tasks, and deductions; this satisfies Replaceable feature adapter contracts and Atomic shared application commands.
- [x] 2.4 [Domain-contract lane] Add focused adapter tests covering valid loads, unknown bakery isolation, two-bakery separation, typed connection versus ordinary errors, and repeated operation IDs; run `pnpm exec vitest run src/app/domain` from `Front-end` and retain the passing result in the verification matrix.

## 3. Build the shared provider, commands, and reactive selectors

After task 2.1 stabilizes exported contracts, the application-state lane exclusively owns `Front-end/src/app/state/**`. It consumes but does not edit `domain/**`, route/recovery files, feature screens, or `App.tsx`.

- [x] 3.1 [Application-state lane] Implement the immutable reducer and bakery-keyed provider so changing `bakeryId` discards the prior snapshot before the next load and exposes idle, loading, ready, empty, error, and evidenced-offline outcomes; this satisfies Bakery-scoped shared domain source and Consistent resource and recovery states.
- [x] 3.2 [Application-state lane] Implement shared load, create-order, and task-update commands that call the feature ports, commit one authoritative result after success, preserve the original operation ID for retries, and leave the snapshot unchanged after failure; this satisfies Atomic shared application commands.
- [x] 3.3 [Application-state lane] Implement pure Dashboard, Orders, Production, Inventory, Customers, Recipes, and Finances selectors from the canonical snapshot, reusing `production.ts`, `planning.ts`, and `reporting.ts` calculations instead of copying their rules; this satisfies Bakery-scoped shared domain source and Cross-screen reactive projections.
- [x] 3.4 [Application-state lane] Add focused reducer/command/selector tests proving an order creation changes all six F1 gate projections without refresh, a task completion changes Dashboard/Production and any configured Inventory deduction once, failures do not partially commit, and a bakery switch exposes no old data; run `pnpm exec vitest run src/app/state`.

## 4. Build routing, recovery, and unsaved-change primitives

After task 1.3 resolves the route decision, the navigation/recovery lane exclusively owns `Front-end/src/app/navigation/**` and `Front-end/src/app/components/application-state/**`. It must not edit `App.tsx`, `App.test.tsx`, feature screens, domain/state modules, or workspace modules.

- [x] 4.1 [Navigation/recovery lane] Define the declarative workspace route registry, canonical paths and aliases, safe unknown-route fallback, and route helpers using the existing React Router dependency; this satisfies URL-based workspace navigation.
- [x] 4.2 [Navigation/recovery lane] Implement reusable accessible pending, empty, error, offline, and retry presentation components that describe a connection loss only when the request state contains connectivity evidence; this satisfies Consistent resource and recovery states.
- [x] 4.3 [Navigation/recovery lane] Implement the dirty-form registration and navigation guard contract for in-app navigation, dismiss, bakery switch, logout, and browser unload without moving draft values into canonical domain state; this satisfies Unsaved-change protection.
- [x] 4.4 [Navigation/recovery lane] Add focused memory-router and component tests for direct entry, Back/Forward, aliases, unknown paths, all request-state presentations, safe retry, and stay/discard outcomes; run `pnpm exec vitest run src/app/navigation src/app/components/application-state`.

## 5. Decompose and integrate the bakery workspace

This group is serialized after tasks 1.4, 2.4, 3.4, and 4.4. One integration owner exclusively owns `Front-end/src/app/App.tsx`, `App.test.tsx`, `Front-end/src/app/application/**`, and `Front-end/src/app/features/**` for the duration of extraction. It may consume but must not edit the other lanes' files. It must not change `AuthScreen.tsx`, `auth.ts`, `workspace.ts`, `WorkspaceSelector.tsx`, `TeamManagement.tsx`, `InvitationLanding.tsx`, `Front-end/src/lib/supabase/**`, or `Front-end/supabase/**`.

- [x] 5.1 [Integration owner] Extract workspace chrome, route composition, shared presentation pieces, and current bakery-domain screens below the existing authenticated active-bakery boundary while leaving `App.tsx` responsible for session/workspace entry; this satisfies Decomposed application and feature boundaries.
- [x] 5.2 [Integration owner] Mount the bakery-domain provider with the validated `activeMembership.bakeryId`, inject the session-local adapter, and preserve synchronous clearing on bakery switch and logout without changing workspace authorization behavior; this satisfies Bakery-scoped shared domain source and Explicit local and persisted data boundary.
- [x] 5.3 [Integration owner] Replace `Screen` component state and sidebar/mobile callbacks with the route registry, preserve auth and explicit bakery selection before direct-entry rendering, and wire all exits through the unsaved-change guard; this satisfies URL-based workspace navigation and Unsaved-change protection.
- [x] 5.4 [Integration owner] Replace screen-owned `ORDERS`, `TASKS`, `CUSTOMERS`, `INVENTORY`, `RECIPES`, and finance reads and mutations with selector/command hooks, then remove only the duplicate collections proven unused; this satisfies Bakery-scoped shared domain source and Cross-screen reactive projections.
- [x] 5.5 [Integration owner] Preserve visible session-local/prototype messaging and integrate standardized loading, empty, error, offline, and retry states without implying Supabase domain persistence; this satisfies Explicit local and persisted data boundary and Consistent resource and recovery states.
- [x] 5.6 [Integration owner] Update `App.test.tsx` with integration coverage for auth/selection-gated direct entry, browser history, one-order cross-screen propagation, task completion propagation, two-bakery clearing, adapter failure/retry, and dirty-form route/switch/logout protection; run `pnpm exec vitest run src/app/App.test.tsx`.

## 6. Prove the F1 completion gate

The browser-verification lane may add only `Front-end/e2e/shared-application-foundation.spec.ts` and report results to the orchestrator; only the verification-document owner edits `Front-end/guidelines/SHARED_APPLICATION_FOUNDATION_VERIFICATION.md`.

- [x] 6.1 [Browser-verification lane] Add a deterministic Playwright journey that enters a selected mock bakery, creates one supported local order for an existing customer, and verifies changed Dashboard, Orders, Production, Inventory, Customers, and Finances values without a page refresh; this is the primary Cross-screen reactive projections acceptance evidence.
- [x] 6.2 [Browser-verification lane] Extend that journey to complete a generated task, verify shared task/inventory results, exercise direct entry and Back/Forward, prove an unselected session cannot bypass bakery selection, and confirm a dirty draft blocks route and bakery exits.
- [x] 6.3 [Orchestrator verification] Run `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build` from `Front-end`; record command, date, result, and any failed return-to-apply action in the verification document.
- [x] 6.4 [Orchestrator verification] Run `pnpm run test:e2e -- e2e/shared-application-foundation.spec.ts` against desktop and mobile projects, record screenshots/traces or textual evidence for every F1 gate screen, and return to apply for any inconsistent projection, route, recovery, or unsaved-change behavior.

## 7. Reconcile documentation and lifecycle evidence

This change contains local frontend implementation and documentation tasks only. It has no Supabase migration, generated-type, RLS, domain-persistence, or hosted-rollout task; those remain with later backend/domain changes.

- [x] 7.1 [Orchestrator documentation ownership: `Front-end/guidelines/REQUIREMENTS_AUDIT.md`] Update the application-shell, cross-screen finding, Phase 1, and loading/error/offline entries to cite verified shared-data and routing behavior while retaining all session-local and later-phase gaps.
- [x] 7.2 [Verification-document owner] Complete `SHARED_APPLICATION_FOUNDATION_VERIFICATION.md` with focused results, full quality-gate results, browser evidence, local-versus-persisted limits, active-workspace regression evidence, and any failed-gate return path.
- [x] 7.3 [Orchestrator OpenSpec ownership] Review proposal, design, delta spec, tasks, implementation, evidence, and `PROGRAM_MAP.md` together; mark a task complete only where its acceptance evidence exists, and run strict validation for `establish-shared-application-foundation`.
- [x] 7.4 [Orchestrator lifecycle ownership] Synchronize the verified `shared-application-foundation` delta and update program state only after the F1 completion gate passes; do not archive if any required source, evidence, active-workspace regression check, or planning reconciliation remains incomplete.




