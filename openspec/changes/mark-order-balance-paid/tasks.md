## 1. Payment Mutation Contract

- [x] 1.1 Add a bakery-scoped, idempotent full-balance payment operation to the
  order domain port, state controller, and local adapter with focused tests.
- [x] 1.2 Generate a Supabase migration for the atomic member-authorized order
  payment RPC and add database success, repeat, and cross-bakery denial tests.
- [x] 1.3 Add the RPC to the Supabase manual-order service, refresh from the
  authoritative snapshot, and cover adapter success and failure behavior.

## 2. Order Detail Experience

- [x] 2.1 Add a `Mark as Paid` action for orders with a balance, including
  accessible pending and retryable failure states and no action when fully paid.
- [x] 2.2 Connect the Orders screen and bakery workspace to the payment mutation
  without changing lifecycle transition behavior.
- [x] 2.3 Add component, screen, and desktop/mobile browser coverage for marking
  an unpaid or partially paid order as paid.

## 3. Integrated Verification

- [x] 3.1 Rebuild the local Supabase database from committed migrations,
  regenerate database types, and run database tests, lint, and advisors.
- [x] 3.2 Run focused tests followed by typecheck, lint, full Vitest, build, and
  affected Playwright suites; update PROGRAM_MAP evidence.
- [ ] 3.3 Record manual authenticated acceptance before synchronization,
  hosted rollout, or archive.
