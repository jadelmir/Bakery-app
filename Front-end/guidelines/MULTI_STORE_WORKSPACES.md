# Multi-store workspace operations

Verified for local development on July 29, 2026.

## Authentication and browser configuration

The application uses Supabase Auth and requires these browser-visible values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Use the modern publishable key from the Supabase Connect dialog. Never put a
secret key, service-role key, database password, or access token in a Vite
variable.

Local Auth accepts `http://127.0.0.1:5173` and `http://localhost:5173`.
Hosted development must allow the exact development application URL.
Production must allow only reviewed production and recovery URLs.

Local and hosted development use the same Auth security baseline:

- verified email is required before invitation consumption;
- passwords require at least eight characters with letters and digits;
- secure password changes require recent authentication;
- email OTPs are eight digits with a one-minute send interval;
- TOTP enrollment and verification remain enabled.

Profile email is synchronized from Supabase Auth and cannot be edited through
the profile API. Independent profile deletion and Auth-user deletion are
intentionally blocked until a future approved account-deletion operation
resolves memberships, retained records, and bakery ownership.

## Workspace behavior

After authentication, business data remains gated until the user confirms an
accessible bakery. A first-time user can create one bakery atomically and
becomes its Owner. A returning user may preselect a valid default bakery, switch
among current memberships, and choose a new default.

| Role | Team permissions |
|---|---|
| Owner | Invite Owner, Manager, or Staff; change roles; remove members; revoke invitations |
| Manager | Invite, change, or remove Staff; revoke Staff invitations |
| Staff | No team-administration actions |

The database prevents removal or demotion of the final Owner. Ownership
transfer is atomic: the successor is promoted before the current Owner becomes
a Manager.

## Invitation delivery

`send-bakery-invite` is an authenticated Edge Function. It validates the
inviter's current membership, normalizes and deduplicates the email, applies
inviter and bakery rate limits, stores only a SHA-256 token hash, and sends a
one-time Supabase Auth email. The application receives the opaque token only
through the approved redirect.

To verify the real local delivery and acceptance path, start Supabase and the
Edge Function, then run the synthetic-data verifier. It creates temporary
confirmed users and a bakery, invokes `send-bakery-invite`, inspects the Auth
email in Mailpit, accepts the opaque invitation, confirms one persisted staff
membership, checks replay rejection, and cleans up the synthetic records:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = '<local service role key>'
pnpm verify:invitation
```

The verifier uses `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` when set, otherwise the local URL and
`SUPABASE_ANON_KEY`. It must not be run against production tenant data.

Run the local function with the project-pinned CLI:

```bash
pnpm exec supabase functions serve send-bakery-invite
```

Local email appears in Mailpit at `http://127.0.0.1:54324`. Default Supabase
email delivery is development-only. Before a production launch, configure
custom SMTP, verify sender identity and deliverability, set the exact production
`APP_URL` function secret, and review the Auth redirect allow-list.

## Verification

```bash
pnpm supabase:reset
pnpm exec supabase test db --local supabase/tests/database
pnpm run test:db:concurrency
pnpm supabase:types
pnpm supabase:types:check
pnpm supabase:types:check:linked
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run build
pnpm exec supabase db advisors --local --type all
```

The browser suite explicitly enables `VITE_USE_MOCK_BACKEND=true` in the
Playwright web server. Normal development and production builds use Supabase.

## Hosted rollout and rollback

Confirm the development project reference before every rollout. Compare local
and hosted migration history, review the dry run, push migrations, deploy the
single function, and rerun advisors:

```bash
pnpm supabase:migrations:linked
pnpm supabase:push:dry-run
pnpm exec supabase db push --linked
pnpm exec supabase functions deploy send-bakery-invite
pnpm exec supabase db advisors --linked --type all
```

Never use a hosted database reset as deployment or recovery. Before a hosted
push, rollback is a source revert plus local reset. After a hosted push, disable
invitation delivery if necessary and ship a reviewed forward migration; do not
automatically drop bakery, membership, or invitation records.

Monitor failed Auth email delivery, Edge Function errors and latency,
invitation-rate-limit responses, and Supabase security/performance advisors.
Re-run the hosted rollback-safe database suite after every workspace security
change. Hosted development verification on July 29, 2026 confirmed matching
migration history, current generated types, an active JWT-verified invitation
function, 28 passing database assertions, and no advisor findings. The final
frontend gate passed 64 unit/integration tests and 12 desktop/mobile browser
journeys, plus TypeScript, lint, and the production build. The real
multi-connection concurrency suite also passed.
