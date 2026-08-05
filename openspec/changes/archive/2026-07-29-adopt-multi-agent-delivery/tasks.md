## 1. Repository Agent Governance

- [x] 1.1 Add a root `AGENTS.md` defining orchestrator and sub-agent roles,
  OpenSpec requirements, exclusive file ownership, shared-workspace safety, and
  integration authority.
- [x] 1.2 Document explicit Sol/Terra model-selection guidance, reasoning
  defaults, and plain-language request examples.
- [x] 1.3 Add a private, dependency-free npm package boundary exporting generic
  agent roles, model policy, lifecycle gates, and assignment validation with
  built-in tests.

## 2. Phase Execution Guidance

- [x] 2.1 Add a multi-agent delivery guide with the standard change lifecycle,
  agent assignment contract, integration gate, and fallback to single-agent
  work.
- [x] 2.2 Map all existing frontend and backend phases to recommended
  orchestrator, implementation, and verification workstreams without renaming
  the phases.
- [x] 2.3 Update the PRD to reference the multi-agent execution model from both
  phase roadmaps and the recommended technical approach.
- [x] 2.4 Keep the Bakery-specific phase matrix and verification commands
  outside the reusable package and document how the project profile uses the
  generic core.

## 3. Verification

- [x] 3.1 Link the new guide from existing project documentation.
- [x] 3.2 Review the OpenSpec artifacts and documentation for consistent role,
  model, ownership, and completion rules.
- [x] 3.3 Run the reusable package tests and verify that its published file set
  contains no Bakery-specific implementation details.
