# Agent Token-Efficiency Supplement

ORCH owns the active token-efficiency policy and operational reporting for this project. This document adds only repository-specific context guidance; it does not replace `.orch/config.json`, the installed ORCH workflows, or OpenSpec.

## Minimum context first

Agents SHOULD begin with:

1. `AGENTS.md`
2. the relevant active OpenSpec artifact
3. the smallest set of implementation files needed
4. a relevant current-system doc only when it answers the task faster than code discovery

Do not automatically load all of `docs/`, unrelated changes, `openspec/changes/archive/`, generated files, build output, dependency folders, coverage, or lockfiles.

## Search before broad reading

Search exact symbols, filenames, routes, tables, errors, and feature names before broad repository scans. Prefer targeted file sections and avoid rereading unchanged content.

Useful current references include:

- `docs/PROJECT_MAP.md`
- `docs/architecture/architecture.md`
- `docs/architecture/technical-requirements.md`
- `docs/api/api.md`
- `docs/database/database-schema.md`
- `docs/deployment/deployment-playbook.md`

## Scope control

Stay within the approved OpenSpec task. Unrelated improvements should be reported rather than silently added. Parallel work is appropriate only when tasks and writable files are independent.

## Tool reporting

Use RTK, Repomix, LLMLingua, and usage providers according to the active ORCH policy/configuration. Installation does not prove usage. Never fabricate token usage or savings; report `not measured` when measurement is unavailable.
