## Context

The frontend is a Figma-generated React/Vite project in `Front-end`. It currently has a single large `App.tsx`, local mock data, and interactive prototype state, but no lockfile, type-checking configuration, lint/test scripts, or installed dependencies. The system-level npm launcher is not reliable in the current environment; pnpm is available. See proposal.md for motivation and the frontend-runtime-verification spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Make installation and build verification repeatable from a clean checkout.
- Add a lightweight quality baseline that catches build, typing, lint, and regression problems.
- Verify the existing responsive prototype in a real browser without changing the approved visual direction.
- Document local development clearly enough for later frontend-restructuring work.

**Non-Goals:**

- Splitting `App.tsx`, adding routes, or changing the frontend architecture.
- Replacing mock data, adding persistence, or connecting Supabase.
- Adding new product screens or changing approved product requirements.
- Recreating the Figma design.

## Decisions

### Use pnpm as the supported project package manager

The project already contains a pnpm workspace marker and pnpm is available even though npm is not reliable in this environment. The implementation will create and commit a pnpm lockfile, then document pnpm commands. npm remains an unsupported fallback rather than a second source of dependency truth.

Alternative considered: repair or standardize on npm. This would depend on a broken user-level npm installation and would create a second lockfile convention, so it is not selected.

### Add isolated developer-tool configuration

TypeScript, linting, and test configuration will be added alongside the generated application rather than rewriting generated UI code. Scripts will call these tools independently so failures identify the relevant gate.

Alternative considered: rely on Vite build alone. A build does not provide the requested lint/test workflow and can miss maintainability issues.

### Treat browser smoke testing as a preservation check

Browser verification will cover the existing navigation and Add Order prototype at one mobile and one desktop viewport. It will capture actual runtime failures and major responsive regressions without asserting a pixel-perfect recreation or expanding feature scope.

Alternative considered: delay browser checks until backend integration. This would let existing prototype failures survive into later, more complex work.

### Keep runtime behavior and mock data unchanged

Phase 1 will not refactor the monolithic component or alter sample recipes, orders, or interactions except where a minimal correction is necessary to make the current prototype build or run.

Alternative considered: combine verification with the Phase 3 restructuring. Separating them makes it possible to distinguish inherited Figma-export issues from refactor regressions.

## Risks / Trade-offs

- [Figma-export dependencies may be stale or incompatible with the current Node runtime] → Pin resolved dependency versions in the lockfile and record any runtime constraint in the README.
- [Lint rules may report a large generated-code backlog] → Start with a focused, documented baseline and avoid broad style rewrites in this phase.
- [A browser test can be brittle if it asserts presentation details] → Test navigation and workflow reachability, not exact styling.
- [The prototype stores state locally] → Document that smoke tests validate interactions only; persistence is deliberately deferred.

## Migration Plan

1. Add the package-manager metadata, developer tools, scripts, and documentation.
2. Install dependencies from the declared manifest and generate the lockfile.
3. Run build, type, lint, and test commands.
4. Run browser smoke checks at mobile and desktop widths.
5. Commit only project configuration, lockfile, documentation, and minimal fixes required for successful verification.

Rollback consists of reverting the Phase 1 configuration and dependency-metadata changes; no data migration or backend rollback is required.
