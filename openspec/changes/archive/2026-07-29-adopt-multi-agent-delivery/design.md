## Context

Codex agents in the current environment share one workspace and can run in
parallel. The project already uses OpenSpec for proposals, designs,
requirements, and implementation tasks, but has no root `AGENTS.md` and no
durable orchestration policy. The PRD contains twelve frontend phases and twelve
backend phases whose work often overlaps by capability.

## Goals / Non-Goals

**Goals:**

- Make product phases multi-agent-ready without renaming or restructuring them.
- Treat OpenSpec as the contract shared by the orchestrator and sub-agents.
- Prevent overlapping edits and uncontrolled scope expansion.
- Establish clear Sol/Terra selection guidance.
- Make the generic orchestration contract reusable and exportable through npm.
- Require final integration and verification by the orchestrator.
- Allow single-agent execution when parallelization would add more risk than
  value.

**Non-Goals:**

- Adding AI agents to the Bakery App runtime.
- Building an API-based agent orchestrator into the application.
- Requiring a fixed number of agents for every phase.
- Allowing sub-agents to approve product decisions or archive changes.

## Decisions

### 1. Preserve product phases and add execution workstreams

Frontend and backend phases describe product outcomes and dependency order.
Multi-agent roles describe how work is executed. These concerns remain
separate, with a matrix mapping each phase to recommended lanes.

### 2. The primary agent owns orchestration

The primary agent selects or creates the OpenSpec change, partitions tasks,
assigns non-overlapping file ownership, resolves conflicts, runs whole-project
verification, and decides whether the change is ready to synchronize or
archive.

### 3. Sub-agents work from bounded OpenSpec task assignments

Every implementation sub-agent receives the exact change name, task IDs,
required artifacts, owned files, verification commands, and stopping
conditions. A sub-agent may report a design issue but may not silently change
scope.

### 4. Use Sol selectively and Terra by default for bounded work

Use `gpt-5.6-sol` for high-risk architecture, security, RLS, migrations,
cross-cutting integration, difficult debugging, and final review. Use
`gpt-5.6-terra` for well-scoped implementation, tests, documentation, routine
CRUD, and repository exploration. The orchestrator may override this based on
risk and measured task difficulty.

### 5. Shared workspace requires exclusive ownership

Agents must not edit the same files concurrently. Research and review agents
remain read-only unless assigned explicit files. The orchestrator checks the
current file state before integration because all edits become visible
immediately.

### 6. Completion remains evidence-based

Focused agent tests are necessary but not sufficient. The orchestrator runs
integrated type checking, linting, tests, builds, migrations, and security
checks appropriate to the phase before marking it complete.

### 7. Separate reusable core from the Bakery profile

Generic model definitions, agent roles, lifecycle gates, and assignment
validation live in `packages/multi-agent-delivery` as dependency-free ESM with
stable named exports and built-in tests. Bakery-specific phase mappings,
commands, and acceptance gates remain in repository documentation.

The package starts with `private: true` to prevent accidental publication.
Future publication requires an approved package name, versioning policy,
license, public API review, and removal of the private flag. No package code may
depend on Bakery-specific paths or domain terminology.

## Risks / Trade-offs

- Parallel work increases token and coordination cost.
- Poor task partitioning can create conflicting assumptions.
- A shared workspace makes overlapping edits especially risky.
- Model overrides can increase cost or latency when Sol is used unnecessarily.
- A premature public package API could become difficult to change.
- Some phases are too sequential or tightly coupled to benefit from multiple
  implementation agents.

These risks are mitigated by bounded tasks, exclusive file ownership, explicit
model selection, one integration owner, a small dependency-free public surface,
and disabled publication until the API is reviewed.
