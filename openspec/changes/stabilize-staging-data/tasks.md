# Tasks: Stabilize Staging Data and Remove Runtime Mocks

- [ ] 1.1 Update CI Supabase database steps to execute against `Front-end/supabase` via the `Front-end` working directory.
- [ ] 1.2 Update staging deployment path filters from `supabase/**` to `Front-end/supabase/**` and run link/push/function commands from the correct project directory.
- [ ] 1.3 Add a post-migration staging schema verification gate that fails when required application tables are missing.
- [ ] 1.4 Confirm a clean local Supabase reset applies every committed migration and database lint passes from the corrected project directory.

- [ ] 2.1 Audit runtime imports/usages of hard-coded customer, order, task, recipe, inventory, starter, invoice/payment, and other prototype records.
- [ ] 2.2 Remove hard-coded customers and orders from the normal Supabase-backed runtime path; an empty bakery must display empty states instead.
- [ ] 2.3 Remove or isolate synthetic production-task/order bootstrap state so real runtime does not generate tasks from prototype orders.
- [ ] 2.4 Classify remaining constants as legitimate defaults versus synthetic fixtures; move/retain synthetic fixtures only in explicit mock/test paths.
- [ ] 2.5 Prevent real runtime from silently falling back to local/mock persisted-entity data when Supabase services are expected but unavailable.

- [ ] 3.1 Update unit/component tests to cover zero-customer and zero-order real-runtime states.
- [ ] 3.2 Preserve deterministic mock fixtures for tests/E2E only and verify mock mode still works when explicitly enabled.
- [ ] 3.3 Verify creating a customer and order in Supabase-backed mode persists authoritative records and survives reload.

- [ ] 4.1 Run frontend typecheck, lint, unit tests, build, bundle check, and focused E2E tests.
- [ ] 4.2 Run corrected database CI against a clean local Supabase stack and record evidence of migration/lint success.
- [ ] 4.3 Deploy to staging, record the migration/schema verification result, and confirm the GitHub Pages app shows no synthetic customers/orders for an empty bakery.
