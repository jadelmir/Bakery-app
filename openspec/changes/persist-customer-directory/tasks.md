# Tasks: Persist Customer Directory

- [x] 1.1 Confirm the existing customers schema and RLS contract; add a
  bakery-scoped type constraint/migration only if Wholesale/Retail is not yet
  persisted. Add positive, denial, and rollback coverage.
- [x] 2.1 Implement the Supabase customer load/create/update adapter and map
  backend rows to `DomainCustomer` with generated IDs and typed failures.
- [x] 2.2 Extend the shared domain controller/adapter composition so customer
  mutations dispatch authoritative `changes.customers` in both live and mock
  modes. Regenerate database types if schema changes.
- [x] 3.1 Route authenticated `BakeryWorkspace` through the persisted adapter
  while preserving `VITE_USE_MOCK_BACKEND` behavior. Remove live dependence on
  the CustomerManager fallback fixture.
- [x] 3.2 Add pending/error handling and ensure Add Customer only closes after a
  successful backend result; show the returned customer in the directory.
- [x] 3.3 Add focused Vitest coverage and desktop/mobile Playwright coverage for
  create, immediate visibility, reload persistence, edit, failure, and bakery
  isolation.
- [ ] 4.1 Run local database checks where applicable and the frontend baseline:
  typecheck, lint, test, build, plus manual authenticated acceptance. Record
  evidence and update this change's artifacts; do not archive until approved.

## Evidence

- Customer migration and pgTAP coverage: 13/13 local tests pass.
- Customer adapter, domain-state, and component tests: 13/13 focused tests pass.
- Full Vitest suite: 180/180 passes when run serially; the default parallel
  run has one pre-existing local-adapter isolation failure.
- Full lint, typecheck, production build, and generated-type check pass.
- Customer Playwright journey passes desktop/mobile (2/2); its reload assertion
  is intentionally limited to authenticated persistence because mock mode is
  session-local.
- Remaining gate: manual authenticated Add Customer, reload, and bakery
  isolation acceptance before spec synchronization/archive.
