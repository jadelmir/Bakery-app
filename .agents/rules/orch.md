<!-- orch-managed:v1 -->
# Orch

This project uses Orch as an orchestration, token-efficiency, and project-organization layer around OpenSpec.

OpenSpec is the ONLY source of truth for specifications, plans, tasks, changes, progress, and archives.

Durable technical reference documentation MUST live under the configured docs root (default: docs/). Root entry-point documents such as README.md and AGENTS.md are allowed. Documentation MUST NOT duplicate OpenSpec plans, tasks, progress, or change state.

When implementation changes documented architecture, APIs, database behavior, setup, deployment, or operations, the relevant docs SHOULD be updated in the same approved work.

Use the installed Orch workflows/skills when appropriate:

- orch-explore
- orch-plan
- orch-execute
- orch-archive

Orch MUST NOT create competing persistent workflow state.

Use token-efficiency tools only when beneficial. Do not claim a tool was used merely because it is installed, and do not fabricate token savings.
