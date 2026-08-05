<!-- orch-managed:v1 -->
---
name: orch-plan
description: Plan work through OpenSpec while applying Orch token-efficiency rules.
---

# Orch Plan

Plan the requested change through OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

## MUST

- MUST NOT create an Orch-specific competing plan.
- MUST use OpenSpec for persistent planning.
- Identify likely documentation impact when architecture, APIs, database behavior, setup, deployment, operations, or product reference may change.
- Documentation-impact notes are operational metadata only; the actual plan and tasks MUST remain in OpenSpec.
- MUST NOT create `implementation_plan.md`, docs task lists, roadmaps, or other duplicate planning state.
- Determine the minimum required context.
- Prefer targeted reads, including relevant current-system docs when useful.
- Use Repomix only if broad context is required.
- Use LLMLingua only if context remains large.
- Use RTK for supported verbose terminal commands.
- Report token savings when available.
- DO NOT implement the planned work.

## Workflow

1. Read relevant OpenSpec state.
2. Understand the requested change.
3. Explore minimum necessary code and current-system docs.
4. Identify likely documentation impact.
5. Use the installed OpenSpec planning/proposal workflow.
6. Ensure the resulting plan lives only in OpenSpec.
7. Return a planning summary and mandatory Orch Run Summary.

## Mandatory Orch Run Summary

At workflow completion:
MUST display actual Orch optimization state.

MUST NOT assume a tool was used merely because it is installed.

MUST NOT fabricate token savings. Use "not measured" when values cannot be measured.

Desired final report format:

🧠 ORCH TOKEN EFFICIENCY
────────────────────────────────
Workflow: orch-plan

RTK
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

Repomix
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

LLMLingua
Status: <USED | SKIPPED | AVAILABLE | UNAVAILABLE | FAILED>
Reason: <reason if skipped/failed/available>
Saved: <measured tokens | not measured>

ccusage
Status: <AVAILABLE | UNAVAILABLE | FAILED>
Tracking: session/day usage
Per-workflow usage: not directly attributable

Context
Before: <tokens | not measured>
After:  <tokens | not measured>

────────────────────────────────
Run saved:     <tokens | 0 tokens | not fully measured>
Project saved: <tokens | not measured>

<🧠 Token efficiency was used | ℹ️ No token optimization was required for this run.>
