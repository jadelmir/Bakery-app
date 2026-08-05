## ADDED Requirements

### Requirement: Repository-owned Supabase project
The project SHALL maintain its Supabase CLI configuration, migration history, optional development seed file, and related documentation under the runnable application root so a fresh checkout contains the complete non-secret database definition.

#### Scenario: Inspecting a fresh checkout
- **WHEN** a contributor checks out the repository without any machine-local Supabase state
- **THEN** the contributor can identify the committed Supabase configuration, ordered migrations, and documented setup workflow under `Front-end/`

#### Scenario: Reviewing committed configuration
- **WHEN** the repository-owned Supabase files are reviewed
- **THEN** they contain no access token, database password, secret key, service-role key, OAuth secret, or machine-specific link metadata

### Requirement: Pinned Supabase toolchain
The application SHALL use pinned Supabase CLI and JavaScript client dependency versions through the existing pnpm package and committed lockfile.

#### Scenario: Installing project dependencies
- **WHEN** a contributor installs dependencies with the supported pnpm version
- **THEN** the contributor receives the repository-approved Supabase CLI and client versions without requiring a global Supabase installation

#### Scenario: Running database commands
- **WHEN** a contributor follows a documented Supabase command
- **THEN** the command uses the project-pinned CLI through pnpm rather than an unpinned `latest` invocation

### Requirement: Migration-first schema lifecycle
Every database schema change SHALL be represented by an ordered SQL migration committed to version control, and the project SHALL NOT rely on dashboard-only schema changes as the authoritative database state.

#### Scenario: Starting a schema change
- **WHEN** a developer begins a database schema change
- **THEN** the developer creates the migration through the installed Supabase CLI and reviews its SQL before applying it

#### Scenario: Rebuilding the local database
- **WHEN** the local database is reset from a clean state
- **THEN** all committed migrations apply in order without manual dashboard steps

#### Scenario: Detecting hosted drift
- **WHEN** the linked hosted schema or migration history differs from the committed local migration state
- **THEN** deployment stops until the difference is reviewed and reconciled through versioned migration history

### Requirement: Explicit environment targeting
The database workflow SHALL distinguish the local development stack from the linked hosted development project and SHALL require confirmation of the linked project identity before applying hosted changes.

#### Scenario: Running a local verification
- **WHEN** a contributor rebuilds or verifies the development database
- **THEN** the workflow targets the local stack explicitly wherever the installed CLI supports an explicit target

#### Scenario: Preparing a hosted deployment
- **WHEN** a contributor is about to apply pending migrations to Supabase Cloud
- **THEN** the contributor verifies the linked project reference and compares local and hosted migration histories before the push

#### Scenario: Avoiding destructive remote operations
- **WHEN** the normal migration workflow is followed
- **THEN** it never resets the linked hosted database or treats a destructive remote reset as a deployment step

### Requirement: Safe frontend runtime configuration
The frontend SHALL obtain its Supabase project URL and modern publishable key from documented Vite environment variables and SHALL keep all privileged credentials out of browser code and version control.

#### Scenario: Configuring a developer environment
- **WHEN** a developer copies the committed environment template
- **THEN** the template requests only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for browser use

#### Scenario: Protecting local credentials
- **WHEN** a developer creates a local environment file or the Supabase CLI creates machine-local state
- **THEN** repository ignore rules prevent those files from being committed

#### Scenario: Rejecting privileged credentials
- **WHEN** frontend configuration or documentation is reviewed
- **THEN** it contains no Supabase secret key, service-role key, database password, personal access token, or other privileged credential

### Requirement: Typed Supabase client boundary
The frontend SHALL provide a single typed Supabase browser-client boundary that uses generated database types, validates required public configuration, and can be adopted by feature adapters without embedding Supabase setup in presentation components.

#### Scenario: Creating the browser client
- **WHEN** valid public Supabase configuration is present
- **THEN** the client boundary creates a Supabase client parameterized by the generated `Database` type

#### Scenario: Missing public configuration
- **WHEN** code requests the Supabase client without a required public environment variable
- **THEN** the boundary fails with an actionable configuration error rather than creating a partially configured client

#### Scenario: Completing Backend Phase 1
- **WHEN** the foundation client boundary is added
- **THEN** existing mock authentication and local prototype adapters remain active until a later approved change replaces them

### Requirement: Reproducible database types
The project SHALL provide a repeatable command that generates committed TypeScript database types from the schema produced by the local migration history and SHALL provide a way to detect type drift.

#### Scenario: Generating types
- **WHEN** the local database has been rebuilt from committed migrations
- **THEN** the documented generation command produces the canonical database type file at the project-defined path

#### Scenario: Detecting stale types
- **WHEN** the generated output differs from the committed database type file
- **THEN** the verification workflow reports the drift before the change is considered complete

### Requirement: Local and hosted foundation verification
Backend Phase 1 SHALL demonstrate that the same committed baseline migration history can be applied successfully to a clean local database and the confirmed linked hosted development project.

#### Scenario: Verifying the local foundation
- **WHEN** the local Supabase stack starts and resets from committed files
- **THEN** the baseline migrations apply successfully and generated types can be produced

#### Scenario: Verifying the hosted foundation
- **WHEN** pending baseline migrations are applied to the confirmed hosted development project
- **THEN** the hosted and local migration histories report the same applied migrations

#### Scenario: Reviewing post-deployment health
- **WHEN** hosted foundation verification finishes
- **THEN** security and performance advisors are checked and relevant findings are recorded without introducing unrelated feature schema work

### Requirement: Supabase foundation documentation
The repository SHALL document prerequisites, local startup and reset, project linking, migration creation and review, type generation, hosted deployment verification, environment setup, and recovery guidance.

#### Scenario: Onboarding a contributor
- **WHEN** a contributor follows the foundation documentation from a fresh checkout
- **THEN** the contributor can configure public variables, install dependencies, start and rebuild the local stack, generate types, and understand which hosted operations require project confirmation

#### Scenario: Recovering from a failed migration
- **WHEN** a local migration or hosted deployment check fails
- **THEN** the documentation directs the contributor to inspect the error and migration state and avoids destructive hosted resets as a routine recovery step
