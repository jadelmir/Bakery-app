## 1. Date default and domain contracts

- [ ] 1.1 Add a local-calendar `YYYY-MM-DD` date-key helper and focused tests covering normal dates, local timezone boundaries, and a new form opened after the calendar date changes. Trace: `order-creation-defaults` requirements.
- [ ] 1.2 Update `AddOrderModal` to initialize Pickup Date from the helper when the modal opens, keep the field editable, and extend component coverage for today's default and intentional date overrides. Trace: `order-creation-defaults` requirements.
- [ ] 1.3 Add typed delete input/result contracts to the order/domain boundaries without changing existing create, transition, or payment contracts. Trace: `order-deletion` requirements.

## 2. Order deletion persistence

- [ ] 2.1 Implement local-adapter deletion so the selected order, dependent items, and generated tasks leave the authoritative local snapshot atomically, with bakery-scope and failure tests. Trace: local scenarios in `order-deletion`.
- [ ] 2.2 Implement the Supabase manual-order deletion path using active-bakery and order-id predicates, return the deleted identifier, reload the authoritative snapshot, and verify existing foreign-key cascades/RLS/grants. Add a committed migration/RPC only if focused verification proves direct deletion insufficient. Trace: persisted and cross-bakery scenarios in `order-deletion`.
- [ ] 2.3 Add adapter/service tests proving successful deletion, no-match or permission failure, dependent-task absence, and reload absence. Trace: `order-deletion` requirements.

## 3. Order detail interaction and workspace integration

- [ ] 3.1 Add the accessible delete action and alert-dialog confirmation to the order detail, including cancel, pending, error, retry, and success-close behavior. Trace: confirmation and failure requirements.
- [ ] 3.2 Wire deletion through `BakeryWorkspace` for local and persisted services, consume the authoritative result, and ensure queue counts, filters, selected detail, and generated task projections update together. Trace: successful deletion requirements.
- [ ] 3.3 Add OrdersScreen and workspace regression coverage for deleting current, completed, draft, or cancelled visible orders according to the final supported scope, including no mutation on cancel and no false success on failure. Trace: `order-deletion` requirements.

## 4. Verification and rollout

- [ ] 4.1 Add or update authenticated desktop/mobile browser coverage to open an order, confirm deletion, verify it disappears, reload, and verify it remains absent; cover New Order showing the current local date. Trace: persisted deletion and date-default scenarios.
- [ ] 4.2 Run focused tests plus `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`; run local Supabase reset/RLS checks if database behavior changes. Record evidence and blockers.
- [ ] 4.3 Deploy through staging, complete authenticated delete/reload and today's-date acceptance, update `openspec/PROGRAM_MAP.md` and relevant docs with evidence, then leave hosted rollout open if any gate is not verified.
