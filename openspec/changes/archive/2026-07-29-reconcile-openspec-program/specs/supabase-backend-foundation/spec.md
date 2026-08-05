## Purpose

Provides the repository-owned, migration-first Supabase configuration, safe environment contract, typed client boundary, reproducible database types, and local/hosted verification workflow on which persisted backend capabilities depend.

## MODIFIED Requirements

### Requirement: Typed Supabase client boundary
The frontend SHALL provide a single typed Supabase browser-client boundary that uses generated database types, validates required public configuration, and can be adopted by approved feature adapters without embedding Supabase setup in presentation components. Adoption by later changes SHALL NOT expand the foundation itself into feature-schema ownership.

#### Scenario: Creating the browser client
- **WHEN** valid public Supabase configuration is present
- **THEN** the client boundary creates a Supabase client parameterized by the generated `Database` type

#### Scenario: Missing public configuration
- **WHEN** code requests the Supabase client without a required public environment variable
- **THEN** the boundary fails with an actionable configuration error rather than creating a partially configured client

#### Scenario: A later capability adopts the boundary
- **WHEN** an approved authentication, workspace, or bakery-domain change adopts the typed client
- **THEN** that change owns its feature schema and adapter behavior while the foundation continues to own shared configuration, migrations, types, and verification conventions
