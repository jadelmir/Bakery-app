# Proposal: Establish Documentation Foundation

## Problem

`PROJECT_ORGANIZATION_STANDARD.md` and `AI_AGENT_TOKEN_EFFICIENCY.md` both
reference canonical documentation paths (`docs/project-map.md`,
`docs/architecture.md`, `docs/api.md`, `docs/database.md`,
`docs/agent-token-efficiency.md`, `docs/project-organization.md`) that either
do not exist or exist under non-standard filenames.

This means:
- Agents silently ignore Rule 4 of token efficiency (reuse existing docs) because those paths return nothing.
- The project map referenced in Section 13 (Organization Workflow) cannot be read because the file doesn't exist.
- `API_DOCUMENTATION.md`, `AI_AGENT_TOKEN_EFFICIENCY.md`, and `PROJECT_ORGANIZATION_STANDARD.md` violate the naming standard they themselves define.

## Proposed Change

1. Create `docs/project-map.md` — real navigation map of the repository.
2. Create `docs/architecture.md` — stable technical decisions extracted from existing docs.
3. Rename `docs/API_DOCUMENTATION.md` → `docs/api.md` — adopt standard name.
4. Create `docs/database.md` — table inventory and relationship summary from `BACKEND_REQUIREMENTS.md`.
5. Rename `docs/AI_AGENT_TOKEN_EFFICIENCY.md` → `docs/agent-token-efficiency.md`.
6. Rename `docs/PROJECT_ORGANIZATION_STANDARD.md` → `docs/project-organization.md`.
7. Update all cross-references in `AGENTS.md` and the renamed/new files.

## Non-Goals

- No source code changes.
- No OpenSpec spec deltas (skip_specs: true).
- No changes to existing content beyond what is required for correctness.
- No reorganization of `Front-end/` or `openspec/` directories.
