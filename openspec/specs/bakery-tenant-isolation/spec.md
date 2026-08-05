# bakery-tenant-isolation Specification

## Purpose
Protects the persisted workspace tables owned by this change through membership-based isolation independently of the frontend's active-bakery selection, while defining the boundary later bakery-domain persistence changes must adopt.
## Requirements
### Requirement: Persisted workspace records have an owning bakery
Every persisted `bakery_memberships` and invitation record SHALL carry an immutable owning bakery identifier, while profiles remain user-owned and may reference only a default bakery in which that user has a current membership.

#### Scenario: Creating a workspace record
- **WHEN** an authorized operation creates a `bakery_memberships` or bakery invitation record
- **THEN** the record is associated with one bakery and cannot be reassigned through an unauthorized update

#### Scenario: A later phase persists bakery-domain data
- **WHEN** a later approved change persists order, production, inventory, customer, reporting, or other bakery-domain records
- **THEN** that owning change adds the database-enforced bakery relationship, RLS policies, generated types, adapters, and isolation tests for those records

### Requirement: Membership controls workspace data access
The data layer SHALL authorize workspace-table reads and writes from the authenticated user's current membership and role in the record's owning bakery.

#### Scenario: Member reads active bakery workspace data
- **WHEN** an authenticated user requests workspace records for a bakery in which they have an active membership
- **THEN** the data layer returns only workspace records allowed by that membership and role

#### Scenario: Non-member requests workspace data
- **WHEN** an authenticated user requests workspace records for a bakery in which they have no active membership
- **THEN** the data layer returns no protected workspace records and does not disclose bakery details

#### Scenario: Cross-bakery workspace mutation is attempted
- **WHEN** a user attempts to create, update, or delete a workspace record under a bakery not allowed by their membership and role
- **THEN** the data layer rejects the mutation regardless of the frontend's active-bakery value

### Requirement: Invitations do not grant early access
A pending, declined, revoked, or expired invitation SHALL NOT grant access to bakery data or team-management actions.

#### Scenario: Pending invitee requests bakery data
- **WHEN** a person has a pending invitation but no accepted membership
- **THEN** the data layer denies access to that bakery's protected records

### Requirement: Membership changes take effect without relying on stale claims
The system SHALL evaluate bakery membership and role from current persisted membership state rather than user-editable metadata or a stale client-selected bakery identifier.

#### Scenario: Member is removed
- **WHEN** a user's bakery membership is removed
- **THEN** subsequent protected requests no longer return or mutate that bakery's data even if the client still holds its identifier

#### Scenario: Member role changes
- **WHEN** a user's bakery role is changed
- **THEN** subsequent protected actions are authorized according to the current persisted role

### Requirement: Tenant policies are verified
The system SHALL provide automated checks proving that authenticated users cannot read or mutate another bakery's protected workspace records and cannot bypass RPC boundaries through excess grants.

#### Scenario: Isolation test uses two bakeries
- **WHEN** the tenant-isolation verification suite runs with users from separate bakeries
- **THEN** cross-bakery reads return no protected workspace records and cross-bakery writes are rejected

#### Scenario: Direct privileges are inspected
- **WHEN** workspace security verification runs
- **THEN** authenticated users have only the table and function privileges required by supported browser operations

### Requirement: Profile identity fields follow Auth
Profile identity fields SHALL be projected from the corresponding Auth identity, SHALL NOT be directly rewritten by the browser, and a profile SHALL NOT be independently hard-deleted while its Auth identity remains active.

#### Scenario: A user attempts to rewrite profile email
- **WHEN** an authenticated user directly updates the profile email to a value that differs from `auth.users`
- **THEN** the data layer rejects the update and preserves the Auth-projected email

#### Scenario: A user attempts to delete only the profile
- **WHEN** an authenticated user directly deletes the profile while the Auth identity remains active
- **THEN** the data layer rejects the deletion and preserves the workspace identity record

### Requirement: Recipe records are membership-isolated

Recipe rows SHALL be protected by row-level security and accessible only when
the authenticated user has a current membership in the row's owning bakery.
The policy SHALL apply the same boundary to reads and writes.

#### Scenario: A bakery member reads and edits its recipes

- **WHEN** an authenticated member selects or updates a recipe owned by a
  bakery in which they currently have membership
- **THEN** the operation succeeds for that bakery's rows

#### Scenario: A cross-bakery recipe read is attempted

- **WHEN** an authenticated user selects recipes owned by a bakery in which
  they have no current membership
- **THEN** no protected recipe row is returned

#### Scenario: A cross-bakery recipe mutation is attempted

- **WHEN** an authenticated user attempts to insert, update, or delete a
  recipe under a bakery in which they have no current membership
- **THEN** the data layer rejects the mutation regardless of the active bakery
  identifier supplied by the client

#### Scenario: Anonymous storefront access is attempted

- **WHEN** an unauthenticated caller requests recipe rows directly
- **THEN** the caller receives no recipe data and cannot use recipes RLS as a
  substitute for the published storefront boundary
