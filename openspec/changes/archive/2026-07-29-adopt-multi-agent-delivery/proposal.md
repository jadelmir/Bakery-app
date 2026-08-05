## Why

The project has detailed frontend and backend delivery phases plus an OpenSpec
workflow, but it does not define how a lead agent should divide approved work
among sub-agents. Without durable ownership, model-selection, and integration
rules, parallel agents could edit overlapping files, interpret different
requirements, or mark a phase complete without end-to-end verification.

## What Changes

- Keep the existing frontend and backend product phases unchanged while making
  each phase executable through explicit multi-agent workstreams.
- Add repository-wide `AGENTS.md` instructions for orchestrator authority,
  sub-agent boundaries, OpenSpec usage, shared-filesystem safety, verification,
  and completion.
- Document when to use GPT-5.6 Sol or Terra for an orchestrator or sub-agent and
  how a user can request either model in plain language.
- Define a standard phase execution pattern with planning, backend, frontend,
  verification, and integration lanes.
- Place reusable roles, model policy, assignment validation, and lifecycle
  definitions behind an independent npm-ready package boundary.
- Keep Bakery-specific phase mappings outside the reusable package so the core
  can later be published and adopted by other repositories.
- Add a phase-by-phase ownership matrix without requiring every phase to use
  multiple agents when the work is small or tightly coupled.
- Keep OpenSpec synchronization and archiving under orchestrator control.

## Capabilities

### New Capabilities

- `multi-agent-delivery`: Defines how approved OpenSpec changes are divided,
  assigned, implemented, reviewed, integrated, and completed by an orchestrator
  and bounded sub-agents.

### Modified Capabilities

None.

## Impact

- Adds durable Codex guidance at the repository root.
- Adds a multi-agent delivery guide under `docs/`.
- Adds a private, dependency-free package under
  `packages/multi-agent-delivery/`; publishing is intentionally disabled until
  its package name and release policy are approved.
- Updates the PRD phase introductions and technical approach to reference the
  multi-agent execution model.
- Does not change application runtime behavior, product scope, database schema,
  or the names and ordering of existing product phases.
