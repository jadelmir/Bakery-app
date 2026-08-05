# Implementation Plan: Repair Authentication Account Flows

request_feedback: true

## Objective

Repair the verified F2 authentication defects without altering tenant
authorization: recovery emails must return to a guarded update flow, account
password changes must verify the current credential, and automated evidence
must fail when required authentication UI or behavior is absent.

## OpenSpec Change

`repair-authentication-account-flows`

Artifacts:

- `proposal.md`
- `design.md`
- `specs/authentication-and-account-experience/spec.md`
- `tasks.md`

## Validation Status

The OpenSpec CLI is unavailable in the current environment (`openspec` is not
recognized), so `openspec validate repair-authentication-account-flows` could
not run. Manual structural validation confirmed that every required artifact
exists, the delta is under
`specs/authentication-and-account-experience/spec.md`, and it contains
`MODIFIED`/`ADDED` requirement headings with `#### Scenario:` blocks. Re-run
the CLI validation before implementation if the command becomes available;
otherwise retain this limitation in verification evidence as permitted by the
repository delivery contract.

## Prerequisites and Scope

The synchronized F2 authentication baseline, B1 Supabase foundation, and B2
authenticated workspace boundary are prerequisites. The completed
`remove-earls-bakery-login-branding` delta overlaps only in capability name;
its presentation scope and files remain immutable. No database migration, RLS
change, linked-project mutation, or production user operation belongs to this
change.

## Workstream Assignments

### Workstream 1 - Guarded password recovery

- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 1.1-1.4
- Exclusive writable ownership:
  - `Front-end/src/lib/supabase/client.ts`
  - `Front-end/src/app/auth.ts`
  - `Front-end/src/app/PasswordResetDialog.tsx`
  - `Front-end/src/app/App.tsx`
  - `Front-end/supabase/config.toml`
  - `Front-end/src/app/auth.test.ts`
  - `Front-end/src/app/App.test.tsx`
  - `Front-end/src/app/PasswordResetDialog.test.tsx` (new file only)
- Deliverable: an event-aware, origin-bound, guarded recovery journey with
  deterministic focused tests.
- Acceptance criteria: reset requests always use the fixed callback; only a
  valid `PASSWORD_RECOVERY` flow permits update; invalid/expired/direct paths
  cannot update; success signs out and returns to login; exact local callbacks
  are allowlisted; no bakery data renders during recovery.
- Must not change: account profile, Playwright files, database migrations, RLS,
  workspace membership logic, generated types, or hosted Auth settings.
- Focused verification:
  `pnpm exec vitest run src/app/auth.test.ts src/app/App.test.tsx src/app/PasswordResetDialog.test.tsx`.
- Stopping rule: stop if correct handling requires accepting an arbitrary
  redirect, weakening recovery-event validation, or changing hosted settings;
  report the required external/deployment action instead.

### Workstream 2 - Verified account password change

- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 2.1-2.3
- Exclusive writable ownership:
  - `Front-end/src/app/AccountProfileScreen.tsx`
  - `Front-end/src/app/AccountProfileScreen.test.tsx` (new file only)
- Deliverable: account password replacement that verifies the submitted
  current credential before update, with focused success and denial tests.
- Acceptance criteria: empty/incorrect current credentials cannot update the
  password; successful verification precedes update; weak/mismatched new
  passwords remain rejected; secrets are neither stored nor logged; auth and
  workspace state remain coherent.
- Must not change: shared auth adapter/client files, recovery UI, App shell,
  Playwright files, Supabase configuration, database files, or profile metadata
  behavior unrelated to password changes.
- Focused verification:
  `pnpm exec vitest run src/app/AccountProfileScreen.test.tsx`.
- Stopping rule: stop if Supabase's installed API requires a different secure
  reauthentication product decision or if implementation would expose a
  credential outside the direct Auth request.

### Workstream 3 - Browser and local-Supabase evidence

- Model: `gemini-3.6-flash`
- Reasoning effort: `medium`
- Task IDs: 3.1-3.2
- Exclusive writable ownership:
  - `Front-end/e2e/authentication-and-account.spec.ts`
  - `Front-end/scripts/verify-local-auth-flow.mjs` (new file only)
- Deliverable: strict responsive browser assertions and a cleanup-safe local
  Supabase authentication verification script.
- Acceptance criteria: browser checks contain no visibility condition that can
  silently bypass a required assertion; the local script proves login,
  verified-user, recovery callback, password replacement, old/new credential,
  logout, and cleanup behavior using synthetic/local data only.
- Must not change: production components, shared adapters, Playwright config,
  package dependencies, database migrations/seed, committed environment files,
  or hosted/production state.
- Focused verification:
  `pnpm run test:e2e -- e2e/authentication-and-account.spec.ts` and
  `node scripts/verify-local-auth-flow.mjs` with the local stack running.
- Stopping rule: stop if cleanup cannot be guaranteed, local runtime values
  would need to be committed, or a test requires production/linked access.

### Workstream 4 - Integration and lifecycle

- Owner: orchestrator; serialized after Workstreams 1-3.
- Model: `gemini-3.6-flash`
- Reasoning effort: `high`
- Task IDs: 4.1-4.3
- Exclusive writable ownership:
  - `openspec/changes/repair-authentication-account-flows/`
  - `openspec/PROGRAM_MAP.md`
- Deliverable: integrated review, complete verification evidence, coherent task
  ledger/spec/map state, and an explicit hosted callback allowlist gate.
- Must not change: source files assigned to implementation agents, linked or
  production Supabase state, or unrelated OpenSpec changes.
- Stopping rule: return to apply for any auth regression; treat unavailable
  hosted allowlist authority as unverified deployment evidence and do not
  weaken the implementation or mark the change archive-ready.

## Execution Sequencing

Workstreams 1, 2, and 3 have disjoint writable files and may start in parallel
after user approval. Workstream 3 may author tests concurrently but must run
its integrated local journey against the merged recovery/account behavior.
Workstream 4 begins only after all implementation agents stop and the
orchestrator has reviewed the shared workspace.

## Verification Plan

From `Front-end`, confirm installed CLI help before any Supabase command, then
run the smallest checks first and finish with the baseline:

```text
pnpm exec vitest run src/app/auth.test.ts src/app/App.test.tsx src/app/PasswordResetDialog.test.tsx
pnpm exec vitest run src/app/AccountProfileScreen.test.tsx
pnpm run test:e2e -- e2e/authentication-and-account.spec.ts
pnpm exec supabase status
node scripts/verify-local-auth-flow.mjs
pnpm exec supabase db lint --local --fail-on error
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e
```

Manual verification must cover one valid recovery link, one invalid/expired or
reused link, an incorrect current password, a successful account password
change, login with the replacement credential, and confirmation that bakery
membership/RLS behavior is unchanged. Verify the exact hosted/staging callback
allowlist separately; no hosted mutation is authorized by this plan.

## Ownership Validation

Run `findOwnershipConflicts()` with the Workstream 1-4 writable ownership sets
before spawning implementation agents. The expected result is zero conflicts.

## Approval Gate

This plan requests feedback. Stop after presenting it and wait for explicit
user approval before `/orch repair-authentication-account-flows` executes any
implementation task.

## Execution Evidence (2026-08-03)

- Runtime model availability required the approved equivalent substitution:
  `gpt-5.6-sol/high` for recovery and account-password security work and
  `gpt-5.6-terra/medium` for bounded browser/local evidence.
- `findOwnershipConflicts()` returned zero conflicts before delegation, and
  each agent stayed within its exclusive writable files.
- Focused authentication tests passed 46/46; full Vitest passed 155/155.
- Focused authentication Playwright passed 8/8; full Playwright passed 52/52
  across desktop and mobile.
- Typecheck, zero-warning lint, production build, local database lint, local
  security advisors, and non-member RLS denial checks passed.
- Local synthetic recovery verification passed and restored the seeded
  credential in cleanup.
- The OpenSpec CLI remains unavailable, so CLI validation/list status could not
  be produced. Manual artifact/delta structure validation remains the recorded
  fallback.
- Hosted/staging redirect allowlisting and final manual product acceptance are
  still external gates. The change is implemented-unverified and is not ready
  to synchronize or archive.
