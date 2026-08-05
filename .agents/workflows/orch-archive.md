<!-- orch-managed:v1 -->
---
name: orch-archive
description: Verify and archive completed work through OpenSpec.
---

# Orch Archive

Archive completed work through OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

## MUST

- Verify the OpenSpec work is complete.
- If the approved work declared or clearly required documentation synchronization, verify the relevant current-system docs were updated before archival.
- Documentation verification MUST NOT create a second task/archive state; OpenSpec remains archive authority.
- Use RTK for supported verification commands.
- MUST NOT archive incomplete or failed work.
- MUST NOT create an Orch archive.
- Archive through OpenSpec only.
- Report token savings when available.

## Workflow

1. Read the relevant OpenSpec change.
2. Confirm required tasks are complete.
3. Verify required documentation synchronization when applicable.
4. Run relevant verification.
5. If verification fails, stop and report the issue, but STILL present mandatory Orch Run Summary.
6. If complete, use the installed OpenSpec archive workflow.
7. Return the archive result and mandatory Orch Run Summary.

## Mandatory Orch Run Summary

At workflow completion (even if archive is refused or fails):
MUST display actual Orch optimization state.

MUST NOT assume a tool was used merely because it is installed.

MUST NOT fabricate token savings. Use "not measured" when values cannot be measured.

Desired final report format:

🧠 ORCH TOKEN EFFICIENCY
────────────────────────────────
Workflow: orch-archive

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
