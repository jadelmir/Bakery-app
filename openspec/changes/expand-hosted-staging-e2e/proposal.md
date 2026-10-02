## Why

The Bakery App has broad local Playwright coverage, but the CI suite runs against
the mock backend and does not prove that the deployed GitHub Pages frontend,
Supabase Auth, persisted bakery records, RLS boundaries, Edge Functions, or
public links work together in staging. The hosted staging probe also found that
public storefront, public invoice, and password-recovery routes fail beneath the
`/Bakery-app/` deployment base path, so a real staging gate would currently miss
or expose an important release regression.

This change establishes a safe, repeatable hosted staging E2E layer for the
implemented product surface and fixes only the routing/link behavior required
for those journeys to reach the deployed application.

## What Changes

- Add a dedicated Playwright configuration for the hosted staging frontend,
  using the real Supabase runtime and no local Vite web server.
- Add authenticated staging journeys for login/session reload, bakery selection,
  persisted orders, customer and recipe reloads, inventory mutations, production
  flow persistence, invoices/payments, and team invitation outcomes where the
  owning backend changes are deployed.
- Add anonymous hosted journeys for SPA deep links, public storefronts, public
  invoices, and recovery/callback routes.
- Use the currently authorized staging identity and active bakery for acceptance,
  with clearly run-scoped records and a cleanup path that does not expose
  service-role credentials to browser code or Git.
- Publish hosted E2E evidence, traces, and failure diagnostics in the staging
  delivery workflow after the frontend and required Supabase changes are ready.
- Correct the GitHub Pages base-path handling for public route detection,
  recovery URLs, and generated public storefront/invoice links so hosted
  journeys resolve under `/Bakery-app/`.
- Keep existing local mock E2E coverage as the fast deterministic regression
  suite; hosted E2E is an additional release/acceptance layer.

### Non-goals

- No new bakery product behavior, schema redesign, or replacement of the
  existing local mock test suite.
- No production deployment or production-data testing.
- No hosted database reset, dashboard-only data edits, production data, or
  mutation of existing staging records that are not created by the current E2E
  run.
- No ownership of the active recipe, customer, production-flow, order, payment,
  or invitation feature changes; this change consumes their deployed contracts
  and records acceptance evidence only.
- No claim that a capability is staging-ready while its persisted implementation
  or required migrations remain incomplete.

## Capabilities

### New Capabilities

- `hosted-staging-e2e`: Safe, authenticated and anonymous end-to-end verification
  of the deployed frontend against the staging Supabase project, including
  data isolation, cleanup, evidence, and release gating.

### Modified Capabilities

- `frontend-runtime-verification`: Extend the runtime verification contract to
  distinguish local mock E2E from hosted real-backend E2E and to require
  base-path-correct public and recovery routes in the deployed frontend.

## Impact

- Frontend Playwright configuration and staging E2E specs under `Front-end/e2e/`.
- GitHub Actions frontend/staging workflows and their environment-scoped
  browser-safe and test-only secrets.
- Base-path-aware route parsing and URL construction in the application shell,
  storefront, invoice, and recovery flows.
- Staging Supabase Auth, invitation Edge Function, persisted domain adapters,
  RLS-scoped test data, and cleanup tooling.
- Documentation for staging E2E prerequisites, test accounts, evidence, and
  hosted rollout readiness.

## Traceability

- Frontend roadmap phase: F12 Settings, Reliability, and Release.
- Backend roadmap phase: B12 Security, Testing, and Release.
- Dependencies: `frontend-quality-polish`, `deployment-playbook`, active
  `repair-staging-order-and-invitations`, `persist-manual-orders`,
  `persist-customer-directory`, `persist-recipes`, and
  `persist-production-flows`.
- Owning change: `expand-hosted-staging-e2e`.
