# Frontend CI/CD

## Summary

Turn the Bakery frontend's existing GitHub Actions scaffolding into a real, independently verifiable frontend CI/CD pipeline.

## Problem

The repository already runs frontend typecheck, lint, unit tests, and build inside `ci.yml`, but the workflow installs with npm even though the frontend declares pnpm as its package manager. The staging and production deployment workflows also build the Vite frontend but stop at placeholder `echo` commands instead of publishing `Front-end/dist` to a hosting target.

Database migrations, Edge Functions, and frontend publishing are currently coupled in the same staging/production workflows. A frontend-only change therefore has no true deploy step and is unnecessarily tied to database release responsibilities.

## Goals

- Make frontend CI deterministic and package-manager-consistent.
- Gate frontend merges on typecheck, lint, unit tests, production build, and bundle-budget validation.
- Add browser-level smoke/E2E verification with Playwright at the appropriate CI boundary.
- Publish a real staging frontend after eligible changes reach `develop`.
- Publish a real production frontend after eligible changes reach `main` and production approval requirements are satisfied.
- Keep frontend deployment logically separate from Supabase database migrations and Edge Function deployment.
- Use GitHub Environments for staging/production configuration and deployment history.
- Ensure only client-safe `VITE_*` values are exposed to the browser build.
- Make deployments observable and fail loudly when publishing or post-deploy smoke checks fail.

## Non-Goals

- No database schema or RLS changes.
- No redesign of the application runtime.
- No migration of Supabase projects.
- No introduction of server-side secrets into the Vite bundle.
- No automatic production rollback of database migrations.
- No deployment implementation during `/orch-plan`.

## Hosting Boundary

The frontend is a static Vite application whose deployable output is `Front-end/dist`. The implementation SHALL isolate provider-specific publishing into the deployment step so the CI contract remains provider-independent. Before `/orch-execute`, the owner may select the static hosting provider; if no existing provider is configured, execution should use one explicit provider rather than leaving another placeholder deployment command.
