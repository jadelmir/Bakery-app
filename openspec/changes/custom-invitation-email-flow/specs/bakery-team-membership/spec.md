## MODIFIED Requirements

### Requirement: Authorized users can invite people

The system SHALL let an owner or manager invite a person to the active bakery by email with an allowed role, SHALL record the invitation as pending until it is accepted, declined, revoked, or expired, and SHALL report success only after a bakery-specific invitation email is accepted by the configured server-side provider.

#### Scenario: Sending an invitation

- **WHEN** an owner or manager submits a valid email address and permitted role
- **THEN** the system creates one pending invitation for the active bakery and sends a bakery-specific invitation link to that email address

#### Scenario: Duplicate pending invitation

- **WHEN** an authorized user invites an email address that already has a pending invitation to the same bakery
- **THEN** the system does not create a duplicate and identifies the existing pending invitation

#### Scenario: Existing member is invited

- **WHEN** an authorized user invites an email address already associated with a member of the active bakery
- **THEN** the system does not create an invitation and reports that the person is already a member

#### Scenario: Manager attempts owner invitation

- **WHEN** a manager attempts to invite a person with the Owner role
- **THEN** the system rejects the request without creating an invitation

#### Scenario: Invitation email delivery fails

- **WHEN** the invitation row is created but Auth link generation or the configured email provider fails
- **THEN** the system revokes or invalidates the invitation
- **AND** reports an actionable delivery error instead of “Invitation sent”
