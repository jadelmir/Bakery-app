## Context

The current `ProductionFlowBuilder` is a 460-line modal that renders every flow-level and step-level field at once. The step cards expose implementation-oriented labels such as `Day Offset`, `Target Time`, and `Prerequisite Step (dependsOn)`, while ordering is handled by separate arrow buttons. The same builder is opened from the Production workspace and from Recipe Manager, so the redesign must preserve the shared callback boundary and the existing `ProductionFlow` / `FlowStep` model.

The active `production-time-block-timeline` change explicitly keeps Flow Builder behavior outside its scope. This change owns the builder experience only; generated schedule presentation, task execution, persistence contracts, and database schema remain separate concerns.

## Goals / Non-Goals

**Goals:**

- Make the flow's sequence and schedule understandable before a baker opens an individual step.
- Let a baker create a process from a genuinely empty flow and add each step intentionally in sequence.
- Reduce the amount of information shown at once by separating overview, step editing, and validation feedback.
- Make common actions—add, duplicate, reorder, and delete—obvious and keyboard accessible. Keep enabled/disabled state visible without a separate Enable/Disable toolbar button.
- Translate existing pickup-relative timing and prerequisite values into baker-facing language without changing their saved representation.
- Preserve default templates, recipe entry points, reset behavior, local/domain save callbacks, and generated-task semantics.
- Give implementation a testable interaction contract for desktop and mobile layouts.

**Non-Goals:**

- Replacing the production scheduling engine or adding a new scheduling rule model in this change.
- Redesigning the Today/Tomorrow/Calendar execution workspace.
- Adding notifications, multi-user collaboration, hosted persistence, or a Supabase migration.
- Changing task generation, task IDs, dependency evaluation, or historical-task preservation.

## Decisions

### 1. Use a flow workspace with a compact timeline and focused step editor

Replace the dense all-fields modal body with a responsive flow workspace. The flow overview presents larger templates as clickable cards next to each other, with an Add flow card always first. Selecting an existing flow card opens that flow directly in the full builder; the builder then shows its full details and ordered step timeline. On desktop, the selected flow's timeline is paired with the selected step's details in a side panel or clearly separated editor region. On mobile, the cards stack, the timeline remains the first view, and step details open as a full-width panel or stacked section.

Each timeline item shows step number, name, category, enabled/disabled state, readable schedule summary, duration, and a warning indicator when incomplete. This lets a baker understand the whole process without opening every card.

**Alternative considered:** Keep the current expanded card form and improve labels. Rejected because the primary usability problem is information density and lack of sequence context, not only wording.

### 2. Keep the existing domain model as the save boundary

The editor owns a draft copy of the current `ProductionFlow` and `FlowStep[]`. UI-specific selections and validation state stay local to the builder. Saving produces the existing model shape, including `dayOffset`, `time`, `duration`, `instructions`, `enabled`, `groupable`, and `dependsOn`, and calls the existing `onSave` callback.

The redesign will not introduce a new scheduling-rule schema. The current supported scheduling contract is presented as a guided “When” section with pickup-relative day and time controls, plus a separate “Depends on” control.

**Alternative considered:** Add a new generic scheduling-rule union for “hours after step,” “immediately after,” and “based on bake time.” Deferred because it would expand domain, task-generation, migration, and compatibility scope beyond a usability redesign.

### 3. Use progressive disclosure for step details

The step editor groups fields into three plain-language sections:

- **What to do:** step name, category, and baker instructions.
- **When:** day relative to pickup, time, and duration.
- **How it connects:** dependency and grouping eligibility. Enabled/disabled state remains visible in the timeline, but the selected-step toolbar does not expose a separate Enable/Disable button.

Technical field names are not shown in labels. A live sentence below the timing controls summarizes the saved rule, for example “1 day before pickup at 2:00 PM · about 20 minutes.”

### 4. Make editing actions reversible and dependency-aware

The timeline supports drag-and-drop reorder with visible keyboard move controls as a fallback. Duplicate creates a uniquely identified copy directly after the source step and updates no other step silently. Existing enabled/disabled values remain visible and are preserved at save, while the selected-step toolbar stays focused on editing and destructive actions. Delete requires an explicit confirmation when another step depends on the target and offers a clear choice to remove or reassign that dependency.

Validation prevents self-dependencies, dependency cycles, missing step references, empty enabled steps, invalid times, non-positive durations, and flows with no enabled steps. The builder blocks save while errors remain and places each message beside the affected step as well as in the summary.

### 5. Preserve entry points and save semantics

`ProductionScreen` and `RecipeManager` continue to open the shared builder component. Flow selection, duplication at the flow level, reset-to-default for default templates, and the existing `onSave` callback remain compatible. The new editor may change the component's internal presentation and test helpers but does not require a new route or backend operation.

### 6. Verify through focused interaction tests and visual journeys

Add component coverage for initial draft loading, timeline summaries, add/duplicate/reorder/disable/delete actions, validation blockers, dependency cleanup, cancel-with-dirty-draft behavior, and save payload compatibility. Add screen coverage for both Production and Recipe Manager entry points, then add desktop/mobile Playwright coverage for the primary builder journey and responsive step editing.

### 7. Start custom flows empty

When the builder opens without an existing flow, the draft SHALL contain zero steps. The timeline SHALL show an empty-state prompt with an `Add first step` action. Adding the first step creates only that step with no prerequisite; subsequent steps may default to following the previously added step. The setup section SHALL also offer an optional import from an existing flow, copying its steps, timing, instructions, and dependency relationships into a new editable draft with fresh step identities. Existing flows and explicitly selected templates SHALL retain their steps when opened.

### 8. Support AI-assisted JSON import

New-flow setup includes an optional JSON import workspace. The left panel provides a copyable prompt that asks an AI assistant to return only the supported production-flow JSON shape. The right panel accepts the organized JSON, validates its structure, remaps step identities and dependencies, and populates the draft without saving until the user reviews and explicitly saves it.

## Risks / Trade-offs

- **[Risk]** A new layout could make editing slower for experienced users who prefer seeing every field at once. → **Mitigation:** keep the timeline summary dense, remember the selected step, provide keyboard navigation, and preserve direct access to every existing field.
- **[Risk]** Reordering or disabling a prerequisite can invalidate downstream dependencies. → **Mitigation:** validate the dependency graph on every draft change, show affected steps, and require explicit resolution before save.
- **[Risk]** Existing local/domain save behavior may appear to succeed while generated future tasks are not immediately regenerated. → **Mitigation:** keep save messaging explicit about the scope of the saved flow and verify the existing subsequent-order behavior in integration tests.
- **[Risk]** The shared builder is opened from two different product contexts. → **Mitigation:** test both entry points and keep the component callback contract stable.
- **[Risk]** Browser drag-and-drop can be unreliable on touch devices and assistive technology. → **Mitigation:** provide keyboard and explicit move actions as first-class alternatives; drag is an enhancement, not the only reorder path.

## Migration Plan

1. Implement the new draft/timeline presentation behind the existing `ProductionFlowBuilder` component contract.
2. Add focused tests before removing the old interaction structure, then integrate both current entry points.
3. Run typecheck, lint, focused tests, full Vitest, build, and affected desktop/mobile browser journeys.
4. Perform manual desktop and mobile acceptance against the F7 completion gate: create a valid flow from scratch, assign it to a recipe, and understand validation/deletion blockers.
5. Rollback is a frontend-only revert of the builder and its tests; no database or hosted migration is required.

## Open Questions

- Should the flow overview show only the recipe currently being edited, or should it also show a read-only count of recipes using the flow once multi-recipe assignment exists?
