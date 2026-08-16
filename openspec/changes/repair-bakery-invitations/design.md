## Context

The application already has the intended invitation architecture: owners/managers submit from `TeamManagement`, `WorkspaceAdapter.inviteMember` invokes `send-bakery-invite`, the Edge Function validates the caller and creates a hashed-token invitation through a service-role RPC, Supabase Auth sends a magic link, and `InvitationLanding` accepts or declines through authenticated database functions. The committed database spec also defines role restrictions, duplicate prevention, verified-email matching, terminal invitation states, and tenant isolation.

The gap is verification and potentially environment configuration. The existing Playwright invitation tests force `VITE_USE_MOCK_BACKEND=true`; the mock adapter stores an invitation in memory and returns a success message without exercising Edge Functions, Auth email delivery, redirect allow-lists, or persisted membership creation. The change must distinguish a working UI mock from a working Supabase integration.

Product traceability is F2 Authentication and Account Experience and B2 Authentication and Bakery Workspaces, owned by the existing `bakery-team-membership` capability. The local Supabase project is under `Front-end/supabase/`; hosted configuration remains an external deployment gate.

## Goals / Non-Goals

**Goals:**

- Make the real invitation path observable and testable from authorized inviter through accepted invitee.
- Repair only the integration defects discovered by that journey, preserving the existing RLS/RPC security model.
- Ensure failures identify actionable configuration or authorization problems without exposing invitation tokens or service-role credentials.
- Add focused evidence for owner/manager role limits, duplicate/member conflicts, delivery failure cleanup, redirect handling, acceptance, and access refresh.
- Record local verification and the exact hosted configuration checks required before rollout.

**Non-Goals:**

- Do not redesign team-management UI or change bakery roles and permissions.
- Do not replace Supabase Auth with a custom mail service or add a custom backend.
- Do not add invitation tables, change token storage from hashed values, or weaken RLS.
- Do not modify password recovery/account-password behavior owned by `repair-authentication-account-flows`.
- Do not claim hosted email delivery or hosted redirect allow-list verification without project authority and evidence.

## Decisions

### 1. Treat the persisted Supabase flow as the acceptance path

The implementation and acceptance suite will use the real workspace adapter, Edge Function, Auth, and database operations. The mock adapter remains for deterministic component tests only. This avoids a false green result from an in-memory invitation list.

**Alternative considered:** make the current mock Playwright journey stricter. Rejected because it cannot prove delivery, redirect configuration, RPC grants, or cross-session membership persistence.

### 2. Keep invitation creation server-controlled

The browser continues to call `send-bakery-invite`; the Edge Function remains responsible for caller verification, role/bakery authorization via the RPC, token generation, hashing, expiry, rate limits, and Auth email sending. The browser must never receive or use service-role credentials.

**Alternative considered:** insert invitations directly from the browser. Rejected because it would bypass the established privileged boundary and conflict with tenant/security requirements.

### 3. Verify the email handoff through local Mailpit and a deterministic acceptance setup

Local verification will inspect the delivered Auth email, extract the invitation redirect/token, authenticate the invitee as required, open the redirect, accept once, confirm persisted membership visibility, and confirm replay/expiry/mismatch behavior. Test data will be synthetic and cleaned up.

**Alternative considered:** assert only the Edge Function response. Rejected because a 201 response can still conceal a broken Auth email template, redirect allow-list, or acceptance route.

### 4. Separate implementation evidence from hosted rollout evidence

Local database/Edge Function/browser checks can prove code and local configuration. Hosted SMTP, `APP_URL`, Auth redirect allow-list, deployed function version, and provider deliverability require a separate manual or CI environment gate. The plan will leave that gate explicitly incomplete when authority is unavailable.

**Alternative considered:** infer hosted readiness from local success. Rejected because hosted configuration and email provider behavior are environment-specific.

## Risks / Trade-offs

- **[Auth link is not delivered or lands at the wrong URL] →** Inspect Mailpit and assert the exact redirect; verify local and hosted allow-lists separately; fail the journey on missing or incorrect links.
- **[A stale deployed Edge Function or missing secret makes the UI look broken] →** Add a preflight that reports function/configuration failures distinctly and document required `APP_URL` and service-role setup without committing secrets.
- **[Magic-link authentication changes the invitee session unexpectedly] →** Assert session establishment before acceptance and preserve the opaque invitation query through login/callback handling.
- **[Tests contaminate local tenant data] →** Use unique synthetic identities/bakeries and cleanup in `finally`/transaction-safe steps; never use live production tenant data.
- **[Existing active changes overlap frontend files] →** Keep implementation ownership bounded to invitation/auth integration files and coordinate before editing shared App/auth code; do not modify unrelated active-change work.

## Migration Plan

1. Run the focused baseline against the current code to capture which checks are mock-only and which local Supabase prerequisites are unavailable.
2. Implement the smallest frontend/function/database corrections required by the real journey, with migrations only if verification identifies a genuine schema/security defect.
3. Reset local Supabase, run database invitation/RLS tests, serve/deploy the local Edge Function, and verify Mailpit delivery plus invite acceptance.
4. Run focused Vitest/Playwright checks, then the frontend typecheck, lint, full test, build, and relevant database checks.
5. Before hosted rollout, confirm the exact project, `APP_URL`, Auth redirect allow-list, SMTP/sender settings, function secrets, deployed function version, and a synthetic invite. Record any unavailable hosted proof as a blocking gate.

Rollback is a source revert for frontend/function changes and a reviewed forward migration for any schema correction. Do not reset or delete hosted invitation/member data as rollback.

## Open Questions

- Which staging/hosted Supabase project is authorized for a synthetic end-to-end invitation test?
- Is the intended invite email a magic-link login for existing users and signup for new users in every target environment, or is a dedicated invite template required?
- Which test harness is approved for extracting and following Mailpit links without making the browser suite depend on an external mailbox service?
