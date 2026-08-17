## ADDED Requirements

### Requirement: Bakery invitations use dedicated email content

The invitation delivery service SHALL send a bakery-specific email containing the active bakery name, invited role, a clear acceptance action, and expiry guidance.

#### Scenario: Invitation email is accepted by the provider

- **WHEN** an authorized owner or manager submits a valid invitation
- **THEN** the service sends a bakery-specific message through the configured server-side provider
- **AND** the message contains an authenticated callback link preserving the opaque bakery invitation token

#### Scenario: Invitation email uses the hosted callback

- **WHEN** the invitation targets the hosted staging application
- **THEN** the callback link resolves under `/Bakery-app/`
- **AND** opening the link preserves the invitation context for the existing acceptance screen

### Requirement: Invitation email secrets remain server-side

The invitation email service SHALL keep provider credentials, Auth admin credentials, and full invitation links out of browser bundles, client responses, screenshots, traces, and routine logs.

#### Scenario: Browser submits an invitation

- **WHEN** the Team access screen requests an invitation
- **THEN** the browser receives only the delivery outcome and safe invitation status
- **AND** provider credentials and the generated email body remain inside the Edge Function

### Requirement: Failed invitation delivery is safely revoked

The invitation service SHALL not report an invitation as sent when Auth link generation or provider delivery fails after invitation creation.

#### Scenario: Provider rejects the message

- **WHEN** the email provider rejects an invitation message
- **THEN** the service revokes or invalidates the pending invitation
- **AND** the UI receives an actionable delivery error without a usable invitation link

#### Scenario: Provider accepts the message

- **WHEN** the provider accepts the invitation message
- **THEN** the service reports delivery success
- **AND** the invitation remains pending until the existing acceptance, decline, revoke, or expiry path changes it
