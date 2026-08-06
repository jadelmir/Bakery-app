# Frontend CI/CD

## Summary

Turn the Bakery frontend's existing GitHub Actions scaffolding into a real, independently verifiable frontend CI/CD pipeline.

## Problem

The repository already runs frontend typecheck, lint, unit tests, and build inside `ci.yml`, but the workflow installs with npm even though the frontend declares pnpm as its package manager. The staging and production deployment workflows also build the Vite frontend but stop at placeholder `echo` commands instead of publishing `Front-end/dist` to a hosting target.

Database migrations, Edge Functions, and frontend publishing are currently coupled in the same staging/production workflows. A frontend-only change therefore has no true deploy step and is unnecessarily tied to database release responsibilities.

## Goals

- Make frontend CI deterministic and package-manager-consistent.
- Gate frontend merges on typecheck, lint, unit tests, production build, bundle-budget validation, and browser smoke/E2E coverage.
- Publish the development/staging frontend from `develop` to GitHub Pages.
- Keep frontend deployment logically separate from Supabase database migrations and Edge Function deployment.
- Ensure only client-safe `VITE_*` values are exposed to the browser build.
- Support BrowserRouter deep links on GitHub Pages with a static-host SPA fallback.
- Make deployments observable and fail visibly when publishing or fallback verification fails.

## Current Execution Boundary

This execution selects **GitHub Pages** as the development/staging frontend host.

- `develop` publishes `Front-end/dist` to GitHub Pages.
- The Vite deployment base is `/Bakery-app/` for GitHub Pages builds.
- BrowserRouter uses Vite's runtime base URL.
- `404.html` redirects unknown static paths back through the SPA entry point so routes such as `/Bakery-app/orders` survive browser refreshes.
- `main` does **not** publish the frontend yet. Production frontend hosting remains intentionally deferred until a production provider/domain is selected.
- Existing production Supabase backup/migration/Edge Function automation remains separate and does not pretend to publish the frontend.

## Non-Goals

- No database schema or RLS changes.
- No migration of Supabase projects.
- No production frontend hosting selection in this execution.
- No introduction of server-side secrets into the Vite bundle.
- No automatic production rollback of database migrations.
