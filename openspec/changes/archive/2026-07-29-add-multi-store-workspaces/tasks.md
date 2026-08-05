Checked items below are source-complete with focused evidence for their stated scope. Unchecked items are labeled as partial source, security remediation, verification, documentation/accessibility, or hosted rollout. The presence of a file alone is not completion evidence.

## 1. Archived prerequisite and authentication source

- [x] 1.1 Treat the completed, archived `establish-supabase-backend-foundation` change as the prerequisite for workspace implementation.
- [x] 1.2 Replace the normal-runtime mock authentication implementation with the typed Supabase Auth client while preserving validation and request states; retain mock identity only for isolated tests and opt-in mock scenarios.
- [x] 1.3 Restore the real authenticated session and ensure logout clears the active bakery and mounted bakery-scoped frontend state.
- [x] 1.4 Add focused shell tests proving successful login enters bakery selection without rendering bakery business data.
- [x] 1.5 [Verification] Add focused Supabase-auth adapter and restored-session tests for `getSession`, auth-state changes, real logout, membership loading, and the rule that restoration cannot bypass bakery selection.

## 2. Workspace schema source and security remediation

- [x] 2.1 Add the workspace migration with `profiles`, `bakeries`, canonical `bakery_memberships`, and `bakery_invitations` tables and constrained roles and states.
- [x] 2.2 Add unique constraints and indexed foreign-key, membership, normalized-email, and invitation-state access paths.
- [x] 2.3 Add an authenticated idempotent operation that atomically creates a default bakery, owner membership, and default-bakery preference.
- [x] 2.4 Add narrowly scoped membership and role authorization helpers in a non-exposed schema where required.
- [x] 2.5 Enable RLS and add explicit authenticated policies for the persisted workspace tables owned by this change.
- [x] 2.6 Add transactional invitation acceptance, decline, revocation, role update, member removal, and final-owner protection operations.
- [x] 2.7 [Verification] Reset the local database from committed migrations, regenerate committed database types, run security and performance advisors, and record results after every security remediation below is complete.
- [x] 2.8 [Security remediation] Reduce authenticated table, schema, and function grants to least privilege, including removal of direct mutation privileges where public RPC wrappers are the supported path.
- [x] 2.9 [Security decision/remediation] Define the Auth-to-profile email and lifecycle contract, prevent user-controlled email drift and independent profile hard deletion, and test synchronization and denial paths.
- [x] 2.10 [Security remediation] Require a verified Auth email for invitation consumption and make an expired invitation's terminal status durable even when consumption returns an error.
- [x] 2.11 [Product/security decision] Add and verify one atomic owner-transfer operation and its confirmation/recovery behavior.
- [x] 2.12 [Security decision/remediation] Approve and enforce one local and hosted password policy, including minimum length, complexity, and secure password-change behavior.

## 3. Active bakery frontend boundary

- [x] 3.1 Add typed workspace and membership adapters for listing bakeries, onboarding, setting defaults, and validating current access.
- [x] 3.2 Add authenticated-shell states for membership loading, bakery selection/onboarding, and active bakery rendering.
- [x] 3.3 Build the responsive bakery selector with default preselection, explicit confirmation, empty-membership onboarding, and accessible request states.
- [x] 3.4 [Partial source] Restore any remembered active bakery only after validating it against the restored user's current memberships, and discard inaccessible or cross-user saved selections before rendering bakery data.
- [x] 3.5 Make bakery identity explicit in workspace/team adapter operations and synchronously discard the prior mounted local bakery view state before loading a switched bakery. Later domain-persistence phases own adding persisted `bakery_id` relationships, cache keys, RLS, and isolation tests to order, production, inventory, customer, and reporting records.
- [x] 3.6 Assign existing local prototype fixtures to deterministic development bakeries without persisting unscoped mock records.

## 4. Team-management frontend

- [x] 4.1 Build the active-bakery team view for current members, roles, and pending invitations.
- [x] 4.2 Add invite-by-email with Owner, Manager, and Staff permission-aware role choices and duplicate-submission prevention.
- [x] 4.3 Add owner and manager controls for permitted role changes, member removal, invitation revocation, and final-owner errors.
- [x] 4.4 Add the invitation landing source flow for authentication, acceptance, decline, and server-returned invalid-invitation outcomes.
- [x] 4.5 [Documentation/accessibility verification] Complete accessible success and error announcements, owner-transfer UX, and supported mobile and desktop interface verification.

## 5. Secure invitation delivery source and documentation

- [x] 5.1 Add the authenticated `send-bakery-invite` Edge Function with current-role authorization and no browser-accessible privileged credentials.
- [x] 5.2 Add normalized-email deduplication, inviter and bakery rate limits, high-entropy token generation, token hashing, expiry, and audit timestamps.
- [x] 5.3 Trigger the Supabase Auth one-time invitation email with an application redirect and opaque invitation token in the source implementation.
- [x] 5.4 [Documentation/configuration] Verify and document local redirect URLs and development email behavior; keep exact hosted redirects and custom SMTP as rollout gates.

## 6. Integrated local verification

- [x] 6.1 [Verification] Expand and run database tests with at least two bakeries covering positive access, all cross-bakery read/write denials, role limits, stale identifiers, access removal, and least-privilege grants.
- [x] 6.2 [Verification] Add real concurrency and idempotency coverage for onboarding, invitation creation and acceptance, final-owner protection, owner transfer, and durable expiry.
- [x] 6.3 [Verification] Expand and run frontend tests for selector gating, restored-session behavior, saved-selection validation, switching/state clearing, role-aware controls, and invitation accept, decline, mismatch, expiry, and consumed outcomes.
- [x] 6.4 [Verification] Run and record desktop and mobile browser journeys for login-to-selection, first-bakery onboarding, multi-bakery switching, team invitation, invitation landing, and logout. Existing mock browser files are evidence inputs, not proof that this gate passed.
- [x] 6.5 [Verification] Run and record database reset, type generation/check, TypeScript, lint, unit tests, browser tests, production build, and Supabase security/performance advisors after all source and remediation work is complete.
- [x] 6.6 [Verification] Add focused Edge Function tests for authentication, origin checks, role authorization, deduplication, rate limits, email-send rollback behavior, and secret handling.

## 7. Hosted development rollout

- [x] 7.1 [Hosted rollout] Confirm the exact hosted development project, review the workspace migration and invitation function, and apply them only after sections 1-6 pass.
- [x] 7.2 [Hosted rollout] Regenerate types from the authoritative hosted schema and rerun tenant-isolation, grant, Auth, redirect, and invitation verification against that project.
- [x] 7.3 [Hosted rollout] Finalize operational documentation for redirects, invitation delivery, custom SMTP, role and owner-transfer permissions, password policy, monitoring, and forward-migration rollback.
