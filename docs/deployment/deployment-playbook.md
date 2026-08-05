# Bakery App Deployment Playbook & Environment Strategy

This playbook defines the multi-environment deployment strategy, database migration governance, secret isolation policies, CI/CD release workflows, access control matrix, and backup procedures for the Bakery App on the Supabase Free Plan tier.

---

## 1. 3-Tier Environment Architecture

To ensure high availability, zero production downtime, and safe multi-tenant testing without paid preview branch infrastructure, the Bakery App strictly isolates three execution environments:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Local Development                            │
│  • Engine: Supabase CLI + Docker Desktop                               │
│  • Database: Isolated local Postgres container                         │
│  • Seed Data: Fake synthetic data only (`supabase/seed.sql`)           │
│  • Purpose: Rapid feature development, unit testing, schema iteration  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PR to develop
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    2. Staging (Free Project #1)                        │
│  • Engine: Remote Supabase Free Tier Project #1                        │
│  • Purpose: User Acceptance Testing (UAT), integration validation      │
│  • Triggers: Automated CI/CD deployment on merge to `develop`          │
│  • Data: Anonymized integration test data (Zero production data)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PR to main + Owner Gate
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   3. Production (Free Project #2)                      │
│  • Engine: Remote Supabase Free Tier Project #2                        │
│  • Purpose: Live customer tenant operations                            │
│  • Triggers: Automated deployment on merge to `main` with approval     │
│  • Data: Real tenant data, daily automated encrypted backups           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 15 Non-Negotiable Deployment Rules

1. **Git as Sole Schema Source of Truth**: All database schema changes, RLS policies, functions, triggers, and migrations MUST be committed as SQL files in `supabase/migrations/`.
2. **No Manual Dashboard Edits**: Making direct schema modifications via Supabase Studio in Staging or Production is strictly forbidden. Any untracked change will be overwritten or cause migration divergence.
3. **Strict Secrets Isolation**: Public keys (`VITE_SUPABASE_PUBLISHABLE_KEY`) are client-safe. Private keys (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DATABASE_PASSWORD`) MUST NEVER be exposed in browser builds, committed to Git, or used across environment boundaries.
4. **Forward-Fix Migration Policy**: Applied production migrations are immutable. Once a migration file is executed on Production, it MUST NEVER be edited, renamed, or deleted. Fixes or schema adjustments must be introduced via a new forward-fix SQL migration.
5. **Zero Production Data in Dev/Staging**: Production data MUST NEVER be copied or restored into Local or Staging environments. Local and Staging environments use synthetic seed data (`supabase/seed.sql`).
6. **Automated CI Validation Before Merge**: Every Pull Request MUST pass automated CI verification (`supabase start`, `supabase db reset`, `supabase db lint`, TypeScript typechecking, Vitest unit tests, and Playwright E2E tests) before being merged into `develop` or `main`.
7. **Strict Environment Variable Prefixing**: Environment variables exposed to the frontend MUST start with `VITE_`. Server-only secrets MUST NOT start with `VITE_` to prevent accidental bundler leakages.
8. **Access Control Matrix Enforcement**: Agent and contributor access is role-restricted. Only the Project Owner holds production database credentials, service-role keys, and production release approval authority.
9. **Expand-and-Contract Schema Changes**: Destructive schema modifications (column drops, table renames, type changes) MUST follow multi-phase Expand-and-Contract patterns across separate releases to maintain backwards compatibility.
10. **Pre-Deployment Backup Prerequisite**: Every production release MUST execute an automated database snapshot (`backup-production.yml`) prior to executing pending SQL migrations.
11. **Daily Out-of-Band Backups**: Production database schemas and data dumps MUST be automatically backed up daily (`backup-production.yml`), encrypted, and retained according to policy.
12. **Idempotent Migration Scripts**: SQL migrations MUST be written idempotently (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, conditional DO blocks for policy creation) to prevent failure on repeated executions.
13. **Zero Raw Admin SQL in Frontend**: All application frontend interactions MUST go through standard Supabase client APIs governed by Row Level Security (RLS) or authenticated Edge Functions.
14. **Edge Function Staging Isolation**: Edge Functions MUST be served locally (`supabase functions serve`) and deployed to Staging (`supabase functions deploy`) for verification prior to production release.
15. **Drift Detection & Parity Monitoring**: Schema drift between committed Git migrations and remote databases MUST be verified using `supabase db remote commit` / `supabase db push` drift checks before executing release pipelines.

---

## 3. Branching & Deployment Workflow

```
[feature/xxx]  ──PR──►  [develop]  ──Auto-Deploy──►  Staging Project #1
                            │
                           PR + Owner Approval
                            ▼
                         [main]     ──Auto-Deploy──►  Production Project #2 (Pre-backup + Push)
                            ▲
                         [hotfix/xxx] (Direct branch off main for critical hotfixes)
```

### Branch Rules:
- **`feature/*`**: Feature development branches. Branch from `develop`. All work verified locally (`supabase db reset`). PR targets `develop` and triggers `ci.yml`.
- **`develop`**: Staging branch. Merging a PR into `develop` automatically runs `deploy-staging.yml`, applying migrations to Staging Free Project #1 and deploying Edge Functions.
- **`main`**: Production branch. Protected branch. Merging from `develop` to `main` requires an approved PR, passing CI checks, and an Owner Approval Gate. Merges trigger `deploy-production.yml` which executes a pre-release backup, applies migrations (`supabase db push`), deploys Edge Functions, and deploys the production frontend.
- **`hotfix/*`**: Urgent bug fixes created off `main`. Tested locally, submitted via PR to `main` (triggering production deploy upon approval), and subsequently back-merged into `develop`.

---

## 4. Access Control Matrix

| Role | Local Docker | Staging Supabase | Production Supabase | GitHub Deployment Approval | Database Passwords & Service Keys |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Agent / Developer** | Full Access | Read-Only / Preview UI | No Access | No Approval Authority | Public / Anon Key Only |
| **Backend Agent / Developer** | Full Access | Migration Push / Functions | No Access | No Approval Authority | Public / Local Dev Keys Only |
| **DevOps Agent** | Full Access | Full Staging Admin | Automation Exec | CI/CD Workflow Maint | Managed via Encrypted Secrets |
| **Project Owner** | Full Access | Full Admin Access | Full Admin Access | Exclusive Approval Authority | Full Custody & Ownership |

---

## 5. Expand-and-Contract Migration Pattern

To perform breaking database schema changes without downtime or breaking active client sessions, follow the 3-phase Expand-and-Contract workflow:

### Example Scenario: Renaming `customer_name` to `full_name` in `customers` table

#### Phase 1: Expand (Release N)
Add the new column alongside the existing column and support dual-writing.
```sql
-- Migration: 20260730000001_expand_customer_full_name.sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Populate new column with existing data
UPDATE customers SET full_name = customer_name WHERE full_name IS NULL;

-- Trigger to maintain synchronization during dual-write transition
CREATE OR REPLACE FUNCTION sync_customer_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NULL THEN
    NEW.full_name := NEW.customer_name;
  ELSIF NEW.customer_name IS NULL THEN
    NEW.customer_name := NEW.full_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_name ON customers;
CREATE TRIGGER trg_sync_customer_name
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION sync_customer_name();
```

#### Phase 2: Migrate Code (Release N+1)
Deploy application code updated to read and write exclusively to `full_name`, falling back to `customer_name` if missing.

#### Phase 3: Contract (Release N+2)
Once all clients and functions use `full_name`, remove the trigger and drop the old column.
```sql
-- Migration: 20260730000002_contract_customer_name.sql
DROP TRIGGER IF EXISTS trg_sync_customer_name ON customers;
DROP FUNCTION IF EXISTS sync_customer_name();
ALTER TABLE customers DROP COLUMN IF EXISTS customer_name;
```

---

## 6. Backup & Disaster Recovery Strategy

- **Automated Daily Backups**: Daily GitHub Actions workflow (`backup-production.yml`) executes schema and data dumps using `supabase db dump` / `pg_dump`.
- **Pre-Release Snapshot**: Production release pipeline automatically creates a database snapshot prior to applying new SQL migrations.
- **Retention Policy**:
  - Daily Backups: Retained for 7 days.
  - Weekly / Monthly Snapshots: Retained for 30 days.
- **Storage & Security**: Backup artifacts are encrypted out-of-band and stored securely with restricted access.
- **Disaster Recovery Restoration Procedure**:
  1. Freeze production deployments.
  2. Provision/verify target Supabase project.
  3. Restore schema from latest verified SQL migration dump: `psql -h <host> -U postgres -d postgres < dump_schema.sql`.
  4. Restore data from snapshot: `psql -h <host> -U postgres -d postgres < dump_data.sql`.
  5. Verify RLS policies and table constraints.
  6. Point domain / frontend environment variables to restored instance.

---

## 7. Local Database Migration & Data Preservation Workflow

To manage schema migrations during local development without unintentional data loss, adhere to the following command boundaries:

### Incremental Migration vs. Clean Reset

1. **Incremental Update (Preserves Local Data)**:
   - Command: `supabase db push` (or `npx supabase db push`)
   - Behavior: Detects new, unapplied SQL migration files under `supabase/migrations/` and executes them against the local Postgres database.
   - Data Impact: **Zero data loss**. Existing tables, local user accounts, test bakeries, and data rows remain intact.
   - Use Case: When adding a new table or column during ongoing local testing and you want to keep existing local test data.

2. **Clean-Slate Reset (Wipes & Re-Seeds)**:
   - Command: `supabase db reset` (or `npx supabase db reset`)
   - Behavior: Drops the local database schema, recreates Postgres from scratch, executes all committed migrations sequentially, and runs `supabase/seed.sql`.
   - Data Impact: **Wipes transient local data** and restores default synthetic test data.
   - Use Case: Verifying clean-slate migration reproducibility from scratch or resetting after introducing breaking schema changes.

3. **Persistent Local Sample Data (`supabase/seed.sql`)**:
   - Store standard test bakeries, starter profiles, sample customer accounts, and ingredient items in `supabase/seed.sql`.
   - Whenever `supabase db reset` is executed, `seed.sql` automatically populates these records so developer test environments are restored instantly.
