# Tasks: Repair Staging Order Visibility and Invitations

## 1. Ownership and baseline evidence

- [x] 1.1 Record the related active changes (`persist-manual-orders` and `repair-bakery-invitations`) and keep this change limited to the discovered regression and staging integration/acceptance scope. Evidence: updated proposal/design and no duplicated baseline RPC or role work.
- [ ] 1.2 Capture the staging project, frontend URL, deployed commit, migration status, and the exact browser/network error for each reported bug using authorized read-only or synthetic test access.

## 2. Manual-order visibility regression

- [x] 2.1 Add focused frontend coverage for the order projection when `manualOrderSnapshot.orders` is populated while the Supabase-backed domain snapshot contains an empty-but-present `recipesById` object. Trace: manual-order-persistence visibility requirement.
- [x] 2.2 Repair the source-selection boundary so persisted manual orders and generated tasks are authoritative whenever `manualOrderService` is active, without changing mock/local behavior or the persisted RPC contract. Evidence: focused test and code review of the bakery boundary.
- [ ] 2.3 Add or update desktop/mobile Playwright coverage to create an authenticated manual order, observe it immediately in Orders, reload, and observe it again with its task plan. Evidence: persisted staging/local journey, not mock-only success.
- [ ] 2.4 If staging creation fails before rendering, verify the linked `create_manual_order` migration/function, customer/recipe IDs, active-bakery membership, and RLS before considering a forward-only database repair. Do not add schema work without captured evidence.

## 3. Hosted invitation delivery and callback

- [x] 3.1 Add focused Edge Function tests for a configured application pathname, asserting origin validation remains origin-based while the delivered callback preserves `/Bakery-app/` and the opaque token.
- [x] 3.2 Repair callback construction only as needed to preserve the configured hosted application base path; retain local callback behavior, token opacity, authorization, duplicate prevention, and delivery-failure revocation.
- [ ] 3.3 Verify the staging Supabase project has the intended `APP_URL`/function secrets, Auth `site_url`, exact additional redirect URL(s), SMTP/sender configuration, and the current function deployment. Record configuration status without committing secret values.
- [ ] 3.4 Run a synthetic staging invitation as an owner or manager, confirm one pending invitation and delivery initiation, open the delivered link, accept as the verified invitee, reload memberships, and confirm exactly one designated-bakery membership.
- [ ] 3.5 Exercise duplicate, unauthorized-role, invalid-origin, delivery-failure, and wrong-email outcomes. Confirm no false success and no usable invitation remains after delivery initiation fails.

## 4. Documentation and release verification

- [x] 4.1 Update the relevant frontend deployment and API/invitation operations documentation with the staging base URL/path, hosted configuration gates, secret boundaries, and evidence expectations.
- [ ] 4.2 Run the applicable frontend baseline from `Front-end/`: typecheck, lint, Vitest, build, and relevant Playwright suites. Record failures separately from unrelated existing failures.
- [ ] 4.3 Run local Supabase reset/migration, database/RLS invitation and manual-order checks, generated-type checks, and the local invitation verifier where available.
- [x] 4.4 Update `openspec/PROGRAM_MAP.md` with the corrective owner/state and evidence. Do not synchronize or archive related changes until the staging gates pass and the ownership remains coherent.

## Execution evidence

- Focused Vitest: 11/11 passed for the persisted-order projection and invitation callback path.
- Full Vitest: 46 files, 306 tests passed.
- Typecheck, lint, and `git diff --check`: passed after the final file changes.
- OpenSpec validation: this change passes; the repository-wide validator still reports three unrelated pre-existing change-artifact failures (`frontend-ci-cd`, `organize-project-documentation`, and `sort-orders-newest-default`).
- Build, Playwright, local Supabase/type generation, and the local invitation verifier are not yet complete: this environment cannot start Vite because esbuild is denied access to the workspace parent path, Supabase CLI telemetry writes are denied, and the verifier requires local Supabase secrets.
- Hosted tasks 1.2, 2.3, 2.4, 3.3, 3.4, 3.5, and the remaining release verification stay open until authorized staging evidence is captured; no hosted configuration or secret values were guessed or committed.
- Authenticated staging reproduction on `https://jadelmir.github.io/Bakery-app/` on 2026-08-17: creating the available `Yuri` / `Loaf` order redirected to `/orders` but rendered `0 current orders` immediately and after reload; the synthetic invitation request rendered `Failed to send a request to the Edge Function`. The deployed staging build has not yet received this corrective implementation, and the staging Supabase project/configuration cannot be verified from the available browser session.
