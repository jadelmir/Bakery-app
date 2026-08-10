# Design: Stabilize Staging Data and Remove Runtime Mocks

## Current State

The committed Supabase project is located at `Front-end/supabase/`, including `config.toml`, migrations, functions, tests, and `seed.sql`.

Current CI database steps execute `supabase start`, `supabase db reset`, `supabase db lint`, and `supabase stop` from the repository root. Current staging deployment similarly executes `supabase link`, `supabase db push`, and `supabase functions deploy --all` from the repository root, and its path filter watches `supabase/**` rather than `Front-end/supabase/**`.

The frontend still exports prototype fixtures from `Front-end/src/app/constants.ts`. `BakeryWorkspace` initializes `orders` from `ORDERS`, builds initial production tasks from a mock order, and contains fallback local behavior. This is appropriate only for explicit mock/test execution, not a real Supabase-backed deployment.

## Design Decisions

### 1. Make `Front-end/supabase` the workflow working directory

CI and deployment steps that use the Supabase CLI MUST execute against the committed Supabase project under `Front-end`. The staging workflow path trigger MUST watch `Front-end/supabase/**`.

Prefer explicit `working-directory: Front-end` on Supabase CLI steps rather than moving the Supabase directory in this corrective change. This minimizes churn and matches the existing frontend-local Supabase configuration and scripts.

### 2. Migrations are the schema source of truth

Staging schema creation/updates MUST come from committed files under `Front-end/supabase/migrations/`. The deployment workflow MUST apply migrations with `supabase db push` after linking the staging project.

A successful deployment MUST include a verification step that proves required application tables exist. Verification should query a stable minimum set representative of the current app (for example bakery/workspace membership, customers, orders and their dependent order tables) rather than silently relying on the frontend to discover missing relations at runtime.

The verification mechanism may use Supabase CLI/database tooling available in CI, but MUST fail the deployment when required schema objects are absent.

### 3. Separate real runtime data from synthetic fixtures

Production-like runtime (GitHub Pages development environment connected to staging Supabase) MUST use persisted adapters and MUST render empty states when no records exist.

Hard-coded `CUSTOMERS`, `ORDERS`, and other sample records MUST NOT be used as fallback data in the Supabase-backed runtime path. Synthetic fixtures may remain in test-only files or an explicit mock adapter/mode used by automated tests.

`VITE_USE_MOCK_BACKEND=true` remains acceptable for CI/E2E where the suite intentionally exercises a mock environment. It MUST NOT be the default for the deployed GitHub Pages development build.

### 4. Remove hidden fallback behavior

When a required real adapter/service is unavailable in a Supabase-backed runtime, the app should surface an empty/error/loading state rather than silently switching to prototype data. This keeps missing backend wiring visible and prevents fake customer/order data from being mistaken for user data.

### 5. Audit all runtime fixture categories

The cleanup MUST cover at least customers and orders because these are user-visible persisted entities. During execution, inspect tasks, recipes, inventory, starter state, invoices/payment settings and any other constants currently imported into runtime screens. Each fixture must be classified as one of:

- real persisted runtime data,
- deterministic default configuration (legitimate non-user data), or
- synthetic fixture that must be isolated to mock/test mode.

Do not delete legitimate defaults merely because they are constants; the deciding factor is whether they falsely represent persisted bakery/user records.

## Verification Strategy

1. CI can start/reset/lint the local Supabase project successfully from `Front-end`.
2. A clean local reset applies all committed migrations without missing-relation failures.
3. Staging deploy links to the configured staging project, pushes migrations, and verifies required tables.
4. With an empty bakery in real Supabase mode, Customers and Orders show empty states with zero synthetic records.
5. Creating a real customer/order persists it and it remains after reload.
6. Mock-mode E2E/unit tests still have deterministic fixtures where explicitly required.

## Rollback

Workflow path corrections can be reverted independently. Runtime fixture cleanup should be implemented incrementally so individual entity paths can be reverted without changing the database schema. No destructive database rollback is part of this change.
