## 1. Ownership and provider readiness

- [x] 1.1 Confirm that this change owns only invitation email composition and delivery, while `repair-bakery-invitations`, `repair-staging-order-and-invitations`, and `expand-hosted-staging-e2e` retain their existing ownership boundaries. (Evidence: proposal/design explicitly assign persistence, callback, membership, and E2E acceptance to the related changes.)
- [ ] 1.2 Select the staging email provider and verified sender address; record only secret names, sender requirements, and mailbox retrieval prerequisites in the deployment documentation.
- [x] 1.3 Define the redaction and retention policy for provider message IDs, callback URLs, traces, screenshots, and mailbox evidence. (Evidence: design requires server-side-only credentials, redacted message IDs, no full links or bodies in logs, and sanitized hosted artifacts.)

## 2. Dedicated invitation delivery

- [x] 2.1 Add a server-only invitation mailer abstraction in the `send-bakery-invite` Edge Function with a provider implementation using environment-scoped secrets. (Evidence: `invitation-mail.ts` implements the server-only Resend transport and a test-only Mailpit transport; provider credentials are read only in the Edge Function.)
- [x] 2.2 Generate the Auth handoff link server-side and compose the callback with the existing `/Bakery-app/` base path and opaque invitation token. (Evidence: `index.ts` uses `auth.admin.generateLink`; focused core tests cover local and hosted callback paths and preserve the opaque token in the redirect.)
- [x] 2.3 Resolve the authorized bakery name and invited role server-side and render the dedicated subject, acceptance action, and expiry guidance without trusting browser display fields. (Evidence: `index.ts` reads the bakery name through the service-role client and `invitation-mail.ts` renders bakery, role, recipient, action, and expiry content; composition tests pass.)
- [x] 2.4 Replace the generic Auth email send with the custom sender while preserving the existing invitation RPC, duplicate prevention, verified-email matching, and acceptance screen. (Evidence: `index.ts` no longer calls `signInWithOtp`; `invite-core.ts` retains the existing invitation RPC flow and duplicate/error mapping; focused tests pass.)
- [x] 2.5 Revoke or invalidate the invitation on link-generation or provider failure and return an actionable error; report success only after provider acceptance. (Evidence: `invite-core.ts` revokes after link/provider failure and returns 502; focused failure test verifies revocation, and provider rejection is covered by mailer tests.)

## 3. Verification coverage

- [x] 3.1 Add focused unit tests for message composition, callback/token preservation, redaction, provider failure, and revocation behavior. (Evidence: 13 focused Vitest tests passed across `invite-core.test.ts` and `invitation-mail.test.ts`.)
- [ ] 3.2 Extend local Supabase/Mailpit verification to inspect the dedicated subject/body, follow the callback, accept the invitation, and verify exactly one membership reload.
- [ ] 3.3 Add hosted staging mailbox retrieval using CI-only secrets, bounded polling, and a run-scoped invitee address without exposing mailbox credentials to the browser.
- [ ] 3.4 Verify hosted delivery, callback routing, invited-email matching, acceptance, duplicate rejection, revoke/expiry, and failed-delivery cleanup on desktop and mobile.

## 4. Deployment and evidence

- [ ] 4.1 Configure the staging provider secret, verified sender, domain authentication, Auth URL allow-list, and Edge Function deployment without putting secrets in Git or Pages.
- [x] 4.2 Add the mailbox/provider prerequisites and manual-dispatch workflow inputs to hosted E2E documentation, keeping the current staging identity and active bakery boundary. (Evidence: deployment documentation records provider, sender, secret, mailbox, and artifact boundaries; `deploy-staging.yml` reads the two provider secrets from the GitHub `staging` Environment and fails fast when either is absent.)
- [ ] 4.3 Run focused tests, local Supabase verification, frontend baseline checks, and the hosted invitation journey; record exact pass/fail evidence and provider configuration failures.
- [ ] 4.4 Update the invitation operations documentation and `openspec/PROGRAM_MAP.md` only after the declared local and hosted acceptance gates pass.
