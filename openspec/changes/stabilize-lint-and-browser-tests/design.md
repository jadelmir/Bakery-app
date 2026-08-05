# Design: Stabilize Lint and Browser Verification

## Design Goals

1. Restore truthful, repeatable release gates without changing intended bakery
   behavior.
2. Keep concurrent edit ownership non-overlapping.
3. Diagnose browser failures before deciding whether test data, assertions, or
   application code owns the correction.

## Decisions

### Typed Supabase Boundaries

The adapter work SHALL replace `any` with generated database row/insert/update
types, narrow query-result shapes, or small test doubles that describe only the
methods under test. It SHALL NOT use ESLint suppression or broad casts merely
to silence the rule. Generated database types are read-only context for this
change unless a mismatch proves they are stale; that condition requires the
agent to stop and report it.

### Production Screen Types

The production-screen work SHALL type selector and callback boundaries using
existing domain types. Runtime behavior and visual output are preserved. If a
type correction requires changing a shared domain contract, the assigned agent
stops because that file is outside its exclusive ownership.

### Deterministic Browser Time

The browser stream first reproduces the eight failures and records the rendered
date/task state. Fixed calendar assertions such as `July` SHALL be replaced by
assertions derived from a controlled test clock or a stable semantic contract.
Task fixtures SHALL guarantee that the timer, delay, and prerequisite scenarios
exist for the controlled date.

Assertions may change only when the existing assertion is tied to incidental
calendar data rather than the requirement. Tests SHALL NOT be skipped, marked
flaky, or loosened to generic page-presence checks.

### Product-Defect Escalation

The browser agent owns tests and fixtures, not application screens. If a failure
persists under deterministic time and indicates a product defect, the agent
stops with reproduction evidence. The orchestrator then serializes the fix
after the current owner of the implicated source file finishes, or updates the
OpenSpec scope and ownership before work continues.

## Workstream Boundaries

```text
Production UI typing       Supabase typing            Browser determinism
ProductionScreen.tsx       starter adapter + tests    app.spec.ts
                           task adapter + tests       production-workspace.spec.ts
                                                     domain fixtures
          \                      |                       /
           \---------------- orchestrator -------------/
                    integrated verification + evidence
```

The orchestrator exclusively owns this change's OpenSpec artifacts and
`openspec/PROGRAM_MAP.md`. Agents may read but must not edit those files.

## Risks and Mitigations

- **Date-dependent false failures:** control time and fixture dates explicitly.
- **Assertions accidentally weakened:** preserve the original user-visible
  outcome in every scenario and review the final diff.
- **Type casts hiding contract errors:** prefer generated/narrow types and run
  focused adapter tests.
- **Shared-file collision:** validate ownership before dispatch and serialize
  any newly discovered application defect.
- **Historical evidence remains misleading:** update the program map only after
  all five quality commands pass.

## Verification Strategy

Run focused checks within each workstream, followed by:

```text
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run test:e2e
```

The final browser result must report 42/42 across desktop and mobile.

