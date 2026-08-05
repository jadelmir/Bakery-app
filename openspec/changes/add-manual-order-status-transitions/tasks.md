# Tasks: Add Manual Order Status Transitions

- [x] 1.1 Confirm the persisted `orders.status` constraint, membership/RLS
  update path, and the ownership handoff from `persist-manual-orders`; choose
  the smallest safe persisted mutation boundary without changing public online
  checkout behavior.
- [x] 1.2 Add database coverage for sequential success, skipped/backward
  transition denial, repeated completion denial, and cross-bakery denial. Add
  a migration/RPC only if the existing update boundary cannot enforce the
  contract safely.
- [x] 2.1 Extend the domain order port, mutation result, and controller with a
  bakery-scoped order-status transition command using an operation ID and
  expected current status.
- [x] 2.2 Implement and test the local adapter transition behavior, including
  immutable failure results and no duplicate mutation on retry.
- [x] 2.3 Implement and test the persisted manual-order transition behavior,
  returning an authoritative refreshed snapshot and preserving tenant scope.
- [x] 3.1 Replace the static Orders detail button with status-specific actions,
  pending state, error recovery, and completed/terminal-state handling.
- [x] 3.2 Wire the Orders screen through `BakeryWorkspace` and the shared
  command boundary without coupling the screen directly to Supabase.
- [x] 3.3 Add focused Vitest coverage for each label, allowed transition,
  invalid transition, failure state, and authoritative refresh.
- [ ] 3.4 Add desktop/mobile Playwright coverage for the complete
  `confirmed -> in-production -> ready -> completed` journey and reload
  persistence. Keep existing order-creation and public-storefront journeys
  unchanged.
- [x] 4.1 Run focused database tests (if applicable), type generation/checks,
  Vitest, typecheck, lint, build, and the affected Playwright suites.
- [ ] 4.2 Record manual authenticated acceptance, update delta evidence and
  `openspec/PROGRAM_MAP.md`, and leave the change unarchived until all required
  acceptance gates pass.
