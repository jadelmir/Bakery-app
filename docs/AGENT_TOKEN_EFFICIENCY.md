> Canonical path: `docs/AGENT_TOKEN_EFFICIENCY.md`. See also: `docs/PROJECT_ORGANIZATION.md`.

# AI Agent Token Efficiency Rules

This document defines only token-efficiency rules for AI agents working in this repository.

It does not replace OpenSpec, project architecture documentation, testing standards, or coding conventions.

---

## 1. Required Context

Agents MUST begin with the smallest useful context.

Agents MUST read only:

1. `AGENTS.md`
2. `docs/PROJECT_MAP.md`
3. The active OpenSpec change
4. Files directly relevant to the current task

Agents MUST NOT automatically read:

- Every file in `docs/`
- Unrelated OpenSpec changes
- Archived OpenSpec changes
- Entire directories
- Generated files
- Build output
- Dependency folders
- Coverage reports
- Large lock files

Additional files MAY be opened only when the current evidence shows they are necessary.

---

## 2. Search Before Reading

Agents MUST search before opening broad areas of the repository.

Preferred search targets:

- Exact symbol
- Function name
- Component name
- Route
- API endpoint
- Database table
- Error message
- Filename
- Feature name

Agents MUST open the most likely files first.

Agents SHOULD inspect no more than five likely files before summarizing what was found.

Agents MUST NOT recursively scan the repository unless targeted search fails.

---

## 3. Scope Control

Agents MUST work only on the active task.

Agents MUST NOT:

- Modify unrelated files
- Investigate unrelated features
- Refactor nearby code without a task requirement
- Read unrelated OpenSpec changes
- Expand the task because another improvement was noticed

Unrelated issues SHOULD be recorded briefly as remaining issues instead of being fixed immediately.

---

## 4. Reuse Existing Knowledge

Agents MUST reuse information already present in:

- `docs/PROJECT_MAP.md`
- `docs/API_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- The active OpenSpec `design.md`
- Existing implementation patterns

Agents MUST NOT rediscover documented information unless it appears incorrect or outdated.

Before creating a new pattern, agents MUST search for an existing:

- API client
- Hook
- Service
- Controller
- Component
- Form
- Validation schema
- Error handler
- Test fixture
- Loading state
- Empty state

---

## 5. Avoid Repeated Investigation

When investigation has already been completed and recorded in the active OpenSpec change, implementation agents MUST use those findings.

Implementation agents MUST NOT repeat repository-wide investigation unless:

- The recorded file no longer exists
- The recorded behavior is incorrect
- Tests contradict the recorded conclusion
- The implementation path is blocked

When previous findings are invalid, the agent MUST update the existing design notes rather than creating duplicate notes elsewhere.

---

## 6. Investigation Limits

Agents MUST stop investigating once they have enough evidence to:

- Identify the root cause
- Identify the implementation path
- Identify the smallest set of files that must change
- Define the targeted validation required

Agents MUST NOT continue exploring merely to gain complete knowledge of the repository.

Agents SHOULD prefer a narrow, evidence-based conclusion over a broad architectural explanation.

---

## 7. File Reading Rules

Agents SHOULD read only the relevant portions of large files.

Agents SHOULD use symbol search, line ranges, or targeted queries instead of reopening full files.

Agents MUST NOT repeatedly reread unchanged files without a specific reason.

Agents SHOULD avoid reading:

```text
node_modules/
dist/
build/
coverage/
.next/
.git/
tmp/
logs/
openspec/changes/archive/
```

Agents SHOULD avoid large lock files unless resolving a dependency issue:

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
```

---

## 8. Task Size

Work SHOULD be divided into small tasks with one clear outcome.

Agents SHOULD complete one task before moving to the next.

Broad instructions such as:

```text
Connect the whole frontend to the backend.
```

SHOULD be split into smaller units such as:

```text
Connect bakery creation
Connect bakery listing
Connect customer creation
Connect order creation
```

Smaller tasks reduce repeated context loading, debugging scope, and output size.

---

## 9. Testing Efficiency

Agents MUST run the smallest useful validation first.

Preferred order:

1. Test the changed function or service
2. Test the affected API endpoint
3. Test the affected component or page
4. Run type checking for the affected application
5. Run linting for changed files
6. Run the full test suite only when broader regression risk exists

Agents SHOULD run the full test suite when:

- Shared infrastructure changed
- Authentication changed
- Shared types changed
- Database behavior changed broadly
- Core API contracts changed
- Targeted tests reveal broader failures

Agents MUST NOT run all frontend and backend tests after every small isolated change.

---

## 10. Documentation Efficiency

Agents MUST update documentation only when the new information is reusable.

Use:

| Information | Destination |
|---|---|
| API contract | `docs/API_REQUIREMENTS.md` |
| Architectural rule | `docs/ARCHITECTURE.md` |
| Directory responsibility | `docs/PROJECT_MAP.md` |
| Database relationship | `docs/DATABASE_SCHEMA.md` |
| Task-specific discovery | Active OpenSpec `design.md` |

Agents MUST NOT add:

- Temporary debugging logs
- Long implementation narratives
- Speculation
- Duplicate information
- Information already documented elsewhere

Documentation updates MUST be concise.

---

## 11. Prompt Efficiency

Agent prompts SHOULD include:

- The active task
- The relevant OpenSpec change
- The required files
- The expected evidence
- The output format

Agent prompts SHOULD NOT repeat:

- The full project history
- Entire documentation files
- Previously established architecture
- Unrelated requirements
- Large code snippets already available in the repository

References to repository files SHOULD be used instead of copying their full contents into prompts.

---

## 12. Output Efficiency

Agents MUST keep final responses concise.

The default final response MUST contain only:

```md
## Summary

## Files Changed

## Evidence

## Tests

## Remaining Issues
```

For bug fixes, a short `Root Cause` section MAY be included.

Agents MUST NOT include:

- A complete narration of every step taken
- Large code excerpts already present in changed files
- Repeated acceptance criteria
- Repeated task descriptions
- Unnecessary background explanations
- Suggestions unrelated to the active task

---

## 13. Multi-Agent Efficiency

Multiple agents MUST have non-overlapping responsibilities.

Recommended division:

```text
Agent 1: Investigate and record findings
Agent 2: Implement using recorded findings
Agent 3: Review the diff and evidence
```

Agents MUST NOT independently repeat the same investigation.

Review agents MUST focus on:

- The active OpenSpec change
- The resulting diff
- Test evidence
- Unmet requirements

Review agents MUST NOT rediscover the entire feature unless the evidence is insufficient.

---

## 14. Model Efficiency

The least expensive model capable of completing the task reliably SHOULD be used.

Smaller models MAY handle:

- File discovery
- Documentation updates
- Renaming
- Formatting
- Task checklist updates
- Simple isolated fixes
- Basic test generation

Stronger models SHOULD be reserved for:

- Cross-layer debugging
- Architecture
- Security-sensitive work
- Complex migrations
- Race conditions
- Large refactors
- Difficult performance problems

The strongest model SHOULD NOT be used automatically for every task.

---

## 15. Standard Token-Efficient Instruction

```text
Work token-efficiently.

You MUST:

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_MAP.md`.
3. Read only the active OpenSpec change.
4. Search by symbol, filename, route, or endpoint before opening files.
5. Inspect only files directly related to the task.
6. Reuse existing documentation and implementation patterns.
7. Avoid unrelated modules and archived changes.
8. Stop investigating when enough evidence identifies the solution.
9. Implement only the active task.
10. Run targeted tests first.
11. Update only reusable documentation.
12. Keep the final response concise.

You MUST NOT:

- Scan the entire repository without demonstrated need
- Repeat completed investigation
- Modify unrelated files
- Perform unrelated refactors
- Produce long implementation narratives

Return only:

## Summary
## Files Changed
## Evidence
## Tests
## Remaining Issues
```

---

## Final Rule

Agents MUST use the smallest amount of context, exploration, testing, documentation, and output necessary to complete the active task correctly.

Token savings MUST NOT come at the cost of correctness, validation, or required evidence.


