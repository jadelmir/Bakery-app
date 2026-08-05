## 1. Preflight and Tooling

- [x] 1.1 Confirm through Supabase MCP that project `strwmmcpewxkigsofsda` is the intended hosted development target, has no application tables, and has no unexpected migration history.
- [x] 1.2 Inspect the current Supabase CLI help for initialization, linking, migration, database reset/push, type generation, and advisor commands before selecting flags or scripts.
- [x] 1.3 Verify the local machine has a supported Docker-compatible runtime for the Supabase development stack and record any environment constraint.
- [x] 1.4 Add exact pinned versions of `supabase` as a development dependency and `@supabase/supabase-js` as a runtime dependency through pnpm, then verify the committed lockfile records them.

## 2. Repository Supabase Foundation

- [x] 2.1 Initialize the Supabase CLI project from `Front-end/` and review `supabase/config.toml` for project-appropriate, commit-safe defaults.
- [x] 2.2 Extend repository ignore rules for local environment files and Supabase machine-local state while retaining commit-safe configuration, migrations, and optional seed data.
- [x] 2.3 Add `Front-end/.env.example` with placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values only, and verify an actual local environment file is ignored.
- [x] 2.4 Create the harmless Backend Phase 1 baseline migration through the pinned CLI, document its non-domain purpose in the SQL, and confirm no authentication or bakery business tables are introduced.

## 3. Typed Client and Database Types

- [x] 3.1 Add the canonical generated type file at `Front-end/src/lib/supabase/database.types.ts` from a database rebuilt using the committed local migrations.
- [x] 3.2 Add a single typed Supabase browser-client boundary that validates the two public Vite variables and does not replace the existing mock authentication or feature adapters.
- [x] 3.3 Add focused tests for valid client configuration and actionable failure when either required public variable is missing.
- [x] 3.4 Add pnpm scripts or checked-in tooling for local Supabase lifecycle commands, type generation, and cross-platform type-drift verification using the pinned CLI.

## 4. Local Reproducibility

- [x] 4.1 Start the local Supabase stack and reset it from a clean state so every committed migration and optional seed step is replayed successfully.
- [x] 4.2 Regenerate database types from the rebuilt local schema and run the type-drift check to confirm the committed output is current.
- [x] 4.3 Run frontend type checking, linting, unit tests, end-to-end tests where the environment supports them, and the production build without connecting existing screens to Supabase.
- [x] 4.4 Inspect the working tree for environment files, CLI link state, access tokens, database passwords, secret keys, or service-role keys and remove any accidental tracked exposure before hosted verification.

## 5. Hosted Development Verification

- [x] 5.1 Link the local Supabase project to the confirmed hosted development project using the project-pinned CLI without committing link credentials or machine-local metadata.
- [x] 5.2 Compare local and hosted migration histories and stop for reconciliation if the hosted project contains unexpected schema or history changes.
- [x] 5.3 Apply only the pending baseline migration to the confirmed hosted development project, then verify local and hosted migration histories match without using a remote reset.
- [x] 5.4 Run Supabase security and performance advisors after the hosted verification and record or resolve findings relevant to this foundation scope.

## 6. Documentation and Phase Gate

- [x] 6.1 Update the frontend setup documentation with prerequisites, pinned pnpm commands, environment setup, local start/reset, migration creation and review, type generation, and safe recovery guidance.
- [x] 6.2 Document hosted project confirmation, migration comparison and push, prohibited destructive remote reset usage, and the separation between development and future production environments.
- [x] 6.3 Update stale prototype-scope documentation and the requirements audit only where Backend Phase 1 changes the verified project status, while keeping Auth and domain persistence marked as later work.
- [x] 6.4 Validate the OpenSpec change and record evidence that the Backend Phase 1 completion gate—consistent migration application in local and hosted development environments—is satisfied.
