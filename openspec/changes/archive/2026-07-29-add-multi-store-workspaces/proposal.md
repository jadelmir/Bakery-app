## Why

The current post-login flow assumes one bakery workspace, so a user cannot operate multiple stores or collaborate with other people inside a shared store. Introducing an explicit bakery selection boundary and store membership management gives every screen a clear active-store context and prepares the app for safe multi-tenant persistence.

## What Changes

- Route authenticated users through a bakery workspace selector before showing bakery business data.
- Create a default bakery for a new owner and preselect the user's default bakery when the selector opens.
- Let users who belong to multiple bakeries select and switch the active bakery without signing out.
- Establish an explicit active-bakery boundary before any local or persisted bakery-domain screen is rendered.
- Add a store team experience where authorized members can invite people by email, review pending invitations, and remove or update members.
- Define owner, manager, and staff membership roles with permission-aware controls.
- Persist bakeries, `bakery_memberships`, invitations, and default-bakery preferences through the Supabase foundation, with workspace-table tenant isolation enforced in the data layer. Keep the active bakery in user-scoped frontend session state and revalidate it against current memberships.
- Update authentication success behavior so login establishes a user session but does not expose bakery data until an active bakery is selected.
- Record and close the remaining workspace security gaps before rollout: least-privilege grants, profile email and hard-delete integrity, verified invite email, durable expired-invitation status, atomic owner transfer, and an approved password policy.

## Capabilities

### New Capabilities

- `bakery-workspace-selection`: Creates, lists, selects, and switches bakery workspaces for authenticated users while maintaining one active bakery context.
- `bakery-team-membership`: Manages store members, roles, email invitations, invitation acceptance, and permission-aware team actions.
- `bakery-tenant-isolation`: Isolates the persisted workspace tables owned by this change and defines the tenant contract that later bakery-domain persistence changes must apply to their own records.

### Modified Capabilities

- `frontend-authentication-shell`: Changes successful login from opening the bakery workspace immediately to establishing a session and entering the bakery selection flow.

## Impact

- Affects the authenticated frontend shell, navigation, workspace header, route guards, local adapters, and responsive tests.
- Adds bakery selection, store switching, team management, invitation, and empty-state interfaces.
- Uses the completed and archived `establish-supabase-backend-foundation` capability for the project-owned client, migrations, generated types, and deployment workflow.
- Adds Supabase tables and policies for bakeries, `bakery_memberships`, invitations, and user defaults; all exposed tables require Row-Level Security.
- Does not persist current local order, production, inventory, customer, or reporting fixtures. The later change that persists each bakery-domain capability owns its `bakery_id` relationship, RLS policies, migration, types, and isolation tests.
- Source implementation, local verification, documentation/accessibility, security remediation, and hosted-development rollout are separate completion gates. Hosted rollout remains blocked until all preceding gates pass and the target project, redirects, SMTP, and rollback procedure are confirmed.

## Non-Goals

- Migrating local bakery-domain fixtures or feature adapters to Supabase.
- Claiming that frontend active-bakery state is a database authorization control.
- Applying migrations or functions to a hosted project as part of source implementation.
- Enabling production invitation delivery before custom SMTP and exact redirects are approved.
