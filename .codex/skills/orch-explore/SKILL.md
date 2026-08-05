<!-- orch-managed:v1 -->
# Orch Explore

Explore the project without modifying anything.

## Source of Truth

OpenSpec is the ONLY source of truth.

Orch does not maintain separate specifications, plans, tasks, changes, or archives.

## MUST

- Exploration MUST be strictly read-only.
- MUST NOT edit project files.
- MUST NOT edit OpenSpec files.
- MUST NOT create implementation files.
- MUST NOT update tasks.
- MUST NOT apply OpenSpec changes.
- MUST NOT archive changes.
- Read the minimum relevant context first.
- Prefer relevant durable technical docs under the configured docs root before broad repository scans when useful.
- Treat docs as current implementation reference only; planning/state belongs in OpenSpec.
- Prefer targeted file reads over broad repository reads.
- Use RTK for supported verbose shell, git, test, and build commands.
- Use Repomix only when broader repository context is actually necessary.
- Use LLMLingua only when the remaining context exceeds the configured threshold.
- Avoid rereading unchanged files.
- Report token-efficiency usage and savings when available.

## Workflow

1. Read relevant OpenSpec context.
2. Read relevant current-system docs when useful.
3. Identify the minimum project files required.
4. Inspect those files without modifying them.
5. If targeted context is insufficient, use the Orch Repomix policy.
6. If context remains above the configured LLMLingua threshold, allow Orch compression.
7. Prefer RTK for supported terminal commands.
8. Return findings and the mandatory run summary.

## Mandatory Orch Run Summary

At the end of this workflow, you MUST provide an Orch token-efficiency summary.

The summary MUST distinguish:
- tool available
- tool used
- tool skipped
- tool unavailable
- tool failed

MUST NOT fabricate token values. If exact usage or savings are unavailable, print "not measured".

Expected report structure:

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