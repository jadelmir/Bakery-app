# Design: Frontend CI/CD

## Current State

- `.github/workflows/ci.yml` runs on pull requests to `develop` and `main`.
- CI currently starts local Supabase, resets/lints the database, then installs/builds/tests `Front-end`.
- `Front-end/package.json` declares `pnpm@11.9.0`, but CI/deploy workflows use `npm ci || npm install`.
- `deploy-staging.yml` builds the frontend with staging Supabase values but does not publish the artifact.
- `deploy-production.yml` builds the frontend with production Supabase values but does not publish the artifact.
- Staging/production workflows combine database migration, Edge Function, frontend build, and frontend deployment responsibilities.

## Target Pipeline

### Pull Request CI

Use a frontend CI job for changes that can affect the frontend or its build contract.

1. Checkout.
2. Setup Node 22.
3. Enable Corepack / install the repository-declared pnpm version.
4. `pnpm install --frozen-lockfile` from `Front-end`.
5. `pnpm run typecheck`.
6. `pnpm run lint`.
7. `pnpm test`.
8. `pnpm run build`.
9. `pnpm run check:bundle`.
10. Run Playwright smoke/E2E coverage where the test requires a browser/runtime integration check.
11. Upload useful failure artifacts such as Playwright reports when applicable.

Database migration verification may remain a separate CI job so frontend-only failures are distinguishable from Supabase failures. CI SHALL still provide a single required merge gate through required checks/branch protection.

### Staging CD

Trigger after an eligible push/merge to `develop`.

1. Require successful source revision/CI.
2. Enter GitHub `staging` Environment.
3. Install frontend dependencies deterministically with pnpm.
4. Build with staging `VITE_*` configuration.
5. Publish `Front-end/dist` to the configured staging frontend host.
6. Record the deployed URL in the workflow output/summary.
7. Run a post-deploy HTTP/browser smoke check against the staging URL.
8. Fail the deployment if publishing or smoke verification fails.

Staging frontend publishing SHALL NOT require or execute a database migration when the release contains only frontend changes. Supabase deployment remains a separate release responsibility/workflow.

### Production CD

Trigger for the approved revision on `main`.

1. Require production GitHub Environment controls/approval as configured by repository policy.
2. Install with the locked pnpm version.
3. Build using only production-safe `VITE_*` browser configuration.
4. Publish `Front-end/dist` to the production frontend host.
5. Record deployment URL and source commit SHA.
6. Run post-deploy smoke checks for the public shell and at least one safe route.
7. Mark the workflow failed if the deployed site cannot serve the expected application.

Database backup/migration and Edge Function workflows remain independent. A frontend deployment failure SHALL NOT imply that a database migration should be rolled back automatically.

## Environment and Secret Model

GitHub Environments:

- `staging`
  - public frontend build configuration such as staging `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  - hosting-provider deployment credential/token or OIDC configuration
  - staging site/project identifier as required by the selected provider
  - staging deployed URL
- `production`
  - production equivalents
  - required reviewer/approval protection when configured

Rules:

- No `SUPABASE_SERVICE_ROLE_KEY`, database password, private API key, or other server secret may be supplied as a `VITE_*` variable.
- Deployment credentials are available only to the deployment job/environment, not to pull-request builds from untrusted branches.
- PR CI should use local/test configuration and must not require production deployment secrets.

## Workflow Separation

Preferred workflow boundaries:

- `ci.yml`: PR quality gates. Split frontend and database verification into clear jobs.
- `deploy-frontend-staging.yml`: frontend-only staging build/publish/smoke.
- `deploy-frontend-production.yml`: frontend-only production build/publish/smoke.
- Existing Supabase staging/production deployment workflows: database migrations and Edge Functions only after frontend responsibilities are removed.

This prevents an ordinary frontend release from unnecessarily obtaining database credentials or running migrations.

## Trigger and Concurrency Rules

- PR CI: `pull_request` targeting `develop` or `main`.
- Staging frontend CD: push to `develop`, with frontend-relevant path filtering where safe.
- Production frontend CD: push to `main`, with frontend-relevant path filtering where safe.
- Each environment deployment uses a concurrency group so a newer deployment supersedes or serializes older pending deployments for the same environment.
- `workflow_dispatch` remains available for controlled redeployment of an already committed revision where GitHub permits it.

## Verification Strategy

CI acceptance:

- deterministic pnpm install succeeds;
- typecheck/lint/unit tests pass;
- Vite production build succeeds;
- bundle budget passes;
- Playwright smoke/E2E suite selected for CI passes.

CD acceptance:

- provider reports successful publish;
- expected deployment URL is known;
- HTTP response succeeds;
- SPA entry point renders;
- a safe application route resolves without a static-host 404;
- no private secret is emitted into workflow logs or browser build configuration.

## Rollback

Frontend rollback SHALL be provider/revision based: redeploy the last known-good frontend revision/artifact. Database rollback is explicitly outside this frontend pipeline and continues to follow the project's forward-fix migration policy.
