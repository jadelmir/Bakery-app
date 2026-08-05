<!-- orch-managed:v1 -->
---
name: orch-explore
description: Read-only project exploration using Orch token-efficiency rules with OpenSpec as the only source of truth.
---

# Orch Explore

Explore the project without modifying anything.

## Source of Truth

OpenSpec is the ONLY source of truth.

## MUST

- Exploration MUST be read-only.
- MUST NOT edit project files.
- MUST NOT edit OpenSpec files.
- Read the minimum relevant context first.
- Prefer relevant durable technical docs under the configured docs root before broad repository scans when they can answer architecture/API/database/setup questions.
- Treat docs as current implementation reference only; requirements, plans, tasks, progress, changes, and archives remain in OpenSpec.
- Prefer targeted file reads.
- Use RTK for supported verbose terminal commands.
- Use Repomix only when broad repository context is necessary.
- Use LLMLingua only when context remains above the configured threshold.
- Avoid rereading unchanged files.
- Report token savings when available.

## Workflow

1. Inspect relevant OpenSpec state.
2. Read relevant current-system docs when useful.
3. Identify the minimum files needed.
4. Explore those files without modification.
5. If broader context is required, apply Orch's Repomix policy.
6. If context is still large, apply Orch's LLMLingua policy.
7. Use RTK for supported verbose command output.
8. Return findings and the mandatory Orch Run Summary.

## Mandatory Orch Run Summary

At workflow completion:
MUST display actual Orch optimization state.

MUST NOT assume a tool was used merely because it is installed.

MUST NOT fabricate token savings. Use "not measured" when values cannot be measured.

Desired final report format:

🧠 ORCH TOKEN EFFICIENCY
────────────────────────────────
Workflow: orch-explore

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
