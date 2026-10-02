## Context

The frontend is published to GitHub Pages at
`https://jadelmir.github.io/Bakery-app/`. Local Playwright uses
`VITE_USE_MOCK_BACKEND=true`; the existing real-backend configuration still
starts a local Vite server and is not a hosted staging test. The hosted build
receives only the browser-safe Supabase URL and publishable key, while Auth,
RLS, persisted adapters, Edge Functions, and deployment state live in the
staging project.

The live probe verified that authenticated workspace routes load against real
staging data. It also reproduced Page Not Found responses for public storefront,
public invoice, and recovery routes beneath the `/Bakery-app/` base path. The
application currently mixes persisted and local bakery-domain behavior, so the
hosted suite must prove only capabilities whose persistence and migrations are
deployed.

## Goals / Non-Goals

**Goals:**

- Add a separate, opt-in hosted Playwright configuration with real Supabase
  runtime settings and no local web server.
- Verify the deployed base path, protected routes, persisted critical journeys,
  Auth/session behavior, invitation outcomes, tenant isolation, and public links.
- Use the currently authorized staging identity and active bakery, while making
  any new test data unique, bakery-scoped, disposable, and identifiable.
- Produce release evidence without exposing service-role keys or test secrets
  to browser bundles or reports.
- Correct only the base-path route and URL construction defects required for
  public/recovery staging journeys.

**Non-Goals:**

- Replacing or broadening the deterministic local mock suite.
- Resetting the shared staging database or copying production data.
- Implementing product persistence or business behavior owned by another
  active OpenSpec change.
- Running destructive tests against the existing user bakery or production.

## Decisions

### 1. Keep local and hosted suites separate

Add a staging Playwright config and script rather than changing the current
local config. The staging config receives `E2E_BASE_URL`, uses the deployed
GitHub Pages URL by default, sets `VITE_USE_MOCK_BACKEND=false`, and omits
`webServer`. This keeps local CI fast and deterministic while making hosted
acceptance explicit.

Alternative considered: point the current config at staging through an
environment switch. Rejected because mock assumptions, local server startup,
and hosted credentials would become easy to mix accidentally.

### 2. Use the current staging tenant with run-scoped records

Hosted acceptance uses the currently signed-in staging identity and active
bakery, as explicitly authorized for this run. It does not create a new tenant
or use production data. Test-created customers, recipes, orders, invitations,
and other records receive an `E2E_RUN_ID` marker in names or notes where the
schema allows it. Existing records are read-only unless a specific action is
explicitly part of the acceptance journey. Cleanup uses supported UI/RPC paths
where possible; a server-side service-role helper remains optional and requires
separate environment approval.

Alternative considered: provision a dedicated staging tenant. Deferred because
the current staging tenant is already available and authorized for this
acceptance. The shared-state risk is mitigated by read-only defaults, run-scoped
mutations, serialized execution, and cleanup evidence.

### 3. Gate tests by deployed capability readiness

The staging suite has a preflight that confirms the deployed frontend base URL,
required Auth session, and required schema/function readiness. Tests for recipe,
customer, order, inventory, flow, invoice, or invitation persistence run only
against the deployed contracts owned by their active changes. A missing
prerequisite fails the run with a clear readiness error; it is not silently
converted into a mock result or skipped.

Alternative considered: run every feature test unconditionally against whatever
the current staging database exposes. Rejected because the repository
explicitly tracks a mixed persisted/local runtime boundary.

### 4. Make public and recovery URLs base-path aware

Normalize the browser-visible route path through the router basename or a shared
base-path helper before matching public invoice, public storefront, and recovery
routes. Generate links and redirects from `import.meta.env.BASE_URL` so they
resolve under `/Bakery-app/` in staging and `/` locally. Add anonymous hosted
assertions for the generated destination, not only for the dashboard link text.

Alternative considered: add a GitHub Pages rewrite or hash routing. Rejected
because the repository already has an SPA fallback for workspace routes and the
same URL contract must work on future hosted providers.

### 5. Run hosted acceptance as an explicit workflow

Add a manually dispatchable staging E2E workflow with serialized concurrency,
desktop coverage on every accepted run, and mobile coverage as a required
release/nightly extension. It runs after the relevant frontend and Supabase
deployment workflows have completed. Upload HTML reports, traces, screenshots,
and a compact readiness summary on failure; redact or omit all secrets.

Alternative considered: add hosted mutations to pull-request CI. Rejected
because PRs do not own the shared staging environment and should not create
unbounded external records.

### 6. Treat invitation email delivery as an explicit external dependency

The invitation journey uses a dedicated invitee identity and a staging mailbox
or provider API configured outside the browser bundle. The test must verify
delivery, callback path, email-matched acceptance, membership reload, duplicate
handling, and cleanup. If a stable mailbox contract is unavailable, the hosted
delivery test remains a separately documented manual acceptance gate rather
than fabricating success from local Mailpit evidence.

## Risks / Trade-offs

- **Shared staging contention** → serialize hosted runs, avoid mutating existing
  records, prefix new records with the run ID, and clean up in `finally` paths
  with a documented recovery procedure.
- **Partial deployment or schema drift** → run preflight checks and fail with
  the missing migration/function/capability instead of producing misleading
  feature failures.
- **Email delivery flakiness** → use a dedicated mailbox, bounded polling,
  unique invitee addresses, and preserve message identifiers in redacted
  evidence.
- **Hosted base-path regressions** → test root, direct workspace paths, public
  paths, and generated links at the actual `/Bakery-app/` URL.
- **Mixed local/persisted runtime** → maintain a capability readiness matrix in
  the test documentation and do not assert reload persistence for local-only
  adapters.
- **Retries masking defects** → retain trace-on-first-retry, report the first
  failure, and require a reproducible passing run before release evidence is
  accepted.

## Migration Plan

1. Resolve the base-path route/link defects and add local regression coverage.
2. Add the staging config, test helpers, readiness preflight, and anonymous
   hosted smoke tests.
3. Confirm the currently authorized staging owner and active bakery, then
   configure only the approved invitee mailbox and CI-only secrets in the
   appropriate GitHub/Supabase environments.
4. Add persisted feature journeys in dependency order as their owning changes
   are deployed: workspace/Auth, orders, customers/recipes, inventory/flows,
   invoices, storefront, and invitations.
5. Run desktop and mobile staging acceptance, archive evidence, and update the
   program map only after all declared gates pass.

Rollback is to disable the hosted E2E workflow and revert only the test/base-path
change through a reviewed commit; no staging database reset or production action
is part of rollback.

## Open Questions

- Which staging mailbox/provider should be used for invitation acceptance?
- Should mobile hosted E2E run on every manual acceptance or only the nightly /
  release workflow?
- Which active persistence changes will be deployed before this change enters
  its full feature-coverage phase?
- Is a CI-only service-role cleanup helper approved for the staging environment,
  or must cleanup remain UI/RPC-based?
