# Reconcile OpenSpec Program — Verification Evidence

## Scope and method

This record verifies planning artifacts for `reconcile-openspec-program`. It does not
claim application, schema, migration, generated-type, or hosted-environment
verification. The repository-scoped OpenSpec CLI was run through
`pnpm dlx @fission-ai/openspec@latest`: strict validation passed for both
`reconcile-openspec-program` and `add-multi-store-workspaces`. The six corrective
deltas were then synchronized by intelligent merge and the resulting main specs
were reviewed and strictly validated.

The only direct main-spec correction made during this review is the
`supabase-backend-foundation` Purpose. OpenSpec deltas do not merge a `## Purpose`
section into an existing main spec, so the placeholder was replaced with the active
delta's exact foundation boundary. All of that specification's requirements and
scenarios remain unchanged.

## Archived-delta comparison and main-spec absence check

The archived `2026-07-29-assign-order-production-plan` change remains immutable and
was compared with the corrective deltas in this change.

- The archived `order-production-plan-assignment` requirement requires one local
  generated plan per completed order, task traceability by order identifier, and
  duplicate prevention. The corrective delta preserves all three points; its Purpose
  narrows the wording to the still-local prototype boundary.
- The archived `production-task-generation` requirement requires an order to retain
  the generated-plan association so order details can retrieve its tasks. The
  corrective delta preserves that requirement and scenario unchanged.
- Before synchronization, `openspec/specs/order-production-plan-assignment/spec.md`
  was absent and the association requirement was absent from the main
  `production-task-generation` specification. Synchronization created the missing
  capability and merged the association requirement without modifying the archive.

## Canonical lifecycle and urgency audit

The synchronized main `production-task-generation` specification limits persisted
lifecycle state to `Pending`, `In Progress`, `Completed`, `Skipped`, and
`Cancelled`, and makes `Due Soon`, `Due Now`, and `Overdue` derived urgency from
scheduled time, bakery timezone, current time, and terminal state.

The synchronized scenarios cover both required distinctions: an overdue pending
task remains `Pending`, and completing an overdue task persists `Completed` and
removes it from actionable overdue work.

## Evidence-scoped persisted and local wording audit

Repository evidence supports the mixed architecture claimed by the corrective
frontend deltas:

- `Front-end/src/app/App.tsx` selects `supabaseAuthAdapter` and
  `supabaseWorkspaceAdapter` by default, reserving browser mock adapters for the
  explicit `VITE_USE_MOCK_BACKEND` path.
- `Front-end/src/app/workspace.ts` implements the workspace adapter through the
  typed Supabase client and membership tables.
- `Front-end/src/app/App.tsx` explicitly identifies production flows and generated
  production plans as browser-local prototype behavior.

Accordingly, the deltas correctly avoid both blanket `mock-only` and `fully
persisted` claims. They describe authentication and bakery-workspace boundaries as
Supabase-backed while retaining local/prototype wording for bakery-domain records,
calculations, and generated plans. Test-only and opt-in mock adapters remain valid
verification infrastructure rather than the normal runtime.

## Delta quality and ownership review

Every requirement in the six corrective delta specifications has at least one
`WHEN`/`THEN` scenario. The new order-assignment capability and production-task
association requirement each have explicit recovery scenarios; the lifecycle delta
covers overdue display, terminal completion, and skipped-task dependency behavior.

The two active changes have non-overlapping capability-spec ownership. This change
owns `supabase-backend-foundation`, `production-task-generation`,
`order-production-plan-assignment`, `frontend-runtime-verification`,
`frontend-prototype-alignment`, and `openspec-program-governance`.
`add-multi-store-workspaces` owns `frontend-authentication-shell` and its bakery
workspace, team-membership, and tenant-isolation capabilities. The current change
does not create a competing authentication-shell delta. No delta in this change
requests an application or database mutation.

## Rendered-sync result and archive gate

The rendered main specs now show the corrected Supabase foundation Purpose and
typed-boundary ownership, the new `order-production-plan-assignment` and
`openspec-program-governance` capabilities, the recovered generated-plan association
in `production-task-generation`, and the canonical lifecycle/derived-urgency wording.
The runtime and prototype main specs express the same evidence-scoped mixed
persistence boundary.

The program map records these capabilities as synchronized. The change may be
archived only after its task ledger records this evidence and the final strict
validation and delta-to-main comparison pass.
