## Why

The Bakery app has a working local frontend prototype and an authenticated Supabase project connection, but it has no repository-owned Supabase configuration, migration history, generated database types, or repeatable local-to-hosted database workflow. Backend Phase 1 establishes that foundation now so later authentication and domain phases can add persistent data safely without dashboard-only changes or environment-specific drift.

## What Changes

- Initialize a project-scoped Supabase development structure with commit-safe local configuration and a versioned migration directory.
- Establish an imperative, migration-first database workflow that can rebuild a clean local database and apply the same migration history to the linked hosted development project.
- Add pinned Supabase CLI and JavaScript client dependencies through the existing pnpm workflow, with the lockfile committed.
- Define safe Vite environment-variable conventions using the project URL and a modern publishable key while excluding secrets, service-role keys, database passwords, and local environment files from version control.
- Add a typed Supabase client boundary and a repeatable command for generating committed TypeScript database types from the authoritative schema.
- Document local prerequisites, project linking, migration creation and verification, type regeneration, and hosted deployment checks.
- Verify the empty foundation locally and against the linked development project without introducing authentication, bakery workspaces, or bakery domain tables in this phase.

## Capabilities

### New Capabilities

- `supabase-backend-foundation`: Defines the reproducible Supabase configuration, migration, environment, client, type-generation, and verification contract required before feature schemas are introduced.

### Modified Capabilities

None.

## Impact

- Adds repository-owned Supabase files under `supabase/`, generated database types, safe environment templates, and setup documentation.
- Updates frontend package metadata, pnpm lockfile, scripts, ignore rules, and the Supabase client boundary.
- Establishes the linked Supabase development project as a deployment target while keeping credentials and local CLI state outside version control.
- Creates the prerequisite for Backend Phase 2 authentication and bakery-workspace isolation; no user-facing workflow or production data model changes are included.
