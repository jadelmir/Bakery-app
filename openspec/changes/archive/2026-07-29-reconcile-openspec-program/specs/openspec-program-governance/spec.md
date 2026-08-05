## Purpose

Keeps the Bakery App roadmaps, OpenSpec capabilities, changes, implementation evidence, and delivery gates traceable and coherent throughout the program lifecycle.

## ADDED Requirements

### Requirement: The program maintains a capability and dependency map
The project SHALL maintain one version-controlled map that relates every PRD frontend and backend phase to its OpenSpec capabilities or explicit gaps, upstream dependencies, owning change, implementation evidence, verification state, and next planning action.

#### Scenario: Auditing roadmap coverage
- **WHEN** a maintainer audits the product program
- **THEN** every PRD phase is traceable to one or more capabilities or an explicit unmapped gap, with directional dependencies and an accountable next action

#### Scenario: Reviewing a capability
- **WHEN** a maintainer opens a capability entry
- **THEN** the entry identifies its main spec, owning active change when any, relevant archive provenance, completion gate, evidence, and sync or archive readiness

### Requirement: Product phases remain distinct from execution strategy
The roadmap map SHALL preserve the existing frontend and backend product phases and SHALL treat single-agent or multi-agent work only as an execution strategy inside an approved change.

#### Scenario: Planning parallel work
- **WHEN** an approved change is divided into independent agent assignments
- **THEN** its roadmap phase and completion gate remain unchanged and the assignments retain non-overlapping task and file ownership

### Requirement: Planned work follows gated lifecycle stages
Every capability change SHALL proceed through audit, propose or update, apply, verify, sync, and archive in that order, and SHALL return to an earlier stage when a gate is not satisfied.

#### Scenario: Verification fails
- **WHEN** an applied change does not meet a required acceptance or verification check
- **THEN** the change returns to update or apply with the failed evidence recorded and is not synchronized or archived

#### Scenario: Archive is requested
- **WHEN** a change is considered for archive
- **THEN** its artifacts, task ledger, verification evidence, synchronized main specs, and roadmap-map entry agree that no required work remains

### Requirement: Archived changes remain immutable
The program SHALL recover a missing or incorrect main-spec result through a new corrective change and SHALL NOT rewrite an archived change to conceal the historical discrepancy.

#### Scenario: An archived delta is missing from main specs
- **WHEN** an audit finds that an archived requirement was not synchronized
- **THEN** a new change restates the corrective delta, cites the archive as provenance, and leaves the archive unchanged

### Requirement: OpenSpec configuration guides coherent artifacts
The project SHALL configure generation context and artifact rules that require roadmap traceability, explicit scope and non-goals, dependency and ownership decisions, testable scenarios, bounded tasks, verification, synchronization, and archive readiness.

#### Scenario: Proposing a new capability
- **WHEN** a new OpenSpec change is created
- **THEN** its artifacts identify the roadmap source, capability ownership, dependencies, non-goals, acceptance evidence, and lifecycle gates needed for implementation

### Requirement: Active task ledgers reflect verified reality
An active change SHALL mark a task complete only when its acceptance criteria and focused verification are evidenced, and SHALL distinguish local implementation, documentation, and hosted rollout work.

#### Scenario: A checked task lacks evidence
- **WHEN** a ledger audit cannot find the required implementation or verification evidence
- **THEN** the task is reopened or clarified and the change remains ineligible for synchronization or archive
