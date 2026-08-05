---
name: orch
description: Execute multi-agent orchestration for a planned OpenSpec phase or change in the Bakery App codebase.
---

# `/orch` - Multi-Agent Phase Orchestration Executor

This skill instructs the agent on how to execute multi-agent orchestration for an approved OpenSpec phase plan in the **Bakery App** codebase using `packages/multi-agent-delivery`.

## Usage Syntax

```text
/orch <phase-or-change-name> [--provider=gemini|openai|claude]
```

Examples:
- `/orch recipe-management`
- `/orch customer-management`
- `/orch orders-and-payments --provider=gemini`

---

## Execution Workflow

When `/orch` is called:

### Step 1: OpenSpec & Plan Verification
1. Verify `openspec/changes/<target-change>/` is valid via `openspec validate <target-change>`.
2. Confirm `implementation_plan.md` or OpenSpec tasks are ready for execution.

### Step 2: Sub-Agent Delegation
For each non-overlapping task group in the plan:
1. Invoke sub-agents via `invoke_subagent` (or `define_subagent` if custom persona needed).
2. Pass complete assignment inputs:
   - Target change name and exact task IDs.
   - Exclusive writable file boundaries.
   - Documentation and source files to read first.
   - Focused test/verification commands.
   - Stop condition for ambiguity or scope change.

### Step 3: Integration & Verification Baseline
After sub-agents complete:
1. Review the shared workspace for cross-workstream consistency.
2. Resolve central integration points (e.g. `App.tsx` or router).
3. Execute project verification commands:
   ```bash
   cd Front-end
   npm run typecheck
   npm test
   ```
4. Run Playwright E2E tests when user journeys are affected:
   ```bash
   npx playwright test
   ```

### Step 4: OpenSpec Lifecycle Sync
1. Mark completed tasks `[x]` in `tasks.md`.
2. Verify change completeness with `openspec list`.
3. Update `openspec/PROGRAM_MAP.md` marking the phase as `verified`.
4. Synchronize spec deltas into `openspec/specs/`.
