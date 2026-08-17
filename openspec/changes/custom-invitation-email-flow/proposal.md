## Why

Hosted staging delivery now succeeds, but the invitee receives Supabase's generic Magic Link message: “confirm your email address.” That wording hides the bakery invitation context and makes the acceptance journey harder to understand and verify.

## What Changes

- Add a dedicated invitation email composition and delivery path for bakery invitations.
- Generate the authenticated callback link and preserve the existing bakery invitation token and `/Bakery-app/` callback contract.
- Use a server-side email provider secret and a bakery-specific subject, call to action, and expiry guidance.
- Revoke or invalidate the pending invitation when custom email delivery fails.
- Add local and hosted verification for email content, callback routing, invited-email matching, acceptance, and cleanup.
- Keep ordinary sign-in, password recovery, membership authorization, and invitation token storage under their existing owners.

## Capabilities

### New Capabilities

- `invitation-email-delivery`: Send a clear, dedicated bakery invitation email through a server-only provider while preserving the existing Auth and invitation handoff.

### Modified Capabilities

- `bakery-team-membership`: Require a successful bakery-specific invitation message before reporting an invitation as sent, without changing role authorization or exactly-once membership acceptance.

## Impact

- Supabase `send-bakery-invite` Edge Function and its server-only email-provider configuration.
- Hosted staging secrets, sender-domain verification, and invitation email templates.
- Invitation delivery tests, hosted mailbox verification, and deployment documentation.
- Dependencies: `repair-bakery-invitations` and `repair-staging-order-and-invitations` remain owners of invitation persistence, token validation, callback configuration, and membership acceptance; `expand-hosted-staging-e2e` consumes the new delivery contract for release evidence.

Non-goals are a new invitation table, a new bakery membership model, browser exposure of service-role/provider keys, or a production rollout.
