<!-- orch-managed:v1 -->
# Orch Execute

Execute approved work from OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth. Orch routing decisions are operational only and MUST NOT create a second task lifecycle.

## MUST

- Read the active/approved OpenSpec change and tasks before modifying code.
- Execute only work that belongs to the approved OpenSpec scope.
- Derive bounded operational WorkUnits that reference their originating OpenSpec task.
- Let Orch infer documentation impact from WorkUnit file hints when conservative API, database, deployment, or setup signals are present; an explicit documentationImpact value may override inference.
- Treat inferred documentation impact as advisory operational metadata, never as OpenSpec task/change state.
- Include documentation impact on WorkUnits when approved implementation may change documented architecture, APIs, database behavior, setup, deployment, operations, or product reference.
- Route each WorkUnit through the Orch agent registry before delegation.
- Filter agents by required capabilities before selection.
- Prefer an explicitly configured capable agent when present; otherwise use deterministic routing.
- Use provider-neutral execution tiers: lightweight, default, strong.
- Treat unsupported execution tiers as advisory and report the downgrade.
- Start with targeted context and use the central Orch token policy for Repomix/LLMLingua escalation.
- Parallelize only when dependencies, write scopes, global-change risk, and adapter capabilities all permit it. Unknown write scope means sequential.
- When documentation impact is required, update only the relevant current-system docs as part of approved work.
- MUST NOT create docs that duplicate OpenSpec plans, tasks, progress, changes, or archives.
- Fail before delegation when no capable agent exists for required capabilities.
- Update progress/state only through OpenSpec.
- Record routing/documentation telemetry separately from OpenSpec task/change state.
- Track and report token-efficiency savings when available; never fabricate values.

## Workflow

1. Read the approved OpenSpec work.
2. Identify the next incomplete OpenSpec task.
3. Derive one or more bounded WorkUnits referencing that task; conservative documentation impact is inferred automatically from file hints unless explicitly supplied.
4. Allocate context through the Orch context policy.
5. Route each WorkUnit through the detected agent registry.
6. Analyze conservative parallelism; default to sequential when uncertain.
7. Delegate/implement the work using the selected adapter and execution tier (or adapter default when the tier is advisory).
8. Update relevant current-system docs when required by the approved implementation.
9. Run relevant verification.
10. Record completion/progress through OpenSpec only.
11. Add routing/context/documentation/usage information to Orch operational run telemetry.
12. Continue with approved tasks until complete or blocked.
13. Present execution status and mandatory run summary.

## MUST STOP IF

- OpenSpec scope is ambiguous.
- Required work conflicts with the approved change.
- No capable agent exists for required capabilities.
- Verification indicates a serious unresolved failure.

## Mandatory Orch Run Summary

At completion (even if blocked/failed), distinguish tool available/used/skipped/unavailable/failed and report `not measured` for unavailable token values. Include routed WorkUnits with selected agent, requested/effective tier, context strategy, parallel/sequential decision, documentation impact, and reasons.

🧠 ORCH TOKEN EFFICIENCY
────────────────────────────────
Workflow: orch-execute

RTK / Repomix / LLMLingua / usage provider
Status: <actual status>
Saved/usage: <measured value | not measured>

Routing
- <work unit>: <agent>, <tier>, <context>, <parallel|sequential>, <documentation impact>, <reason>

Context
Before: <tokens | not measured>
After: <tokens | not measured>

Run saved: <tokens | not fully measured>
Project saved: <tokens | not measured>
