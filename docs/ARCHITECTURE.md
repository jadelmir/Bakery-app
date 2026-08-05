# Bakery App Architecture

## 1. Stack Overview
- The application uses a pure client-side React SPA paired directly with Supabase as its unified backend infrastructure.
- No custom API server (such as Express or NestJS) is required; PostgREST Data API handles RLS-protected database operations.
- PostgreSQL database functions execute multi-table atomic operations, and Supabase Storage holds private invoice PDF assets.
- Supabase Edge Functions handle secret-bearing operations, transactional email delivery, PDF rendering, and external webhooks.

## 2. Auth Flow
- Supabase Auth manages user credentials, JWT session tokens, and automatic refresh token rotation.
- `App.tsx` acts as the root auth shell, using `AuthProvider` to monitor authentication state via `supabase.auth.getSession()` and `onAuthStateChange`.
- Unauthenticated users are routed to `AuthScreen` / `LoginScreen` protected by `ProtectedRoute`.
- Authenticated users load memberships from `bakery_memberships` via `WorkspaceAdapter` and select an active bakery in `WorkspaceSelector`.
- Mounting `BakeryWorkspace` initializes `BakeryDomainProvider` with the selected `bakeryId` for downstream screens.

## 3. State Management
- Data access is decoupled from UI components using abstract domain adapters (`BakeryDomainAdapter` and `WorkspaceAdapter`).
- Two adapter implementations exist: `createLocalBakeryAdapter` (in-memory mock storage for development/testing) and the Supabase production adapter.
- `BakeryDomainProvider` (in `state/provider.tsx`) exposes domain data via React Context using custom hooks (`useBakeryDomain`, `useBakeryDomainSelector`) and reducers.
- Transient component UI state (such as modal open flags, active tab selections, and form inputs) is held in local React state within `BakeryWorkspaceInner`.

## 4. Tenant Isolation
- Multi-tenancy is enforced via PostgreSQL Row-Level Security (RLS) policies requiring a valid `bakery_id` on every top-level table.
- Database policies check that `auth.uid()` has an active row in `bakery_memberships` for the queried `bakery_id`.
- Multi-bakery switching occurs in `App.tsx`: choosing a bakery updates `sessionStorage` (`bakery:<userId>`), re-keying `BakeryWorkspace` to reset context with the new `bakeryId`.
- Frontend Data API queries explicitly include `.eq("bakery_id", activeBakeryId)`, ensuring authorization is verified at both client and database layers.

## 5. Secret Isolation
- Client-side code and browser bundles receive only non-sensitive environment variables prefixed with `VITE_` (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Private credentials—such as `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DATABASE_PASSWORD`, and webhook secrets—must NEVER carry a `VITE_` prefix or be committed to Git.
- Server-only secrets are stored exclusively in hosted Supabase Edge Function secrets or deployment platform secret stores.
- Strict environment separation prevents dev, staging, and production credentials from crossing environment boundaries.

## 6. Frontend Module Boundaries
- `screens/`: Top-level page views (HomeScreen, OrdersScreen, ProductionScreen, InventoryScreen, FinancesScreen, SettingsScreen, MoreScreen).
- `navigation/`: Navigation components including Sidebar, BottomNav, FAB, and dirty form guard context.
- `components/`: Feature-specific UI components (orders/, production/, inventory/, recipes/, customers/, invoicing/, storefront/, shared/, ui/).
- `domain/`: Abstract data adapter contracts, local memory adapters, and Supabase client Data API integrations.
- `state/`: React Context providers, state selectors, action reducers, and domain hooks.
- `planning.ts`: Core calculations for ingredient requirements, sourdough starter builds, and inventory deductions.
- `production.ts`: Production flow definitions, task status enumerations, and step timing helpers.
- `reporting.ts`: Financial calculation logic aggregating gross sales, manual expenses, and cost metrics.

## 7. CI/CD and Environments
- **3-Tier Environments**: 1) Local Dev (Supabase CLI + Docker + synthetic `seed.sql`), 2) Staging (Supabase Free Project #1 for UAT), 3) Production (Supabase Free Project #2 for live operations).
- **Git Source of Truth**: All database schemas, RLS policies, and RPC functions are versioned SQL files under `supabase/migrations/`; manual studio edits are forbidden.
- **Automated Pipelines**: Pushing to `develop` triggers staging deployments (`deploy-staging.yml`). Merging to `main` requires Owner gate approval and triggers production deployment (`deploy-production.yml`).
- **Pre-Release Snapshots**: Production deployments automatically create an encrypted pre-deployment database backup (`backup-production.yml`) prior to applying pending SQL migrations.
