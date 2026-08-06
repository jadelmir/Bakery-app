# Design: Frontend CI/CD

## Current State

- `.github/workflows/ci.yml` runs on pull requests to `develop` and `main`.
- `Front-end/package.json` declares `pnpm@11.9.0`, while existing CI/deploy workflows used npm.
- Existing staging/production workflows combined Supabase release responsibilities with placeholder frontend deployment steps.
- The Vite app uses `BrowserRouter`, so GitHub Pages project hosting requires both a base path and an SPA deep-link fallback.

## Implemented Target Pipeline

### Pull Request CI

`ci.yml` is split into independent frontend and Supabase jobs.

Frontend CI:

1. Checkout.
2. Setup Node 22.
3. Enable pnpm 11.9.0 via Corepack.
4. `pnpm install --frozen-lockfile`.
5. `pnpm run typecheck`.
6. `pnpm run lint`.
7. `pnpm test`.
8. `pnpm run build` with mock-safe configuration.
9. `pnpm run check:bundle`.
10. Install Chromium and run the Playwright desktop project.
11. Upload the Playwright report when the job fails.

Supabase CI remains a separate job running local stack startup, clean database reset/migration verification, and database linting.

### Development/Staging Frontend CD

GitHub Pages is the selected static host for the development frontend.

Trigger: eligible pushes to `develop` plus manual dispatch.

Build job:

- uses the GitHub `development` environment;
- installs with locked pnpm;
- builds with `VITE_DEPLOY_BASE_PATH=/Bakery-app/`;
- receives only client-safe staging Supabase values;
- runs the bundle budget check;
- uploads `Front-end/dist` as a Pages artifact.

Deploy job:

- uses the GitHub `github-pages` environment required by Pages deployment history;
- publishes with `actions/deploy-pages`;
- verifies the deployed root;
- verifies that a deep-link request such as `/orders` returns the committed SPA fallback document.

### SPA Routing on GitHub Pages

Vite receives the Pages project base at build time. `BrowserRouter` derives its basename from `import.meta.env.BASE_URL`, so local builds continue to use `/` and Pages builds use `/Bakery-app`.

`Front-end/public/404.html` handles direct deep links. When GitHub Pages cannot statically resolve `/Bakery-app/orders`, the fallback stores the requested SPA path in `sessionStorage` and redirects to `/Bakery-app/`. `index.html` restores that path with `history.replaceState` before React starts. BrowserRouter then resolves the route normally.

This preserves clean URLs such as `/Bakery-app/orders` without switching to hash routing.

### Supabase Deployment Separation

`deploy-staging.yml` and `deploy-production.yml` now own only Supabase deployment responsibilities. Frontend-only changes do not need database passwords and do not run migrations.

Staging Supabase deployment remains tied to `develop` and Supabase-relevant paths. Production Supabase deployment remains tied to `main` and Supabase-relevant paths.

### Production Frontend CD

Production frontend publishing is intentionally deferred in this execution. `main` does not automatically publish the Vite application until a production frontend provider/domain is selected. No placeholder production frontend deploy step remains.

## Environment and Secret Model

Development frontend build inputs may include only browser-safe values such as:

- `STAGING_SUPABASE_URL` exposed to the build as `VITE_SUPABASE_URL`;
- `STAGING_SUPABASE_PUBLISHABLE_KEY` exposed as `VITE_SUPABASE_PUBLISHABLE_KEY`.

Database passwords, Supabase access tokens, service-role keys, and other server-only credentials stay out of the frontend build and remain scoped to Supabase deployment workflows.

## Verification Strategy

CI acceptance:

- deterministic pnpm install;
- typecheck/lint/unit tests;
- Vite production build;
- bundle budget;
- Playwright desktop smoke/E2E suite.

Development CD acceptance:

- GitHub Pages artifact is published;
- the workflow exposes the Pages deployment URL;
- the root document responds successfully;
- a deep-link request exposes the SPA fallback script rather than a generic unrelated 404 page.

## Rollback

Development frontend rollback is revision-based: redeploy a last-known-good committed frontend revision through the Pages workflow. Database rollback is outside the frontend pipeline and continues to follow the forward-fix migration policy.
