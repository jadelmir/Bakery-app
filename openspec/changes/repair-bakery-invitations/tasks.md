## 1. Baseline and ownership

- [x] 1.1 Record the current mock-only Playwright coverage and run focused invitation unit/database checks to establish the failure surface.
- [x] 1.2 Confirm no active change owns `bakery-team-membership`, assign invitation integration files to this change, and document any shared `App`/Auth coordination before editing.

## 2. Real invitation delivery path

- [x] 2.1 Trace and, if needed, repair `WorkspaceAdapter.inviteMember` error handling so non-2xx Edge Function responses reach the accessible Team access error state without reporting success.
- [x] 2.2 Verify the `send-bakery-invite` Edge Function’s origin, bearer-session, role, bakery, duplicate, rate-limit, token-hash, expiry, and Auth delivery contracts against the current migrations and generated types.
- [x] 2.3 Repair only confirmed local integration defects in the Edge Function/RPC/configuration boundary, including delivery-failure cleanup and exact invitation redirect construction.
- [x] 2.4 Add focused tests for successful creation, duplicate/member conflicts, manager owner-role rejection, rate limiting, invalid origin/session, Auth delivery failure cleanup, and secret-safe error responses.

## 3. Invitee handoff and acceptance

- [x] 3.1 Verify the invitation link preserves the opaque token through unauthenticated login or magic-link session establishment and renders the invitation landing instead of bakery data.
- [x] 3.2 Add focused tests for matching verified acceptance, membership reload/selector availability, replay, mismatch, unverified email, expiry, decline, and accessible errors.
- [ ] 3.3 Confirm the database/RLS suite proves exactly-once membership creation, durable terminal invitation states, authorized role boundaries, and no cross-bakery disclosure; add a migration only if a confirmed defect requires it.

## 4. Real-backend browser and local evidence

- [x] 4.1 Add a local Supabase verification harness using unique synthetic inviter/invitee identities and cleanup-safe data to create an invitation through the Edge Function and inspect the Mailpit message/redirect.
- [x] 4.2 Follow the delivered invitation through Auth handoff and acceptance, then assert persisted accepted state, exactly one membership, and bakery visibility after a fresh membership load.
- [x] 4.3 Replace or supplement the current mock-only Playwright invitation journey with required real-backend coverage; retain mock coverage only for deterministic UI behavior that cannot depend on Mailpit.
- [x] 4.4 Cover owner and manager invitation journeys plus failure states in desktop/mobile browser checks, including duplicate submission prevention and accessible status/alert assertions.

## 5. Documentation and release gates

- [x] 5.1 Update the multi-store workspace operations guide with local Mailpit steps, required function/Auth configuration, and the distinction between mock and real invitation verification.
- [ ] 5.2 Run the frontend typecheck, zero-warning lint, focused/full Vitest, relevant Playwright, build, local Supabase reset/database tests, generated-type check, and security/performance advisors; record exact evidence.
- [ ] 5.3 Verify hosted `APP_URL`, Auth redirect allow-list, SMTP/sender configuration, Edge Function secrets/version, and a synthetic hosted invitation when authorized; otherwise record the external gate as blocked rather than inferred.
- [x] 5.4 Update the OpenSpec task evidence and `openspec/PROGRAM_MAP.md` only after implementation and verification agree; leave synchronization/archive for a separate approved lifecycle step.

## Verification Evidence (2026-08-15)

- Focused invitation/App Vitest: 16/16 passed, including `invite-core`, `InvitationLanding`, workspace Edge Function error handling, and invitation token/membership reload.
- TypeScript check: passed.
- Real local Supabase verifier: passed. It created temporary confirmed users, invoked the Edge Function, found the Auth email in Mailpit, accepted the invitation, confirmed one invitee staff membership, rejected replay, and cleaned up.
- Real-backend Playwright invitation config: 2/2 passed across desktop and mobile. It sent a real invitation, surfaced duplicate pending feedback, and revoked the temporary invitation.
- Local Supabase database lint: passed with no schema errors.
- Frontend typecheck: passed.
- Frontend lint: passed with zero warnings.
- Frontend build: passed.
- Full Vitest: 266 passed and 5 failed across four existing production/inventory expectation files; the invitation/App acceptance test passed. The failures are in production-note, shopping-list, production timeline, and order sorting assertions outside this change.
- Multi-store pgTAP: 24 passed and 4 failed (tests 8-10 and 12) on existing grant/RLS error-message expectations; invitation acceptance/replay checks did not fail.
- Generated database types are stale; hosted Auth/SMTP/Edge Function configuration remains unverified because no hosted project authority was provided.
