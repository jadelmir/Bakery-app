<!-- orch-managed:v1 -->
---
name: orch-execute
description: Execute approved OpenSpec work through Orch routing and token-efficiency policy.
---

# Orch Execute

OpenSpec is the ONLY source of truth. Orch routing is operational only.

## MUST

- Read the approved OpenSpec change/tasks first and execute only approved scope.
- Derive bounded WorkUnits that reference their originating OpenSpec task.
- Let Orch infer documentation impact from bounded WorkUnit file hints when route/controller/API, migration/schema/database, deployment-manifest, or setup-environment signals are present; explicit documentationImpact may override the inference.
- Treat inferred documentation impact as advisory operational metadata, never as OpenSpec task/change state.
- Route every WorkUnit through the Orch agent registry before delegation.
- Filter candidates by required capabilities and fail early when none are capable.
- Prefer an explicitly configured capable agent; otherwise use deterministic routing.
- Use provider-neutral execution tiers: lightweight, default, strong. Unsupported tiers are advisory and MUST be reported as such.
- Start with targeted context and reuse Orch token policy for Repomix/LLMLingua decisions.
- Parallelize only when dependency edges, known write scopes, global-change risk, and adapter parallel capability all permit it. Unknown write scope means sequential.
- When approved implementation changes documented architecture, APIs, database behavior, setup, deployment, operations, or product reference, update only the relevant current-system docs as part of that approved work.
- MUST NOT create documentation that duplicates OpenSpec plans/tasks/progress/change state.
- Record OpenSpec progress only through OpenSpec.
- Keep selected agent, tier, context strategy, parallelism, reasons, documentation impact, and measurable usage in Orch operational telemetry, not task state.
- Never fabricate token usage or savings.

## Workflow

1. Read approved OpenSpec work.
2. Identify the next incomplete OpenSpec task.
3. Derive WorkUnits tied to that task; Orch automatically infers conservative documentation impact from each WorkUnit's file hints unless explicitly supplied.
4. Allocate targeted/broad/compressed context through Orch policy.
5. Route through the detected agent registry.
6. Analyze conservative parallelism.
7. Execute/delegate with the selected adapter and effective tier.
8. Update only relevant current-system docs when the approved implementation requires it.
9. Verify appropriately.
10. Update progress through OpenSpec only.
11. Record routing telemetry and continue until complete or blocked.
12. Display execution results and the mandatory Orch run summary.

## Mandatory Orch Run Summary

Report actual status for RTK, Repomix, LLMLingua, and the usage provider; use `not measured` when necessary. Include each routed WorkUnit with agent, requested/effective tier, context strategy, parallel/sequential decision, documentation impact, and human-readable reasons.
