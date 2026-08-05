# Design - Establish Supabase Free-Plan Deployment Playbook (Phase F12 / B12)

## Context

Running development, staging, and production safely without paid Supabase preview branches requires strict environment isolation, automated CI validation, and robust deployment pipelines.

This design specifies the 3-tier environment architecture, GitHub Actions workflow pipelines, migration controls, environment variable boundaries, and backup rules.

## Environment Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Local Development                               │
│       - Supabase CLI + Docker Desktop                                  │
│       - supabase db reset & seed.sql (Fake Data Only)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PR to develop
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Staging (Free Project #1)                           │
│       - Shared UAT & Integration Environment                           │
│       - Automatic deploy on merge to develop                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PR to main + Owner Approval
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Production (Free Project #2)                         │
│       - Live Customer Data & Real Backups                              │
│       - Protected deployment via main branch                           │
└────────────────────────────────────────────────────────────────────────┘
```

## Non-Negotiable Deployment Rules

1. **Git Source of Truth**: Every database schema change must exist as a committed SQL migration in `supabase/migrations/`.
2. **No Manual Dashboard Edits**: Untracked production schema edits via Supabase Studio are strictly forbidden.
3. **Strict Secrets Isolation**: Production secrets, service-role keys, and database passwords must never be exposed to browser code or used in staging/local environments.
4. **Forward-Fix Migration Policy**: Once a migration is deployed to production, it must never be deleted or modified. Fixes require a new forward-fix migration.
5. **No Production Data in Staging/Local**: Development and staging must use reproducible seed data (`supabase/seed.sql`) containing fake data only.

## GitHub Actions Pipelines

### 1. `ci.yml` (Pull Requests)
Runs on PRs targeting `develop` or `main`:
- Checkout code & setup Node.js v22
- Install Supabase CLI
- `supabase start` & `supabase db reset`
- `supabase db lint`
- `npm run typecheck` & `npm run lint` & `npm test`
- `npm run build`

### 2. `deploy-staging.yml` (Merge to `develop`)
- Link CLI to `STAGING_PROJECT_REF`
- Apply migrations (`supabase db push`)
- Deploy Edge Functions (`supabase functions deploy`)
- Deploy staging frontend to Vercel/Netlify

### 3. `deploy-production.yml` (Merge to `main` with Owner Approval)
- Run production database backup
- Link CLI to `PRODUCTION_PROJECT_REF`
- Apply migrations (`supabase db push`)
- Deploy Edge Functions & frontend
