## 1. Staging prerequisites and ownership

- [x] 1.1 Record that the currently signed-in staging identity and active bakery
  are the authorized acceptance boundary, identify the approved invitee mailbox
  contract if available, and record any required GitHub/Supabase secrets without
  placing values in the repository. (Evidence: the active hosted browser session
  showed the signed-in owner role in the J’adore bakery; `jad.em@outlook.com` was
  supplied as the invitee mailbox; secret names only are documented in
  `frontend-ci-cd.md`.)
- [x] 1.2 Build a readiness matrix mapping each hosted journey to its owning
  OpenSpec change, required migration/function, persisted/local boundary, and
  acceptance status; do not claim coverage for undeployed capabilities. (Evidence:
  `docs/deployment/frontend-ci-cd.md` contains the hosted journey readiness
  matrix and explicitly leaves undeployed/public-mailbox gates pending.)
- [x] 1.3 Define the staging concurrency and cleanup policy for the shared active
  bakery, including read-only defaults, run-scoped mutation prefixes, the
  server-side credential boundary, and recovery for failed cleanup. (Evidence:
  the change design and hosted workflow serialize access, keep the implemented
  suite read-only, and prohibit service-role credentials in browser artifacts.)

## 2. Hosted base-path and public-route correctness

- [x] 2.1 Make public storefront, public invoice, and password-recovery route
  detection resolve router paths beneath `/Bakery-app/` while preserving local
  root-path behavior. (Evidence: `browserRoutePath` now normalizes the hosted
  pathname before public-route detection in `App` and `PublicStorefront`.)
- [x] 2.2 Make generated storefront links, invoice links, and recovery redirects
  derive from the configured deployment base path rather than the bare origin.
  (Evidence: storefront, invoice, and password-recovery URLs now use `appUrl`.)
- [x] 2.3 Add focused local route/link regression tests for root and non-root base
  paths, including public route isolation from the authenticated shell. (Evidence:
  `appUrl.test.ts` and the hosted-path recovery assertion pass: 18 focused tests;
  the existing `App.test.tsx` public/auth route suite also passes: 27 tests.)
- [ ] 2.4 Verify the hosted root, canonical workspace deep links, public links,
  and recovery callback manually before adding them as release gates. (Evidence:
  current staging root and `/home`/`/orders` are reachable; the deployed
  `/Bakery-app/store/jadore-bakery` still renders the workspace Page not found
  fallback, so this gate remains open until the base-path fix is deployed.)

## 3. Hosted Playwright harness and data lifecycle

- [x] 3.1 Add a dedicated staging Playwright configuration and package script
  using `E2E_BASE_URL`, real Supabase runtime variables, no `webServer`, explicit
  desktop/mobile projects, and serialized hosted execution. (Evidence:
  `playwright.staging.config.ts` has no `webServer`, uses one worker, and defines
  desktop/mobile projects; `test:e2e:staging` is registered.)
- [ ] 3.2 Add a staging setup/preflight that authenticates the current authorized
  staging identity,
  confirms required routes and deployed schema/function readiness, and fails
  with named prerequisites instead of enabling mock adapters. (Evidence: the
  current runner fails with the named missing `E2E_STAGING_EMAIL` and
  `E2E_STAGING_PASSWORD` prerequisites; schema/function readiness is not yet
  claimed.)
- [ ] 3.3 Add run-scoped record factories for customer, recipe, order, inventory,
  production-flow, invoice, and invitation data, constrained to the currently
  authorized active bakery; do not create a new bakery in this change.
- [ ] 3.4 Add secure cleanup and failure-recovery helpers using supported UI/RPC
  paths first; use service-role cleanup only if separately approved for the
  staging environment, and verify no secret reaches browser bundles,
  screenshots, traces, or logs.

## 4. Hosted feature journeys

- [ ] 4.1 Add authenticated Auth/session/workspace journeys covering login,
  reload, logout, direct protected routes, active-bakery selection, and
  tenant-isolated reads plus run-scoped mutations. (Requirements: hosted
  authentication and workspace acceptance, staging data isolation)
- [ ] 4.2 Add persisted order/customer/recipe journeys covering mutation,
  immediate rendering, reload hydration, and cleanup only for deployed owning
  changes. (Requirement: persisted critical feature journeys)
- [ ] 4.3 Add persisted inventory and production-flow journeys covering stock
  mutation, generated requirements, flow save/reload, and cleanup only after the
  relevant staging migrations and adapters are ready.
- [ ] 4.4 Add invoice/payment and public-invoice journeys covering creation,
  payment state, public token access, and generated hosted link resolution.
- [ ] 4.5 Add storefront publish/public-catalog journeys and verify the public
  link stays under `/Bakery-app/` without exposing authenticated workspace data.
- [ ] 4.6 Add invitation delivery, callback, acceptance, duplicate, revoke, and
  membership-reload journeys using the approved staging mailbox contract. Keep
  the delivery test explicitly blocked when the external mailbox prerequisite
  is unavailable. (Evidence: a retry delivered successfully to
  `jad.em@outlook.com`; the UI reported “Invitation sent” and showed one pending
  staff invitation. Mailbox-link acceptance and membership reload remain open.)
- [ ] 4.7 Run the hosted critical journeys at desktop and mobile viewports and
  preserve behavioral assertions, traces, and cleanup evidence for failures.

## 5. CI workflow and evidence

- [x] 5.1 Add an explicit manually dispatchable staging E2E workflow that runs
  after the relevant frontend/Supabase deployment state, serializes access to
  shared staging, and exposes only approved environment-scoped secrets. (Evidence:
  `.github/workflows/hosted-staging-e2e.yml` is manual-only, uses the development
  environment, has a non-cancelling concurrency group, and exposes only the
  staging identity email/password secrets.)
- [ ] 5.2 Upload HTML reports, first-retry traces/screenshots, deployment
  revision context, readiness results, and cleanup status with secret/PII-safe
  redaction.
- [x] 5.3 Update the staging deployment and frontend verification documentation
  with prerequisites, commands, capability readiness boundaries, failure
  recovery, and the distinction between local mock and hosted real-backend
  evidence. (Evidence: `docs/deployment/frontend-ci-cd.md` now documents the
  hosted runner, secret prerequisites, readiness matrix, and mailbox boundary.)
- [ ] 5.4 Run the local typecheck, lint, unit tests, build, existing desktop/mobile
  mock E2E suite, and the hosted staging suite; record exact results and failed
  gates in the change evidence. (Evidence: typecheck, lint, build, focused
  route/auth tests, and `App.test.tsx` pass; the full unit run fails in the
  unrelated provider selector test; local mock E2E is 94/96 with the two
  `manual-order-real-backend` reload cases failing; hosted E2E is blocked by
  missing protected staging credentials.)
- [ ] 5.5 Update `openspec/PROGRAM_MAP.md` only after the declared local and
  hosted gates pass, preserving active feature-change ownership and documenting
  any remaining manual mailbox or hosted acceptance gate.
