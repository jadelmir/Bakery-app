## MODIFIED Requirements

### Requirement: Hosted invitations return to the deployed application

The hosted invitation delivery path SHALL allow the authorized staging frontend origin, SHALL preserve the opaque invitation token, and SHALL construct the Auth callback under the deployed application base path. A successful invitation response SHALL mean the invitation record was created and Auth delivery initiation succeeded.

#### Scenario: GitHub Pages invitation delivery

- **GIVEN** an authorized owner or manager is using the staging application at `https://jadelmir.github.io/Bakery-app/`
- **WHEN** they invite a valid email address with an allowed role
- **THEN** the Edge Function accepts the staging origin, creates one pending invitation, initiates Auth delivery, and sends a callback that returns to `/Bakery-app/?invitation=<opaque-token>`

#### Scenario: Hosted configuration is incomplete

- **GIVEN** the staging Edge Function or Supabase Auth project lacks the required application URL, redirect allow-list, SMTP/sender, or function secret configuration
- **WHEN** an invitation is submitted
- **THEN** the system reports an actionable delivery/configuration error, does not display invitation success, and does not leave a usable pending invitation when delivery initiation fails

#### Scenario: Invitation acceptance remains tenant-safe

- **GIVEN** a delivered staging invitation is opened by the invited, verified email identity
- **WHEN** the invitee accepts the invitation and memberships are reloaded
- **THEN** exactly one membership is visible for the designated bakery and no other bakery data is disclosed

### Requirement: Hosted invitation readiness is evidenced separately from local verification

Local Mailpit and unit-test success SHALL NOT be treated as hosted readiness. The release evidence SHALL record the authorized staging project, migration parity, deployed Edge Function version, hosted Auth redirect configuration, sender/SMTP status, and a synthetic invite request through acceptance.

#### Scenario: Hosted readiness evidence is recorded

- **GIVEN** local invitation tests and the Mailpit verifier have passed
- **WHEN** the staging release gate is reviewed
- **THEN** the evidence also records the hosted project/configuration checks and a successful synthetic invitation through acceptance before hosted readiness is claimed
