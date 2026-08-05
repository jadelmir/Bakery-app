> Canonical path: `docs/PROJECT_ORGANIZATION.md`.

## OpenSpec Precedence

For all files and workflows managed by OpenSpec, the repository's installed OpenSpec configuration and conventions MUST take precedence over this document.

This document MUST NOT redefine OpenSpec artifact names, folder structures, commands, lifecycle rules, or validation requirements.

The organization rules in this document primarily apply outside the OpenSpec-managed directories.

When a rule in this document conflicts with OpenSpec, agents MUST follow OpenSpec.

# Project Organization Standard

This document defines how AI agents MUST organize code, documentation, and project knowledge in this repository.

It complements OpenSpec but does not replace it.

OpenSpec MUST remain the source of truth for proposed changes, requirements, design decisions, implementation tasks, and change history.

---

## 1. Normative Keywords

The keywords in this document MUST be interpreted as follows:

- **MUST** â€” Mandatory
- **MUST NOT** â€” Prohibited
- **SHOULD** â€” Strongly recommended
- **SHOULD NOT** â€” Normally avoided
- **MAY** â€” Optional

---

## 2. Core Organization Rules

Agents MUST follow the existing repository structure before creating new folders or files.

Agents MUST:

1. Search for an existing location before creating a new one.
2. Follow existing naming conventions.
3. Place related code together.
4. Keep feature-specific code inside the relevant feature or domain.
5. Keep reusable project knowledge in the appropriate documentation.
6. Avoid duplicating the same information across files.
7. Update the project map when an important new location is introduced.

Agents MUST NOT:

- Create a new top-level folder when a suitable folder already exists.
- Create duplicate documentation.
- Create shared abstractions for hypothetical future use.
- Move unrelated files during a task.
- Use OpenSpec as a general repository map.
- Store temporary debugging notes in permanent documentation.

---

## 3. Recommended Project Structure

The repository SHOULD use a structure similar to:

```text
AGENTS.md

docs/
  project-map.md
  project-organization.md
  agent-token-efficiency.md
  architecture.md
  api.md
  database.md

openspec/
  specs/
  changes/
```

Application code MAY use a different structure.

Agents MUST use the repository's actual frontend, backend, package, and workspace conventions.

Agents MUST NOT reorganize application code merely to match this example.

---

## 4. Responsibility of Each File

### `AGENTS.md`

`AGENTS.md` MUST contain concise, permanent agent instructions.

It SHOULD include:

- Project-wide rules
- Required commands
- Important architecture boundaries
- Links to relevant instruction documents
- Required validation behavior

It MUST NOT contain detailed API documentation, database schemas, or task-specific findings.

---

### `docs/PROJECT_MAP.md`

The project map MUST describe where important project areas currently exist.

It SHOULD identify:

- Frontend applications
- Backend applications
- Shared packages
- Feature or domain folders
- API clients
- Tests
- Database files
- Documentation
- OpenSpec locations

The project map MUST describe the actual repository.

It MUST NOT prescribe a theoretical structure that the project does not use.

---

### `docs/PROJECT_ORGANIZATION.md`

This document defines where new code and documentation SHOULD be placed.

Agents MUST read it when:

- Creating a new module
- Creating a new documentation file
- Moving files
- Introducing a new shared area
- Adding a major project folder

---

### `docs/AGENT_TOKEN_EFFICIENCY.md`

This file MUST define how agents minimize context loading, investigation, testing scope, and response size.

It MUST NOT duplicate OpenSpec or organization rules.

---

### `docs/ARCHITECTURE.md`

Architecture documentation MUST contain stable technical decisions.

Examples:

- Frontend/backend boundaries
- Authentication flow
- State-management rules
- Service responsibilities
- Integration patterns

Task-specific implementation details MUST remain in the active OpenSpec change.

---

### `docs/API_REQUIREMENTS.md`

API documentation MUST contain reusable API contracts.

Agents MUST update it when an endpoint is:

- Added
- Removed
- Renamed
- Behaviorally changed
- Given a new request or response format

---

### `docs/DATABASE_SCHEMA.md`

Database documentation SHOULD contain reusable information about:

- Tables
- Relationships
- Constraints
- Ownership
- Important indexes
- Data-flow rules

Generated schema output SHOULD NOT be copied in full unless required.

---

## 5. OpenSpec Responsibility

OpenSpec MUST be used for:

- Proposed changes
- Requirements
- Scenarios
- Technical design
- Implementation tasks
- Change review
- Completed change history

OpenSpec MUST NOT be used as:

- The repository map
- The permanent API reference
- The general database guide
- The general architecture guide
- The token-efficiency guide
- A location for unrelated project notes

Task-specific findings MUST remain in the active OpenSpec change.

Reusable findings MUST be moved or summarized into the appropriate permanent documentation.

---

## 6. Code Placement Rules

Feature-specific code MUST remain inside the relevant feature or domain whenever possible.

Examples include:

- Components
- Hooks
- Services
- Controllers
- API clients
- Validation
- Tests
- Types used only by that feature

Code SHOULD move to a shared location only when:

1. It is used by multiple features.
2. The abstraction has a clear stable responsibility.
3. An appropriate shared location already exists or is justified.

Agents MUST NOT create shared utilities for single-use code without a concrete need.

---

## 7. New File Rules

Before creating a new file, the agent MUST:

1. Search for an existing equivalent.
2. Identify the nearest related implementation.
3. Follow the existing filename pattern.
4. Place the file beside related functionality.
5. Avoid creating a new folder for one unnecessary file.
6. Update the project map when the new location matters for future navigation.

The agent MUST explain the need for a new top-level folder before creating it.

---

## 8. New Folder Rules

A new folder SHOULD be created only when:

- It groups multiple related files.
- It represents a clear feature, domain, package, or responsibility.
- Existing folders are not appropriate.
- The new location improves navigation.

A new folder MUST NOT be created solely to isolate one trivial file.

---

## 9. Documentation Placement

Reusable information MUST be stored according to its purpose.

| Information | Required Location |
|---|---|
| Repository navigation | Project map |
| Agent organization rules | Project organization file |
| Token-efficiency rules | Token-efficiency file |
| Stable architecture decision | Architecture documentation |
| API contract | API documentation |
| Database structure or relationship | Database documentation |
| Task-specific discovery | Active OpenSpec change |
| Permanent project-wide rule | `AGENTS.md` |

Agents MUST search for an existing document before creating a new documentation file.

Agents MUST NOT create files such as:

```text
notes2.md
api-new.md
architecture-final.md
project-map-updated.md
```

when an existing canonical document can be updated.

---

## 10. Duplication Rules

The same information MUST have one canonical location.

Other documents SHOULD link to or reference the canonical location instead of copying the full content.

Agents MUST NOT duplicate:

- API contracts
- Architecture decisions
- Database relationships
- Repository maps
- Agent rules
- OpenSpec requirements

Small summaries MAY be used when needed for context, but the canonical source MUST remain clear.

---

## 11. Temporary Information

Temporary information MUST remain temporary.

Examples:

- Debug logs
- Failed experiments
- Hypotheses
- One-time commands
- Investigation scratch notes
- Partial conclusions

Temporary information MAY be stored in the active OpenSpec change during investigation.

It MUST NOT be added to permanent project documentation unless it becomes stable and reusable.

---

## 12. Project Map Maintenance

When an agent adds or significantly changes an important project location, the agent SHOULD update the project map.

The project map SHOULD remain concise.

It SHOULD describe:

```text
Path â€” Responsibility
```

Example:

```md
- `apps/web/src/features/orders/` â€” Order pages, components, hooks, and API integration
```

The project map MUST NOT list every file in the repository.

---

## 13. Organization Workflow

When creating or moving files, the agent MUST follow this order:

1. Read `AGENTS.md`.
2. Read the existing project map.
3. Read this organization standard.
4. Search for related files and conventions.
5. Choose the smallest appropriate existing location.
6. Create or move only the required files.
7. Update reusable documentation when necessary.
8. Update the project map only when the repository's navigational structure changed.

---

## 14. Standard Agent Instruction

```text
Organize work according to the repository's existing structure.

You MUST:

1. Read `AGENTS.md`.
2. Read the existing project map.
3. Search for an existing location before creating files or folders.
4. Follow existing naming and placement patterns.
5. Keep feature-specific code within the relevant feature or domain.
6. Reuse existing shared locations when appropriate.
7. Store reusable information in the correct canonical document.
8. Keep task-specific findings in the active OpenSpec change.
9. Update the project map when an important location is introduced.
10. Avoid duplicate files, folders, and documentation.

You MUST NOT:

- Reorganize unrelated code
- Create unnecessary top-level folders
- Duplicate documentation
- Use OpenSpec as general project documentation
- Create shared abstractions without demonstrated reuse
```

---

## 15. Suggested `AGENTS.md` Router

The root `AGENTS.md` SHOULD remain small and MAY include:

```md
# Agent Instructions

Agents MUST follow:

- The existing project map for repository navigation
- `docs/PROJECT_ORGANIZATION.md` when creating or moving files
- `docs/AGENT_TOKEN_EFFICIENCY.md` for context and token efficiency
- OpenSpec for change planning, requirements, design, and tasks

Agents MUST read only the documents relevant to the active task.
```

Paths MUST be adjusted to match the actual repository.

---

## Final Rule

Agents MUST preserve a clear, predictable, and non-duplicative repository structure.

Agents MUST prefer the smallest appropriate organizational change.

Agents MUST NOT reorganize the project beyond what the active task requires.


