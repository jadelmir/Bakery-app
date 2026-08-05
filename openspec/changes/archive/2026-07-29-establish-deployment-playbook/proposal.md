# Proposal - Establish Supabase Free-Plan Deployment Playbook (Phase F12 / B12)

## Why

Operating a multi-tenant SaaS application safely across development, staging, and production on Supabase Free Plan tier requires strict environment isolation, automated CI/CD validation workflows, database migration governance, backup policies, and access control matrices.

Currently, environment strategy guidelines are unmapped in OpenSpec changes.

This change establishes the 3-tier environment strategy (Local Docker, Staging Free Project #1, Production Free Project #2), non-negotiable migration rules (Git source of truth, forward-fix only for production), GitHub Actions CI/CD workflows, access matrix rules, and automated RLS security gates.

## What Changes

- **Environment Strategy (DevOps / B12)**:
  - Configure 3 environments: Local (Supabase CLI + Docker), Staging (Shared Free Project #1), Production (Live Free Project #2).
  - Enforce 15 non-negotiable rules (Git schema source of truth, SQL migrations only, no untracked dashboard edits, separate secrets, zero production data in dev/staging, fake seed data only).
  - Establish GitHub Actions workflows for PR CI (`ci.yml`), Staging Deployment (`deploy-staging.yml`), Production Release (`deploy-production.yml`), Edge Function deployments, and Production Backups (`backup-production.yml`).
  - Establish Expand-and-Contract database schema change guidelines for zero-downtime releases.
  - Define Access Control Matrix for Frontend, Backend, DevOps agents, and Owner.
- **Verification & Testing (F12 / B12)**:
  - Add automated CI quality pipeline executing local Supabase startup, database migration reset (`supabase db reset`), database linting (`supabase db lint`), RLS test checks, TypeScript typecheck, Vitest unit suite, and Playwright E2E browser suite before merging PRs into `develop` or `main`.

## Capabilities

### New Capabilities
- `deployment-playbook`: Defines 3-tier environment strategy, CI/CD GitHub Actions workflows, forward-fix migration governance, backup policies, and access security matrix.

## Impact
- **CI/CD Configuration**: Adds `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, and `backup-production.yml`.
- **Repository Guidelines**: Adds deployment playbook instructions to `docs/` and `AGENTS.md`.
- **Dependencies**: Cross-cutting phase governing all backend/frontend releases.
