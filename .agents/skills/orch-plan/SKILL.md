---
name: orch-plan
description: Plan multi-agent orchestration for a target OpenSpec phase or change in the Bakery App codebase without executing implementation code or modifying source files.
---

# `/orch-plan` - OpenSpec Phase Orchestration Planner

This skill instructs the agent on how to plan multi-agent orchestration for any target OpenSpec phase or change in the **Bakery App** codebase using OpenSpec and `packages/multi-agent-delivery`.

## Usage Syntax

```text
/orch-plan <phase-or-change-name> [--provider=gemini|openai|claude]
```

Examples:
- `/orch-plan recipe-management`
- `/orch-plan customer-management`
- `/orch-plan orders-and-payments --provider=gemini`

---

## Planning Workflow

When `/orch-plan` is called, the agent **MUST NOT modify source code or run destructive operations**. It performs planning only:

### Step 1: OpenSpec Change Resolution
1. Locate or create the OpenSpec change directory in `openspec/changes/<target-change>/`.
2. Inspect `proposal.md`, `design.md`, `specs/`, and `tasks.md`.
3. Verify program phase prerequisites in `openspec/PROGRAM_MAP.md`.

### Step 2: OpenSpec CLI Validation
1. Run `openspec validate <target-change>`.
2. Ensure delta specs exist under `specs/<capability>/spec.md` with `## ADDED/MODIFIED Requirements` and `#### Scenario:` blocks.

### Step 3: Model Policy Selection
- **Gemini (Default)**:
  - **Orchestrator / Architecture**: `gemini-3.6-flash` with `reasoningEffort: "high"`.
  - **Bounded Work**: `gemini-3.6-flash` with `reasoningEffort: "medium"`.
- **OpenAI**: `gpt-5.6-sol` (High) / `gpt-5.6-terra` (Medium).
- **Claude**: `claude-3.7-sonnet` (High) / `claude-3.5-haiku` (Medium).

### Step 4: Non-Overlapping Workstream Partitioning
1. Group active task IDs from `tasks.md` into non-overlapping workstreams.
2. Declare exclusive `writableOwnership` file sets for each sub-agent assignment.
3. Run `findOwnershipConflicts()` from `@multi-agent-delivery/core` to confirm zero file collisions.

### Step 5: Implementation Plan Generation
1. Write the design document to `implementation_plan.md`.
2. Detail:
   - Phase objective and OpenSpec change name.
   - Workstream assignments, target task IDs, and exclusive file boundaries.
   - Verification plan (`typecheck`, `vitest`, `playwright`).
3. Set `request_feedback: true` and present to the user.
4. **STOP and wait for explicit user approval before calling `/orch` to execute.**
