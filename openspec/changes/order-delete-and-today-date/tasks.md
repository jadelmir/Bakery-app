## 1. Date default and domain contracts

- [x] 1.1 Add a local-calendar `YYYY-MM-DD` date-key helper and focused tests covering normal dates, local timezone boundaries, and a new form opened after the calendar date changes. Trace: `order-creation-defaults` requirements. Evidence: `constants.test.ts` and focused Vitest run.
- [x] 1.2 Update `AddOrderModal` to initialize Pickup Date from the helper when the modal opens, keep the field editable, and extend component coverage for today's default and intentional date overrides. Trace: `order-creation-defaults` requirements. Evidence: `AddOrderModal.test.tsx` focused coverage.
- [x] 1.3 Add typed delete input/result contracts to the order/domain boundaries without changing existing create, transition, or payment contracts. Trace: `order-deletion` requirements. Evidence: typecheck passed.

## 2. Order deletion persistence

- [x] 2.1 Implement local-adapter deletion so the selected order, dependent items, and generated tasks leave the authoritative local snapshot atomically, with bakery-scope and failure tests. Trace: local scenarios in `order-deletion`. Evidence: `localAdapter.test.ts` focused coverage.
- [x] 2.2 Implement the Supabase manual-order deletion path using active-bakery and order-id predicates, return the deleted identifier, reload the authoritative snapshot, and verify existing foreign-key cascades/RLS/grants. Add a committed migration/RPC only if focused verification proves direct deletion insufficient. Trace: persisted and cross-bakery scenarios in `order-deletion`. Evidence: adapter query tests plus existing migration review confirmed bakery RLS, authenticated DELETE grants, and cascading order-item/task foreign keys; no schema change was needed.
- [x] 2.3 Add adapter/service tests proving successful deletion, no-match or permission failure, dependent-task absence, and reload absence. Trace: `order-deletion` requirements. Evidence: `manualOrderAdapter.test.ts` and `localAdapter.test.ts` focused coverage.

## 3. Order detail interaction and workspace integration

- [x] 3.1 Add the accessible delete action and alert-dialog confirmation to the order detail, including cancel, pending, error, retry, and success-close behavior. Trace: confirmation and failure requirements. Evidence: OrdersScreen focused tests.
- [x] 3.2 Wire deletion through `BakeryWorkspace` for local and persisted services, consume the authoritative result, and ensure queue counts, filters, selected detail, and generated task projections update together. Trace: successful deletion requirements. Evidence: typecheck passed and authoritative adapter flows are covered.
- [x] 3.3 Add OrdersScreen and workspace regression coverage for deleting current, completed, draft, or cancelled visible orders according to the final supported scope, including no mutation on cancel and no false success on failure. Trace: `order-deletion` requirements. Evidence: OrdersScreen focused coverage for confirmation, cancel, success, and retry failure.

## 4. Verification and rollout

- [ ] 4.1 Add or update authenticated desktop/mobile browser coverage to open an order, confirm deletion, verify it disappears, reload, and verify it remains absent; cover New Order showing the current local date. Trace: persisted deletion and date-default scenarios. Automated mock-browser coverage is blocked by its non-persistent mock backend; authenticated real-backend coverage is blocked locally by missing Supabase credentials and awaits staging deployment.
- [x] 4.2 Run focused tests plus `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, and `pnpm run build`; run local Supabase reset/RLS checks if database behavior changes. Record evidence and blockers. Evidence: focused Vitest 66/66 passed; typecheck, lint, and build passed; full Vitest had 311/312 passing with one unrelated pre-existing `state/provider.test.tsx` selector-render failure; no database migration was needed, so local migration reset was not applicable.
- [ ] 4.3 Deploy through staging, complete authenticated delete/reload and today's-date acceptance, update `openspec/PROGRAM_MAP.md` and relevant docs with evidence, then leave hosted rollout open if any gate is not verified.
