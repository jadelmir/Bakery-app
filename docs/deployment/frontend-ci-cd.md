# Frontend CI/CD

This document describes the current frontend delivery path for the Bakery App.

## Current environments

- Local development: Vite on the developer machine with `/` as the application base path.
- Development/staging frontend: GitHub Pages, deployed from `develop` to `https://jadelmir.github.io/Bakery-app/`.
- Production frontend: intentionally not automated yet. `main` does not publish the frontend until a production hosting provider/domain is selected in a future OpenSpec change.

Supabase database migrations and Edge Function deployments are separate workflows and are not part of frontend publication.

## Pull request CI

Pull requests to `develop` or `main` run two independent jobs.

Frontend quality checks:

1. Node 22.
2. pnpm 11.9.0 through Corepack.
3. `pnpm install --frozen-lockfile`.
4. `pnpm run typecheck`.
5. `pnpm run lint`.
6. `pnpm test`.
7. `pnpm run build`.
8. `pnpm run check:bundle`.
9. Playwright Chromium desktop suite.
10. Playwright report upload when the job fails.

Supabase database checks start the local stack, reset the database from committed migrations, lint the schema, and always stop the stack afterward.

## GitHub Pages development deployment

`.github/workflows/deploy-frontend-pages.yml` deploys eligible frontend changes pushed to `develop`.

The build uses:

- `VITE_DEPLOY_BASE_PATH=/Bakery-app/`
- `VITE_SUPABASE_URL` sourced from the GitHub `development` environment secret `STAGING_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` sourced from `STAGING_SUPABASE_PUBLISHABLE_KEY`

Only browser-safe configuration is supplied to Vite. Database passwords, Supabase management access tokens, and service-role keys are not frontend build inputs.

The workflow publishes `Front-end/dist` with the official GitHub Pages Actions and records the deployment URL through the `github-pages` environment.

## SPA deep-link behavior

GitHub Pages has no server-side SPA rewrite rule. Directly requesting `/Bakery-app/orders` therefore reaches the Pages 404 handler before React can start.

`Front-end/public/404.html` stores the requested client-side route in `sessionStorage` and redirects to `/Bakery-app/`. `Front-end/index.html` restores the route with `history.replaceState` before React starts. `BrowserRouter` derives its basename from `import.meta.env.BASE_URL`, so it resolves the restored route under `/Bakery-app`.

This allows clean development URLs such as:

- `/Bakery-app/orders`
- `/Bakery-app/customers`
- `/Bakery-app/inventory`

without switching to hash routing.

## Required GitHub configuration

Before the first Pages deployment:

1. Repository Settings → Pages → Build and deployment → Source must be **GitHub Actions**.
2. Create or use the GitHub Environment named `development`.
3. Add `STAGING_SUPABASE_URL` to that environment.
4. Add `STAGING_SUPABASE_PUBLISHABLE_KEY` to that environment.

These values are browser-visible by design. Do not put `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or Supabase management tokens into variables consumed by Vite.

## Rollback

To roll back the development frontend, redeploy a known-good committed revision through the Pages workflow. Frontend rollback does not reverse database migrations; database releases continue to follow the forward-fix policy.
