## 1. Draft model and editor contract

- [x] 1.1 Define the flow-builder draft, selected-step, dirty-state, validation-error, and responsive-panel interaction contracts without changing the persisted `ProductionFlow` / `FlowStep` shape.
- [x] 1.2 Add pure helpers for readable pickup-relative timing summaries, step identity generation, dependency graph validation, and draft-to-save normalization.
- [x] 1.3 Add focused unit coverage for timing summaries, valid dependency chains, self-dependency/cycle detection, missing references, disabled prerequisites, and no-enabled-step flows.

## 2. Flow overview and timeline workspace

- [x] 2.1 Replace the dense all-fields modal body with a responsive flow workspace that separates flow metadata, summary status, ordered step timeline, selected-step details, and save/cancel actions.
- [x] 2.2 Render each timeline item with step number, baker-facing name, category, enabled state, readable schedule summary, duration, dependency/warning state, and an accessible selected state.
- [x] 2.3 Keep the flow overview usable on narrow viewports without horizontal scrolling and preserve the existing default-template, recipe, and reset-to-default context.
- [x] 2.4 Present larger flow templates as clickable cards next to each other, keep an Add flow card first, and open an existing flow card directly in the full builder.

## 3. Step editing interactions

- [x] 3.1 Implement add-step and duplicate-step actions with sensible defaults, unique IDs, insertion next to the relevant step, and focus moved to the new step.
- [x] 3.2 Implement drag reorder plus explicit keyboard/button reorder controls, preserving step order and dependency references safely.
- [x] 3.3 Implement delete actions with clear status presentation, dependency-aware delete confirmation, and recovery/undo behavior where practical; keep enabled/disabled state visible without an Enable/Disable toolbar button.
- [x] 3.4 Replace technical labels with the grouped “What to do,” “When,” and “How it connects” editor sections while retaining all currently supported fields: name, category, instructions, pickup-relative day/time, duration, dependency, and groupability.

## 4. Validation and save safety

- [x] 4.1 Add inline and summary validation for required flow/step names, enabled instructions, valid time values, positive durations, missing references, self-dependencies, cycles, and flows with no enabled steps.
- [x] 4.2 Block invalid saves, focus or announce the first actionable error, and show a live readable schedule summary for the selected step.
- [x] 4.3 Add dirty-draft protection for close, cancel, reset, and entry-point changes so users can keep editing or explicitly discard changes.
- [x] 4.4 Preserve default-flow reset behavior, existing save callback semantics, recipe assignment, and subsequent generated-task compatibility; verify no task-generation or persistence contract changes are introduced.

## 5. Product integration and regression coverage

- [x] 5.1 Integrate the redesigned shared builder through the Production workspace Flow Builder entry point and the Recipe Manager Edit Production Flow entry point.
- [x] 5.2 Add component and screen tests for initial flow loading, timeline summaries, all step actions, validation blockers, dirty cancellation, reset behavior, save payload compatibility, and both entry points.
- [x] 5.3 Add desktop and mobile Playwright coverage for creating a valid custom flow from scratch, editing a default flow, resolving a dependency blocker, and saving/canceling from the responsive builder.
- [x] 5.4 Start newly created custom flows with zero steps, show an empty-state `Add first step` action, and preserve populated steps for existing flows/templates.
  - Evidence: `ProductionFlowBuilder.test.tsx` and `ProductionScreen.flowBuilder.test.tsx` verify empty new-flow creation, first-step insertion without a prerequisite, Focaccia recipe assignment, and populated existing-flow editing.
- [x] 5.5 Remove the redundant inline flow-details panel from the card overview and provide an optional import-from-existing-flow control for new drafts with fresh step IDs and preserved dependency links; allow switching back to a blank draft.
  - Evidence: `ProductionScreen.flowBuilder.test.tsx` verifies the overview has no inline assigned-recipe details, and `ProductionFlowBuilder.test.tsx` verifies importing a flow and returning to zero steps with `Start with a blank flow`.
- [x] 5.6 Add the two-panel JSON import workspace with a copyable AI-organizer prompt, organized JSON input, validation feedback, and automatic draft population with remapped dependencies.
  - Evidence: `ProductionFlowBuilder.test.tsx` verifies valid organized JSON populates a new flow and preserves the dependency relationship through fresh step IDs.

## 6. Verification and traceability

- [x] 6.1 Run focused tests followed by `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build`, and the affected Playwright suites; record failures without attributing unrelated worktree failures to this change.
- [ ] 6.2 Perform manual desktop/mobile acceptance against the F7 completion gate: build a valid custom flow, assign it to a recipe, understand timing summaries, and understand validation/deletion blockers.
- [x] 6.3 Update `openspec/PROGRAM_MAP.md` and any durable current-system reference only if verified implementation changes capability coverage or current behavior, then record evidence before archive/synchronization.
