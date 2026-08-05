# Tasks - Establish Supabase Free-Plan Deployment Playbook (Phase F12 / B12)

## 1. Documentation & Governance Guidelines

- [x] 1.1 Add `docs/DEPLOYMENT_PLAYBOOK.md` documenting environment strategy, 15 non-negotiable rules, branch workflow (`main`, `develop`, `feature/*`), and access matrix.
- [x] 1.2 Update `AGENTS.md` and `README.md` with migration creation rules (`supabase migration new`), clean reset commands (`supabase db reset`), and secret isolation rules.

## 2. GitHub Actions CI/CD Workflows

- [x] 2.1 Build `.github/workflows/ci.yml` for running local Supabase startup, migration reset, database lint, TypeScript typecheck, unit tests, and frontend build on PRs.
- [x] 2.2 Build `.github/workflows/deploy-staging.yml` for automated staging deployment on merge to `develop`.
- [x] 2.3 Build `.github/workflows/deploy-production.yml` with owner approval gate and pre-release backup for production releases on merge to `main`.
- [x] 2.4 Build `.github/workflows/backup-production.yml` for scheduled production database backups.

## 3. Environment Variables & Secret Configuration

- [x] 3.1 Create `.env.example` documenting publishable keys (`VITE_SUPABASE_PUBLISHABLE_KEY`), app URLs, and server-only secret templates (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`).
- [x] 3.2 Add `.gitignore` checks ensuring `.env.local`, production credentials, and dump files are never committed to Git.

## 4. Verification & Quality Gates

- [x] 4.1 Execute local Supabase startup and migration validation (`supabase start && supabase db reset`).
- [x] 4.2 Run full project quality suite (`npm run typecheck`, `npm test`, `npx playwright test`).
- [x] 4.3 Update `openspec/PROGRAM_MAP.md` marking Phase F12 / B12 deployment capability as verified.
