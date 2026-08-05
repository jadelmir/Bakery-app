## Purpose

Defines a safe, OpenSpec-governed multi-agent delivery process for the Bakery
App's existing frontend and backend phases.

## ADDED Requirements

### Requirement: Existing delivery phases remain product-oriented
The project SHALL preserve the names, ordering, outcomes, and completion gates
of its existing frontend and backend phases while documenting multi-agent
execution as a separate delivery concern.

#### Scenario: Preparing a phase for parallel work
- **WHEN** an existing phase is selected for implementation
- **THEN** its work is divided into bounded workstreams without renaming the
  phase or changing its product completion gate

### Requirement: One orchestrator owns each change
Every active multi-agent OpenSpec change SHALL have one orchestrator responsible
for task division, assignments, integration, verification, and final completion
status.

#### Scenario: Starting implementation
- **WHEN** an approved OpenSpec change is ready to apply
- **THEN** the orchestrator assigns exact task IDs, context, file ownership,
  verification, and stopping conditions before spawning implementation agents

#### Scenario: Completing implementation
- **WHEN** all sub-agents report completion
- **THEN** the orchestrator reviews the combined state and runs integrated
  verification before synchronizing or archiving the change

### Requirement: Sub-agents follow OpenSpec and bounded ownership
Every implementation sub-agent SHALL read the relevant OpenSpec artifacts and
SHALL stay within its assigned task and file boundaries.

#### Scenario: A new requirement is discovered
- **WHEN** a sub-agent finds that implementation requires a scope or design
  change
- **THEN** it reports the issue to the orchestrator and stops the affected work
  rather than silently modifying the approved contract

#### Scenario: Files overlap
- **WHEN** two proposed workstreams would edit the same files
- **THEN** the orchestrator serializes those tasks or assigns the shared files
  to one agent

### Requirement: Model selection is explicit and risk-based
The orchestration guide SHALL document how to request Sol or Terra and SHALL
recommend models according to task risk and complexity.

#### Scenario: High-risk backend work
- **WHEN** a task covers architecture, authorization, RLS, destructive
  migration risk, or final cross-cutting review
- **THEN** the orchestrator should prefer `gpt-5.6-sol` with an appropriate
  reasoning level

#### Scenario: Bounded routine work
- **WHEN** a task has clear acceptance criteria and limited blast radius
- **THEN** the orchestrator should prefer `gpt-5.6-terra` unless evidence shows
  the task needs stronger reasoning

### Requirement: Multi-agent use is selective
The project SHALL use multiple agents only when work can be divided into
independent, useful workstreams.

#### Scenario: Small or tightly coupled change
- **WHEN** parallel work would create more coordination or conflict risk than
  benefit
- **THEN** the orchestrator completes the change with one agent while retaining
  the same OpenSpec and verification requirements

### Requirement: Reusable orchestration core is package-isolated
The project SHALL keep generic roles, model policy, lifecycle gates, and
assignment validation in an npm-ready package that contains no Bakery-specific
phase or domain assumptions.

#### Scenario: Consuming the package locally
- **WHEN** project tooling imports the package entry point
- **THEN** it receives stable named exports for role definitions, model policy,
  lifecycle gates, and assignment creation without external dependencies

#### Scenario: Applying the Bakery delivery profile
- **WHEN** a Bakery App phase is prepared for multi-agent execution
- **THEN** project-specific phase ownership and verification guidance is applied
  outside the generic package

#### Scenario: Preventing accidental publication
- **WHEN** the package is first added to the repository
- **THEN** npm publication remains disabled until naming, licensing, semantic
  versioning, and public API decisions are explicitly approved
