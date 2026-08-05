# Bakery App - Production & Costing SaaS Platform

A multi-tenant SaaS application for bakeries to manage recipes, production, inventory, costing, orders, customers, payments, and fulfillment. The frontend is React/TypeScript/Vite and the backend platform is Supabase.

## Local development

### Prerequisites

- Node.js 22+
- `pnpm` 9+
- Docker Desktop
- Supabase CLI
- OpenSpec and ORCH for spec-driven agent workflows

### Setup

```bash
git clone <repo-url>
cd BakeryApp
cp .env.example Front-end/.env.local
supabase start
supabase db reset
cd Front-end
pnpm install
pnpm run dev
```

Fill client-safe Supabase values in the local environment. Never expose or commit service-role keys, database passwords, provider secrets, or other server credentials.

## Project workflow

- OpenSpec is the only source of truth for planned requirements, changes, tasks, progress, and archives.
- ORCH provides orchestration, token-efficiency policy, and project-organization support around OpenSpec.
- Run `orch doctor` to diagnose the local integration.
- Use `orch organize` for a dry-run documentation organization scan.
- See `docs/PROJECT_MAP.md` and `docs/PROJECT_ORGANIZATION.md` for navigation and placement guidance.

## Supabase migration workflow

All database schema changes must be committed migrations under `Front-end/supabase/migrations/`.

Common commands from the appropriate project directory include:

```bash
supabase start
supabase migration new <name>
supabase db push
supabase db reset
supabase db lint
supabase gen types typescript --local
```

## Architecture and deployment

- Architecture: [`docs/architecture/architecture.md`](docs/architecture/architecture.md)
- Technical reference: [`docs/architecture/technical-requirements.md`](docs/architecture/technical-requirements.md)
- API: [`docs/api/api.md`](docs/api/api.md)
- Database: [`docs/database/database-schema.md`](docs/database/database-schema.md)
- Deployment: [`docs/deployment/deployment-playbook.md`](docs/deployment/deployment-playbook.md)

## Verification baseline

From `Front-end/`, run the applicable checks before delivery:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Run Playwright when user journeys change and Supabase migration/RLS/security verification when database behavior changes.
