## Purpose

Enables bakery owners and managers to collaborate with other people through role-based memberships and secure, traceable email invitations.

## ADDED Requirements

### Requirement: Bakery memberships use defined roles
The system SHALL persist every bakery membership in canonical table `bakery_memberships` with exactly one role from Owner, Manager, or Staff and SHALL present team actions according to that role.

#### Scenario: Owner views team management
- **WHEN** an owner opens team management for the active bakery
- **THEN** the owner can view members and pending invitations and can access all permitted team-management actions

#### Scenario: Manager views team management
- **WHEN** a manager opens team management for the active bakery
- **THEN** the manager can view members and invitations and can invite or manage staff without receiving owner-only controls

#### Scenario: Staff views the bakery
- **WHEN** a staff member uses the active bakery
- **THEN** the staff member can access permitted bakery work but cannot invite, remove, or change the roles of team members

### Requirement: Authorized users can invite people
The system SHALL let an owner or manager invite a person to the active bakery by email with an allowed role and SHALL record the invitation as pending until it is accepted, declined, revoked, or expired.

#### Scenario: Sending an invitation
- **WHEN** an owner or manager submits a valid email address and permitted role
- **THEN** the system creates one pending invitation for the active bakery and sends an invitation link to that email address

#### Scenario: Duplicate pending invitation
- **WHEN** an authorized user invites an email address that already has a pending invitation to the same bakery
- **THEN** the system does not create a duplicate and identifies the existing pending invitation

#### Scenario: Existing member is invited
- **WHEN** an authorized user invites an email address already associated with a member of the active bakery
- **THEN** the system does not create an invitation and reports that the person is already a member

#### Scenario: Manager attempts owner invitation
- **WHEN** a manager attempts to invite a person with the Owner role
- **THEN** the system rejects the request without creating an invitation

### Requirement: Invitees can accept or decline invitations
The system SHALL let the person addressed by a valid invitation accept or decline it after authenticating with the invited email address.

#### Scenario: Accepting an invitation
- **WHEN** an authenticated user whose verified email matches a valid pending invitation accepts it
- **THEN** the system creates the designated bakery membership exactly once, marks the invitation accepted, and makes the bakery available in the selector

#### Scenario: Auth email is not verified
- **WHEN** an authenticated user's email matches the invitation address but the Auth identity has not verified that email
- **THEN** the system rejects acceptance without creating a membership

#### Scenario: Declining an invitation
- **WHEN** the addressed authenticated user declines a valid pending invitation
- **THEN** the system marks the invitation declined and does not create a membership

#### Scenario: Email does not match
- **WHEN** an authenticated user's verified email does not match the invitation address
- **THEN** the system rejects acceptance without disclosing bakery data

#### Scenario: Invitation is invalid
- **WHEN** an invitation is expired, revoked, already consumed, or otherwise invalid
- **THEN** the system does not create a membership and presents an actionable invitation error

#### Scenario: Invitation expires during consumption
- **WHEN** an authenticated invitee attempts to consume a pending invitation after its expiry
- **THEN** the system creates no membership and durably records the invitation as expired

### Requirement: Authorized users can manage the team
The system SHALL let owners update or remove managers and staff, SHALL let managers update or remove staff, and SHALL protect the bakery from losing its final owner.

#### Scenario: Owner changes a member role
- **WHEN** an owner changes a manager or staff membership to an allowed role
- **THEN** the updated permissions apply to that bakery membership

#### Scenario: Manager manages staff
- **WHEN** a manager changes or removes a staff membership
- **THEN** the system applies the action to that staff membership

#### Scenario: Manager attempts to manage an owner or manager
- **WHEN** a manager attempts to change or remove an owner or another manager
- **THEN** the system rejects the action

#### Scenario: Removing the final owner
- **WHEN** an action would leave a bakery without an owner
- **THEN** the system rejects the action and preserves the existing owner membership

#### Scenario: Transferring ownership
- **WHEN** an owner confirms transfer to an eligible existing member
- **THEN** one atomic authorized operation promotes the successor and demotes the current owner while preserving at least one owner throughout

### Requirement: Team state communicates progress and outcomes
The system SHALL prevent duplicate team-management submissions and SHALL present accessible success or error feedback without exposing invitation secrets.

#### Scenario: Invitation request is pending
- **WHEN** an invitation submission is in progress
- **THEN** the submitting action indicates progress and cannot be submitted again

#### Scenario: Team action fails
- **WHEN** an invitation, role, removal, acceptance, or decline action fails
- **THEN** the relevant interface remains available and presents an accessible error without revealing an invitation token or privileged credential
