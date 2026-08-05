# Bakery App - Production & Costing SaaS Platform

A multi-tenant SaaS application designed for commercial bakeries to manage recipes, batch production runs, inventory, pricing, costing, orders, and fulfillment. Built with React, Vite, TypeScript, TailwindCSS, and Supabase.

---

## 🚀 Quickstart (Local Development)

### Prerequisites
- Node.js (v22+)
- `pnpm` (v9+)
- Docker Desktop (running)
- Supabase CLI (`npm i -g supabase` or via `npx supabase`)

### Setup Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repo-url>
   cd BakeryApp
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` in the root and/or `Front-end/`:
   ```bash
   cp .env.example Front-end/.env.local
   ```
   Fill in your local Supabase credentials (defaults provided by `supabase start`).

3. **Start Local Supabase Stack**:
   ```bash
   supabase start
   ```
   This initializes local Postgres, Auth, Storage, and Edge Functions containers.

4. **Apply Migrations and Seed Data**:
   ```bash
   supabase db reset
   ```
   This resets the local database, applies all SQL migrations from `supabase/migrations/`, and populates local synthetic seed data from `supabase/seed.sql`.

5. **Start Frontend Development Server**:
   ```bash
   pnpm --filter frontend dev
   # or
   cd Front-end && pnpm run dev
   ```

---

## 🛠️ Supabase CLI Commands Reference

All database schema modifications MUST follow the Git migration workflow:

| Command | Description |
| :--- | :--- |
| `supabase start` | Starts the local Docker-based Supabase containers. |
| `supabase stop` | Stops the local Supabase stack. |
| `supabase migration new <name>` | Generates a new timestamped SQL migration file in `supabase/migrations/`. |
| `supabase db push` | Applies new unapplied SQL migrations incrementally **without wiping existing local data**. |
| `supabase db reset` | Resets local database, runs all migrations from scratch, and seeds fake data (`supabase/seed.sql`). |
| `supabase db lint` | Runs static analysis on SQL migrations to detect syntax errors, RLS missing policies, and schema flaws. |
| `supabase gen types typescript --local` | Generates TypeScript type definitions from local Postgres schema. |
| `supabase functions serve` | Runs Supabase Edge Functions locally for testing. |

---

## 🔐 Environment Variables & Secret Isolation

Strict rules govern environment variables and secret management:

- **Public Keys (`VITE_*`)**:
  Client-safe keys like `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are embedded into frontend bundles during build time.
- **Server Secrets (Private)**:
  `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DATABASE_PASSWORD`, and `SUPABASE_ACCESS_TOKEN` MUST NEVER be prefixed with `VITE_` or exposed to browser code.
- **Zero Production Data in Dev/Staging**:
  Local development and Staging environments MUST use fake synthetic seed data (`supabase/seed.sql`). Real customer production data is restricted to Production Free Project #2.

For details, refer to `.env.example`.

---

## 🏗️ Architecture & Deployment Strategy

The application uses a 3-Tier Environment Strategy:

1. **Local**: Docker + Supabase CLI, synthetic seed data.
2. **Staging**: Shared Supabase Free Project #1, auto-deployed on merge to `develop`.
3. **Production**: Dedicated Supabase Free Project #2, deployed on merge to `main` with owner approval gate and automated pre-release backup.

For complete rules, branch workflow (`main`, `develop`, `feature/*`, `hotfix/*`), access control matrix, expand-and-contract migration patterns, and backup strategies, consult the full [Deployment Playbook](file:///c:/Users/Jad/Desktop/BakeryApp/docs/DEPLOYMENT_PLAYBOOK.md).

---

## 🧪 Testing & Verification Baseline

Before opening a PR, run the quality verification suite:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

Run Playwright E2E browser tests when modifying user journeys:
```bash
npx playwright test
```
