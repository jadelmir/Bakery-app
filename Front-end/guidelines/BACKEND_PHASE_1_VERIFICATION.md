# Backend Phase 1 Verification

Verified on July 29, 2026.

## Toolchain

- pnpm 11.9.0 remains the supported package manager.
- Supabase CLI 2.110.0 is pinned as a project development dependency.
- `@supabase/supabase-js` 2.111.0 is pinned as a runtime dependency.
- Docker Desktop 4.59.0 provides Docker Engine 29.2.0.
- Docker was installed but its daemon was initially stopped; starting Docker
  Desktop restored the local-container prerequisite.

## Local database verification

- The local Supabase stack started successfully.
- A clean reset applied
  `20260729133759_backend_phase_1_foundation.sql` and
  `20260729135107_secure_existing_rls_auto_enable.sql`.
- `supabase/seed.sql` ran successfully and intentionally inserted no data.
- Generated public-schema TypeScript types are current.
- The migrations create no authentication or bakery domain objects.

The first reset after updated container images were downloaded ended during
container bootstrap. Once the images completed and the database container was
healthy, a second clean reset succeeded. No migration SQL change was needed.

## Hosted development verification

- Confirmed project: `strwmmcpewxkigsofsda`
- Public application tables after verification: none
- Local and hosted migration histories contain the same two migrations.
- The initial security advisor scan found an inherited
  `public.rls_auto_enable()` SECURITY DEFINER function executable by browser
  roles.
- The conditional forward migration preserves that event-trigger helper while
  revoking execute from `PUBLIC`, `anon`, and `authenticated`.
- Security advisors report no remaining findings.
- Performance advisors report no findings.
- No hosted database reset was used.

## Frontend verification

- TypeScript checking passed.
- ESLint passed.
- Vitest passed with 31 tests across 6 files.
- Playwright passed with 6 desktop/mobile tests.
- The Vite production build passed.
- Existing screens still use mock authentication and local prototype adapters.

## Credential hygiene

- `.env.example` is the only environment-shaped file outside ignored runtime
  directories.
- No credential-shaped values were found outside ignored runtime directories.
- Local environment files, `supabase/.temp`, and `supabase/.branches` are
  excluded by repository ignore rules.
- This workspace does not currently include `.git` metadata, so ignore coverage
  was verified by rule and filesystem inspection rather than Git index checks.
