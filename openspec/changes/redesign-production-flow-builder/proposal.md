## Why

The current Production Flow Builder makes a baker configure a large set of low-level fields inside a dense modal. Scheduling, dependencies, ordering, and instructions are difficult to understand together, so users must translate technical values such as `dayOffset` and `dependsOn` into a mental production timeline before they can safely save a flow.

This redesign makes flow building easier to scan, easier to edit, and safer to validate while preserving the existing production-flow data contract and generated-task behavior.

## What Changes

- Replace the dense step form with a timeline-oriented flow editor that shows larger clickable flow cards next to each other, keeps an Add flow card first, opens an existing flow card directly in the full builder, and shows the sequence, timing summary, duration, category, and enabled state at a glance.
- Separate flow-level setup from step editing so a user can start with the recipe, flow name, and template choice before editing individual steps.
- Start every newly created custom flow with an empty step list so the baker adds the process one step at a time; existing templates remain available when explicitly editing or duplicating them.
- When creating a new flow, allow the baker to import an existing flow's steps, timing, and instructions into a new editable draft.
- Add a JSON import workspace with a copyable AI-organizer prompt on one side and an organized JSON input on the other that auto-populates the new flow.
- Add clearer step actions for reorder, duplicate, and delete, with confirmation or undo protection for destructive changes. Show enabled state as context without a separate Enable/Disable toolbar button.
- Replace technical scheduling labels with guided controls and readable summaries such as “1 day before pickup at 2:00 PM” or “30 minutes after Mix Dough.”
- Make dependency configuration understandable in baker language and prevent invalid self-dependencies, cycles, and references to disabled or deleted steps.
- Add inline validation, unsaved-change protection, and a save summary that explains what will change in the generated production schedule.
- Keep default sourdough and focaccia flows, recipe assignment, reset-to-default behavior, local workspace persistence, and generated-task semantics intact.

### Non-goals

- No redesign of the Production Today/Tomorrow/Calendar execution timeline; that remains owned by `production-time-block-timeline`.
- No new Supabase schema, hosted rollout, notification delivery system, or multi-user collaboration model.
- No change to the scheduling engine's existing task IDs, dependency evaluation, historical-task preservation, or recipe assignment rules unless required to support validation of the editor's existing contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `production-flow-management`: Improve the flow-builder interaction model, readable scheduling configuration, validation, and editing safeguards while retaining the existing flow requirements.

## Impact

- Frontend: `Front-end/src/app/components/production/ProductionFlowBuilder.tsx`, the Production flow-management surface in `ProductionScreen.tsx`, Recipe Manager flow entry points, and focused component/screen/browser tests.
- Domain: Existing `ProductionFlow` and `FlowStep` values remain the compatibility boundary; any new editor-only state must be translated back to the current model before save.
- Persistence: Existing local workspace/domain adapter save behavior remains in scope; no database migration is planned.
- Product traceability: Frontend roadmap phase F7 Production Flow Builder; related capabilities are `production-task-generation`, `production-schedule-views`, and recipe management. Owning change: `redesign-production-flow-builder`.
- Documentation: Update `openspec/PROGRAM_MAP.md` or the owning durable product reference only if the approved change alters capability coverage or current behavior beyond this delta.
