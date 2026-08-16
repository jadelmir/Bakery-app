## MODIFIED Requirements

### Requirement: Authorized users can invite people
The system SHALL let an owner or manager invite a person to the active bakery by email with an allowed role, SHALL persist exactly one pending invitation for the active bakery, and SHALL send a usable invitation link through the configured Supabase Auth delivery path. A successful UI response SHALL correspond to successful persisted invitation creation and email-delivery initiation; mock adapters MAY be used only for isolated UI tests.

#### Scenario: Sending a real invitation
- **WHEN** an owner or manager submits a valid email address and permitted role through the Supabase-backed application
- **THEN** the system creates one pending invitation for the active bakery and sends an invitation link whose callback returns to the application invitation landing flow

#### Scenario: Invitation delivery fails
- **WHEN** the invitation record is created but Supabase Auth cannot initiate delivery
- **THEN** the system marks the invitation unusable or revokes it, reports an actionable delivery error, and does not display a successful invitation result

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
The system SHALL let the person addressed by a valid invitation accept or decline it after authenticating with the invited email address, SHALL preserve the opaque invitation token through the Auth handoff, and SHALL make the resulting persisted membership available in a subsequent bakery-membership load.

#### Scenario: Accepting an invitation from a delivered link
- **WHEN** an authenticated user whose verified email matches a valid pending invitation opens the delivered invitation link and accepts it
- **THEN** the system creates the designated bakery membership exactly once, marks the invitation accepted, and makes the bakery available after memberships are reloaded

#### Scenario: Invitation link cannot be replayed
- **WHEN** an invitee attempts to accept the same invitation after it has been consumed
- **THEN** the system creates no additional membership and presents an actionable invalid-or-already-used error

#### Scenario: Auth email is not verified
- **WHEN** an authenticated user's email matches the invitation address but the Auth identity has not verified that email
- **THEN** the system rejects acceptance without creating a membership

#### Scenario: Email does not match
- **WHEN** an authenticated user's verified email does not match the invitation address
- **THEN** the system rejects acceptance without disclosing bakery data

#### Scenario: Declining an invitation
- **WHEN** the addressed authenticated user declines a valid invitation
- **THEN** the system marks the invitation declined and does not create a membership

#### Scenario: Invitation is invalid
- **WHEN** an invitation is expired, revoked, already consumed, or otherwise invalid
- **THEN** the system does not create a membership and presents an actionable invitation error

#### Scenario: Invitation expires during consumption
- **WHEN** an authenticated invitee attempts to consume a pending invitation after its expiry
- **THEN** the system creates no membership and durably records the invitation as expired

### Requirement: Team state communicates progress and outcomes
The system SHALL prevent duplicate team-management submissions and SHALL present accessible success or error feedback without exposing invitation secrets. Real-backend acceptance evidence SHALL cover the invitation request, delivery handoff, and membership result; mock-only success evidence SHALL not be sufficient for release readiness.

#### Scenario: Invitation request is pending
- **WHEN** an invitation submission is in progress
- **THEN** the submitting action indicates progress and cannot be submitted again

#### Scenario: Team action fails
- **WHEN** an invitation, role, removal, acceptance, or decline action fails
- **THEN** the relevant interface remains available and presents an accessible error without revealing an invitation token or privileged credential

#### Scenario: Real invitation journey is verified
- **WHEN** the local Supabase verification completes an authorized invite, delivered-link handoff, acceptance, and membership reload
- **THEN** the evidence records persisted pending/accepted states and the invitee's newly accessible bakery without relying on the mock adapter
