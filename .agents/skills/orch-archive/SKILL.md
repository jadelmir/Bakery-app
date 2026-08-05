---
name: orch-archive
description: Archive a completed, manually tested OpenSpec phase or change in the Bakery App codebase and synchronize main specifications into openspec/specs/.
---

# `/orch-archive` - OpenSpec Phase Archival Tool

This skill instructs the agent on how to archive a completed and manually tested OpenSpec phase or change in the **Bakery App** codebase using OpenSpec CLI and `openspec/PROGRAM_MAP.md`.

## Usage Syntax

```text
/orch-archive <phase-or-change-name>
```

Examples:
- `/orch-archive add-recipe-management`
- `/orch-archive add-ingredients-and-stock-entry`
- `/orch-archive establish-shared-application-foundation`

---

## Safety Invariant: Manual Verification Required

> [!CAUTION]
> **NEVER archive work before it has passed manual testing and verification.**
> Archiving is immutable provenance in OpenSpec lifecycle governance. An active change must only be archived when:
> 1. All tasks in `tasks.md` are complete (`[x]`).
> 2. Full automated verification suite passes (`typecheck`, `lint`, `vitest`, `playwright`).
> 3. User manual testing confirmation is complete or explicitly approved.

---

## Archival Workflow

When `/orch-archive` is called:

### Step 1: Pre-Archive Verification & Readiness Audit
1. Locate the change in `openspec/changes/<target-change>/`.
2. Verify all tasks in `tasks.md` are marked complete (`[x]`).
3. Run `openspec validate <target-change>`.
4. Run standard project quality gates:
   ```bash
   cd Front-end
   npm run typecheck
   npm run lint
   npm test
   npx playwright test
   ```

### Step 2: OpenSpec Delta Alignment Check
1. Ensure scenario names in `specs/<capability>/spec.md` match main specs in `openspec/specs/` so OpenSpec delta matching succeeds cleanly.

### Step 3: OpenSpec Archive Execution
1. Run `openspec archive <target-change> --yes`.
2. Confirm the change moves to `openspec/changes/archive/<date>-<target-change>`.
3. Confirm main specs in `openspec/specs/` are updated/created with synchronized deltas.

### Step 4: Program Map Traceability Sync
1. Update `openspec/PROGRAM_MAP.md`:
   - Mark capability state as `synced` / `archived`.
   - Update owner to `Archived <date>-<target-change>`.
   - Record completion evidence and next action.
