## Context

The current `send-bakery-invite` Edge Function creates the persisted invitation, then calls Supabase Auth `signInWithOtp`. Hosted staging delivery now works, but the resulting Auth Magic Link email is generic and says “confirm your email address” rather than explaining the bakery invitation. Existing changes `repair-bakery-invitations` and `repair-staging-order-and-invitations` own invitation persistence, callback configuration, and membership acceptance; this change owns only the server-side message composition and delivery handoff.

## Goals / Non-Goals

**Goals:**

- Send a bakery-specific invitation email with the bakery name, role, clear acceptance action, and expiry guidance.
- Preserve the existing opaque bakery invitation token, verified-email matching, `/Bakery-app/` callback, and exactly-once membership acceptance.
- Keep provider credentials and Auth service-role access inside the Edge Function.
- Revoke or invalidate the persisted invitation if custom email delivery fails.
- Make delivery, callback, acceptance, duplicate, and failure outcomes testable locally and in hosted staging.

**Non-Goals:**

- No new invitation or membership tables, role-model changes, or browser-side secret handling.
- No replacement of Supabase Auth session verification or the existing invitation landing screen.
- No production rollout in this change; staging sender/domain verification is required first.

## Decisions

### 1. Generate the Auth handoff server-side and send the message separately

The Edge Function will use its server-only Supabase Auth admin client to generate the invitee’s authenticated link with `redirectTo` set to the existing hosted callback containing the opaque invitation token. It will send that generated link through a server-side email provider instead of invoking `signInWithOtp`’s built-in email sender. The browser remains responsible only for submitting the invitation and consuming the callback session.

**Alternative considered:** Customize the global Supabase Magic Link template. Rejected as the long-term solution because that template also applies to ordinary passwordless sign-in and cannot reliably express bakery-specific context for only invitations.

### 2. Reuse the project’s existing server-side email-provider pattern

Implement a small invitation-mail sender using the existing Edge Function provider pattern used by `send-invoice-email`, with `RESEND_API_KEY` and an environment-scoped verified sender address. The sender address is configuration, not a browser variable. If the staging project uses another approved SMTP/API provider, the sender interface must remain provider-agnostic so the provider implementation can be swapped without changing invitation persistence.

**Alternative considered:** Put SMTP credentials in the frontend or GitHub Pages build. Rejected because it would expose credentials and violate the application security boundary.

### 3. Resolve bakery presentation data on the server

The email’s bakery name and role will come from the authorized server-side request and persisted bakery data, never from an untrusted browser-supplied display name. The existing invitation RPC remains the authority for permission, duplicate prevention, and token persistence.

### 4. Keep failure atomic from the user’s perspective

The function will report success only after the provider accepts the message. If link generation or delivery fails after the invitation row is created, the function will revoke or invalidate that row and return an actionable error. Provider message identifiers may be logged only in redacted server-side evidence.

## Risks / Trade-offs

- **Provider configuration differs across environments** → require a verified staging sender, environment-scoped secrets, a preflight check, and a manual test before hosted E2E is enabled.
- **Auth link generation changes the invitee session behavior** → preserve the current callback token and run local Auth/Mailpit acceptance tests before hosted rollout.
- **Provider accepts a message but delivery is delayed or filtered** → treat provider acceptance and mailbox receipt as separate evidence; use a dedicated staging mailbox and bounded polling.
- **Existing invitation changes overlap the Edge Function** → keep ownership limited to email composition/sending and update the related change traceability before implementation.
- **Email HTML accidentally exposes invitation secrets in logs** → never log message bodies or full links; redact tokens and upload only sanitized failure metadata.

## Migration Plan

1. Add the server-side sender abstraction and custom invitation template.
2. Configure a verified staging sender and provider secret in the Supabase staging environment.
3. Deploy the Edge Function and run the local invitation/Mailpit acceptance suite.
4. Send one run-scoped invitation to `jad.em@outlook.com`, verify the hosted callback and acceptance, then verify duplicate/revoke/failure behavior.
5. Add the mailbox/provider contract to the hosted E2E workflow without placing credentials in the repository.

Rollback is to deploy the previous Edge Function and restore the existing Supabase Auth sender path; no database migration is expected.

## Open Questions

- Which verified sender address/domain should staging use for invitation emails?
- Should the provider reuse the existing `RESEND_API_KEY` or receive a dedicated invitation-mail credential?
- Which mailbox API or controlled inbox mechanism should the hosted E2E runner use to retrieve the callback link without exposing mailbox credentials to the browser?
