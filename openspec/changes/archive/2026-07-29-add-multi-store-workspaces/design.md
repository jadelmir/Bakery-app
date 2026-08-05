## Context

See `proposal.md` for motivation. The Supabase foundation is complete and archived: the repository owns a typed client, pinned migration workflow, generated database types, and local/hosted verification conventions. This active change owns Supabase Auth plus the persisted workspace boundary; current order, production, inventory, customer, and reporting data remains local prototype state.

This change crosses the authentication shell, navigation, every bakery-scoped feature, database schema, Row-Level Security, and email invitation flow. It must therefore land after the foundation change and must not treat a client-selected bakery identifier as authorization.

## Goals / Non-Goals

**Goals:**

- Connect the existing authentication adapter to Supabase Auth while preserving the current accessible login, signup, request, and logout behavior.
- Require one explicit active bakery after authentication and support safe switching among multiple memberships.
- Create a normalized bakery, membership, invitation, and user-default data model through versioned migrations.
- Enforce tenant isolation and role permissions in Postgres independently of frontend controls.
- Support atomic default-bakery onboarding and invitation acceptance.
- Keep privileged invitation operations and email delivery out of the browser.
- Make bakery context explicit at the authenticated workspace boundary, in workspace/team adapters, and in local view-state reset behavior.

**Non-Goals:**

- Migrating every existing mock order, production, inventory, or reporting record to Supabase in this change.
- Adding billing, subscription limits, franchise hierarchies, cross-bakery aggregate reporting, or custom roles.
- Supporting a person without a Supabase Auth identity as an active member.
- Letting managers grant the Owner role or manage owners and peer managers.
- Storing authorization in user-editable metadata or trusting a bakery identifier from local storage.
- Adding `bakery_id`, persistence, or RLS to local bakery-domain records; each later domain phase owns that work end to end.

## Decisions

### 1. Complete the Supabase foundation first

Implementation begins only after `establish-supabase-backend-foundation` provides the pinned client, CLI, migrations, environment contract, and generated types. This change extends that established migration workflow rather than creating parallel configuration.

The alternative is implementing against dashboard-created tables or a second client boundary. That would create schema drift and duplicate infrastructure.

### 2. Use Supabase Auth behind the existing authentication adapter

The frontend keeps its current adapter-facing contract, but the adapter will use Supabase Auth sessions. Authentication success sets the user session and routes to bakery selection; it does not render bakery data. Logout clears the Supabase session, active-bakery state, and bakery-scoped client caches.

The normal configured runtime uses Supabase Auth. Mock identity remains only for isolated unit and browser scenarios and cannot participate in database authorization or hosted invitation acceptance.

### 3. Use normalized tenant tables and explicit constraints

The migration introduces the following canonical tables:

- `profiles`: one row per Auth user, including a nullable `default_bakery_id`.
- `bakeries`: bakery identity, display name, lifecycle timestamps, and creator audit reference.
- `bakery_memberships`: one row per `(bakery_id, user_id)` with `owner`, `manager`, or `staff`.
- `bakery_invitations`: bakery, normalized email, intended role, inviter, state, expiry, and a hash of an opaque invitation token.

Membership uniqueness is enforced by a composite key or unique constraint on `(bakery_id, user_id)`. Pending invitations are unique by bakery and normalized email. Role and invitation-state values are database-constrained. Foreign keys and columns used by membership, invitation, and RLS lookups receive indexes; common bakery-and-state lookups use composite indexes.

The alternative is embedding bakery lists or roles in profile JSON or JWT metadata. That is harder to constrain, can become stale, and is unsafe when sourced from user-editable metadata.

### 4. Create the first bakery atomically

A single authenticated database operation creates the bakery, owner membership, and default-bakery preference. It derives the user identifier from the authenticated request, is idempotent for repeated onboarding submission, and never accepts an arbitrary owner identifier from the browser.

If privileged database code is required to cross policy boundaries, it will live in a non-exposed schema, use an empty fixed search path, explicitly validate the authenticated user, and expose only the minimum execution privilege. It will not be placed as an unrestricted `SECURITY DEFINER` function in `public`.

The alternative is three client-side inserts. A partial failure could create an ownerless bakery or a default preference pointing at an inaccessible bakery.

### 5. Treat the active bakery as presentation state, not authorization

After login or real Supabase session restoration, the frontend fetches current memberships and shows the selector before rendering bakery-domain screens. The user's valid default bakery is highlighted, but entry still requires confirmation. The active bakery identifier is presentation state, not authorization; if remembered in user-scoped session storage, it must be revalidated against the restored user's current memberships and discarded when inaccessible.

Workspace and team adapters require an explicit bakery identifier where the operation is bakery-scoped. Switching bakeries synchronously discards the prior workspace component and its local bakery-domain view state before mounting the next workspace. This change does not retrofit persisted `bakery_id` columns, cache keys, or RLS into local order, production, inventory, customer, or reporting adapters; the later persistence change for each domain owns that complete boundary.

The alternative is relying on a global mutable store identifier or a client filter. Either can leak cached or unfiltered records across bakery switches.

### 6. Enforce permissions with RLS and current membership rows

Every exposed workspace table has Row-Level Security enabled before grants are provided. Policies target `authenticated` explicitly and use indexed membership lookups based on `(select auth.uid())`. Authorization reads current `bakery_memberships` rows rather than `user_metadata`, client claims, or a bakery list embedded in a potentially stale JWT. Grants must be reduced to the operations each table and public wrapper actually requires; a denying policy is not a substitute for revoking an unnecessary table or function privilege.

Owner, manager, and staff permissions are enforced for both reads and mutations. Update policies include both `USING` and `WITH CHECK`. Tenant foreign keys cannot be reassigned across bakeries through client updates. Policy tests use at least two bakeries and verify positive access, cross-tenant denial, role limits, and access removal.

Where repeated membership checks require a helper, it will be narrowly scoped in a non-exposed schema, validate the caller identity internally, and be covered by database tests and Supabase advisors.

The alternative is frontend-only role gating. Hiding a button does not prevent direct Data API calls.

### 7. Use a server-controlled invitation flow

The frontend invokes an authenticated `send-bakery-invite` Edge Function. The function verifies the caller's current bakery role, normalizes the email, generates a high-entropy one-time token, stores only its hash, and triggers a Supabase Auth one-time email whose redirect carries the opaque invitation token to the app. The browser never receives a secret key or service-role credential.

Invitation acceptance occurs through one authenticated transactional database operation. It locks and validates the pending invitation, confirms that the Auth identity's email is verified and matches the normalized invite address, creates the membership exactly once, and marks the invitation accepted. Decline and revoke actions likewise produce terminal states. An expired attempt must leave a durable `expired` status; raising an exception in the same transaction must not roll that status update back.

Built-in Supabase email delivery is sufficient for development. Production deployment requires configured custom SMTP and approved redirect URLs before invitations are enabled for real users.

The alternative is calling Auth Admin APIs from the frontend or storing raw invitation tokens. Both would expose privileged credentials or reusable invitation secrets.

### 8. Keep role transitions safe and intentionally limited

Owners can manage managers and staff. Managers can invite and manage staff only. The database rejects any action that removes or demotes the final owner. Owner transfer requires one atomic, explicitly authorized operation that promotes the successor and demotes the current owner without an intermediate ownerless or ambiguous state; the product must also decide how that action is exposed and confirmed in the UI.

The alternative is independent membership updates. Concurrent actions could leave a bakery without an owner.

### 9. Introduce the frontend through a workspace boundary

The authenticated shell gains three explicit states: loading memberships, selecting/onboarding a bakery, and rendering an active bakery. A responsive selector appears after authentication, and an authenticated header switcher remains available inside the workspace. Team management lives under the active bakery and derives visible actions from the current membership role.

Adapters isolate persistence details from components. Initial UI tests use deterministic adapter fixtures, while integration tests exercise Supabase-backed session, selection, invitation, and policy behavior.

The alternative is scattering membership checks through existing screens. A central boundary makes it harder to accidentally render stale bakery data.

## Risks / Trade-offs

- [The foundation change is incomplete when implementation starts] → Treat its completed migrations, generated types, and client boundary as a hard prerequisite.
- [An invitation email can be abused for spam] → Require an authenticated authorized inviter, rate-limit by inviter and bakery, deduplicate pending invitations, and record audit timestamps.
- [Default Supabase email delivery is rate-limited and unsuitable for production] → Use it only for development and require custom SMTP plus verified redirect URLs before production invitation rollout.
- [RLS membership checks can become expensive] → Index foreign keys and membership lookup columns, wrap stable auth helpers in `select`, inspect query plans, and run database advisors.
- [Recursive membership policies can cause policy recursion] → Keep helper lookups narrow and isolated in a non-exposed schema, with explicit caller validation and dedicated policy tests.
- [Stale frontend cache can show the previous bakery after a switch] → Include bakery identity in cache keys and synchronously clear bakery-scoped state before loading the next workspace.
- [Removing a member may not invalidate an already rendered screen immediately] → Database policies block subsequent requests; the frontend handles authorization failures by clearing the bakery context and returning to selection.
- [Two onboarding or acceptance submissions can race] → Use unique constraints, row locking where applicable, and idempotent transactional operations.
- [Existing local prototype data has no bakery identifier] → Keep mock fixtures assigned to a deterministic development bakery until each domain is migrated; do not send unscoped mock records to Supabase.
- [Authenticated grants exceed browser needs] → Audit table and function privileges, revoke direct mutation privileges where RPCs are the only supported path, and test denied calls.
- [Profiles can drift from Auth or be hard-deleted independently] → Decide the profile lifecycle contract, prevent self-service email drift and destructive profile deletion, and test Auth-to-profile synchronization.
- [An unverified JWT email can consume an invite] → Require verified Auth email evidence in the acceptance operation and cover verified and unverified paths.
- [Expired status is rolled back with its error] → Persist expiry through a transaction-safe result or separate operation and test the durable terminal state.
- [Local and hosted password settings are weaker than frontend validation] → Approve one minimum length, complexity, and confirmation policy and enforce it consistently in local configuration and the hosted project.

## Open Decisions and Rollout Gates

- Choose the durable profile lifecycle: whether email is always projected from `auth.users`, which profile fields users may edit, and whether a profile row can ever be deleted without deleting the Auth identity.
- Approve the atomic owner-transfer API and its confirmation and recovery UX.
- Approve the password baseline for local and hosted Auth.
- Confirm the hosted development project, exact application redirects, function secrets, custom SMTP launch gate, and forward-migration rollback owner before rollout.

## Migration Plan

1. Complete and verify `establish-supabase-backend-foundation`.
2. Connect the authentication adapter to Supabase Auth and retain existing authentication tests.
3. Create the workspace migration through the pinned Supabase CLI, then add tables, constraints, indexes, onboarding operations, and RLS policies.
4. Reset the local database, regenerate database types, and verify migrations and policies with two-bakery fixtures.
5. Add the authenticated workspace boundary, bakery selector, default-bakery onboarding, and active bakery switcher.
6. Require bakery identifiers in feature adapters and clear bakery-scoped state on every switch.
7. Add team management, the invitation Edge Function, invitation consumption, role management, and final-owner protection.
8. Configure local invitation redirects and development email delivery; document custom SMTP as a production gate.
9. Run database security and performance advisors, frontend quality checks, and desktop/mobile browser tests.
10. Apply the reviewed migration and Edge Function to the hosted development project, regenerate types from the authoritative schema, and rerun tenant-isolation verification.

Rollback before hosted deployment is a normal source revert and local database reset. After hosted deployment, disable the invitation function and ship a reviewed forward migration; do not drop membership or bakery data as an automatic rollback.
