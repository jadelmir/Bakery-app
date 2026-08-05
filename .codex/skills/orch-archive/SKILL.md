<!-- orch-managed:v1 -->
# Orch Archive

Verify and archive completed work through OpenSpec.

## Source of Truth

OpenSpec is the ONLY source of truth.

Orch MUST NOT maintain a separate archive.

## MUST

- Read the relevant OpenSpec change.
- Verify expected work is complete.
- If approved work declared or clearly required documentation synchronization, verify relevant current-system docs were updated.
- Documentation verification MUST NOT create a competing task/archive lifecycle.
- Use RTK for supported verification commands.
- Report incomplete work or failed verification.
- Archive through OpenSpec only.
- Report token-efficiency savings when available.

## Workflow

1. Locate the active OpenSpec change.
2. Confirm its required tasks are complete.
3. Verify required documentation synchronization when applicable.
4. Run relevant verification.
5. If verification fails, DO NOT archive, but STILL present mandatory run summary.
6. If complete, invoke the appropriate OpenSpec archive workflow.
7. Return the archive result and mandatory run summary.

## Mandatory Orch Run Summary

At the end of this workflow (even if archive is refused or fails), you MUST provide an Orch token-efficiency summary.

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
