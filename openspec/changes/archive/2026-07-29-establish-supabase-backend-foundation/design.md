## Context

The runnable application and its pnpm workspace live under `Front-end/`, while the repository root contains product documents and OpenSpec artifacts. The app currently has no Supabase package, `supabase/` directory, migration history, generated database types, or runtime environment variables. A hosted Supabase development project already exists and is reachable through a project-scoped, OAuth-authenticated MCP connection, but that agent connection is not an application runtime configuration.

Backend Phase 1 must create a reproducible database-development boundary without prematurely introducing authentication, multi-tenant tables, or bakery domain schemas. The implementation must remain compatible with Windows development, the pinned pnpm workflow, the Vite frontend, and the requirement that every database change be represented by a committed migration.

## Goals / Non-Goals

**Goals:**

- Make `Front-end/` a conventional Supabase CLI project that can recreate its database state from committed files.
- Pin the Supabase CLI and JavaScript client in the existing pnpm package and lockfile.
- Establish an imperative, migration-first workflow with explicit local and linked targets.
- Provide a typed, fail-fast Supabase browser-client boundary without replacing mock authentication yet.
- Generate and commit TypeScript database types from the migration-built schema.
- Keep all credentials, local link metadata, and machine-specific state out of version control.
- Prove that the same baseline migration history applies successfully to a clean local stack and the linked hosted development project.

**Non-Goals:**

- Adding profiles, bakeries, memberships, Row-Level Security policies, or Supabase Auth integration.
- Creating ingredients, recipes, customers, orders, production, inventory, payment, invoice, or reporting tables.
- Moving existing mock data or local frontend state into Supabase.
- Configuring Storage buckets, Edge Functions, transactional email, CI/CD deployment, or a production Supabase project.
- Resolving the final frontend hosting provider or provisioning paid Supabase branching.

## Decisions

### 1. Treat `Front-end/` as the Supabase project root

The conventional `supabase/` directory, environment template, Supabase dependencies, generated types, and package scripts will live under `Front-end/`. This keeps the CLI configuration beside the only package manifest and lockfile, so contributors can run the full workflow from the documented application directory.

The alternative is a new repository-root package solely for database tooling. That would introduce a second pnpm package boundary and lockfile ownership question before the project needs one.

### 2. Use pinned project dependencies

`supabase` will be a pinned development dependency and `@supabase/supabase-js` a pinned runtime dependency in `Front-end/package.json`; the existing pnpm lockfile will record the resolved dependency graph. Commands will run through pnpm rather than depending on a global CLI.

The alternative is a global or `latest` CLI invocation. That is less reproducible across contributors and contradicts the project’s pinned-dependency convention.

### 3. Use imperative versioned migrations as the schema source of truth

This phase will initialize the standard `Front-end/supabase/config.toml` and create a harmless baseline migration through the CLI. Future schema changes will start with the CLI’s migration-creation command, be reviewed as SQL, be replayed locally from a clean database, and only then be pushed to a linked hosted environment.

Declarative schemas are not selected because the repository has no `supabase/schemas/` workflow and the current project requirements explicitly center committed SQL migrations. Dashboard-only DDL is prohibited because it creates drift that is not reviewable or reproducible.

### 4. Separate local verification from linked deployment

Local migrations are validated by rebuilding the local stack from committed migrations. Hosted deployment is a distinct, explicit step that first confirms the linked project identity and compares migration history, then applies only pending migrations to the hosted development project. Commands that support local or linked targeting will use explicit target flags where available, discovered from the installed CLI help.

The alternative is relying on command defaults. Supabase commands do not all share the same default target, so implicit targeting increases the risk of changing the wrong database.

### 5. Generate committed types from the migration-built local schema

The canonical generation path will rebuild the local database, then generate `Front-end/src/lib/supabase/database.types.ts` from the local schema. A verification command will regenerate or compare the output so schema/type drift is detectable. Linked-project generation remains a diagnostic fallback, not the normal source of committed types.

Generating from the hosted project by default could hide unapplied local migrations or capture dashboard-only drift.

### 6. Expose only the URL and modern publishable key to Vite

`Front-end/.env.example` will document `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with placeholders. Local `.env` variants and Supabase CLI state will be ignored. Secret keys, service-role keys, database passwords, access tokens, and OAuth credentials must never enter frontend source, checked-in configuration, generated artifacts, or documentation examples.

The typed browser client will validate required configuration and use the generated `Database` type, but existing screens will continue using their current adapters until later phases deliberately connect them.

### 7. Keep the hosted project a development target

The currently linked Supabase project will be documented and verified as the hosted development target for this phase. Production credentials and production deployment automation are deferred until environments and hosting are intentionally provisioned.

Using one undifferentiated project for development and production would make safe migration testing and destructive local workflows harder to reason about.

## Risks / Trade-offs

- [A Docker-compatible runtime may be missing or unavailable on a contributor machine] → Document it as a prerequisite and require a successful local start/reset before the phase completion gate is accepted.
- [The hosted project could be linked incorrectly] → Verify the exact project reference and migration history before any linked push; never use remote reset as part of the normal workflow.
- [A baseline migration can appear to imply feature schema readiness] → Keep it intentionally harmless and document that business tables begin in later backend phases.
- [Generated types can drift from migrations] → Generate from the clean local migration state and include a repeatable drift check in the quality gate.
- [Vite variables are browser-visible] → Allow only the project URL and publishable key; explicitly reject secret or service-role credentials.
- [New public tables may not automatically be exposed through the Data API] → Treat grants, Data API exposure, and Row-Level Security as explicit concerns in each later table-owning phase rather than assuming defaults.
- [Installing the client boundary may be mistaken for completed integration] → Keep the mock adapters active and state clearly that real authentication and persistence begin in later changes.

## Migration Plan

1. Confirm the linked Supabase project is the intended hosted development target and currently has no application tables or pending migration history.
2. Add pinned CLI and JavaScript client dependencies through pnpm.
3. Initialize the Supabase project under `Front-end/` and review generated configuration for secrets or machine-specific values.
4. Add ignore rules, the environment template, the typed client boundary, type-generation output location, scripts, and setup documentation.
5. Create the baseline migration using the installed CLI rather than inventing its timestamp.
6. Start the local stack, rebuild it from migrations, generate types, and run the frontend quality checks.
7. Compare local and hosted migration histories, apply the pending baseline migration to the confirmed hosted development project, and verify the histories match.
8. Run Supabase security and performance advisors and record any relevant findings.

Rollback before hosted deployment is a normal source revert. After hosted deployment, revert application files normally and, if the harmless baseline must be removed from migration history, use a reviewed forward repair plan rather than resetting the hosted project or deleting migration records casually.

## Open Questions

No open decision blocks Backend Phase 1. The final frontend hosting provider, production project strategy, and paid branching choice must be resolved before production deployment automation is introduced.
