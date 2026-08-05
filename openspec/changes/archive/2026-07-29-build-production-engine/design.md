## Context

The existing frontend is a local React prototype with Phase 2 order journeys and no persistent backend. Phase 3 needs to introduce meaningful production planning while preserving that local-only boundary and the existing responsive navigation. See proposal.md and the Phase 3 delta specifications for the required behavior.

## Goals / Non-Goals

**Goals:**
- Add deterministic client-side flow definitions, task generation, and task state transitions for the two supported products.
- Make production work discoverable in order details and Today, Tomorrow, and Calendar screens.
- Keep generated plans traceable to the source order item and flow step.

**Non-Goals:**
- Supabase integration, multi-user synchronization, notifications, inventory deduction, starter consolidation, or equipment-aware schedule optimization.
- A generic drag-and-drop workflow editor or changes to the completed Phase 2 order workflow beyond generating its local plan.

## Decisions

### Use typed local production-domain data and deterministic scheduling utilities
Define flows, flow steps, generated tasks, task notes, and warnings as typed frontend data. Generate plans through pure utilities that accept a confirmed order and assigned flow, so a regenerated plan is predictable and testable.

The alternative is embedding schedule calculations in screen components. That would make task regeneration, test coverage, and traceability fragile across multiple views.

### Keep editable flow variants in shared prototype state
Seed the two required default templates, then manage duplicated or edited variants in the app's shared local state. Recipe assignments reference the active local flow id.

The alternative is treating flows as static display data. That would not support the required duplicate, edit, and assign workflow.

### Replace only future incomplete tasks during regeneration
Match generated tasks by source order item and flow step. When relevant order inputs change, rebuild pending and in-progress future tasks, retain historical terminal tasks, and expose any timing or dependency warning to the user.

The alternative is deleting and recreating every task. That would lose completed-work history and violate traceability.

### Derive schedule views from one generated-task collection
Today, Tomorrow, and Calendar read from the same production-task collection, filter by the bakery timezone date, and sort chronologically. Shared task-detail actions update the source collection so each view stays consistent.

The alternative is maintaining separate per-screen task lists, which would cause diverging status and scheduling information.

## Risks / Trade-offs

- [Local-only plans disappear on refresh] → Clearly label the prototype limitation and keep the domain boundary ready for later persistence.
- [Complex timing rules produce invalid dates] → Validate every generated timestamp and surface a warning instead of silently scheduling a task.
- [Edited flows make example orders harder to understand] → Preserve sensible defaults and show the selected flow on a generated plan.
- [Calendar controls become difficult on small screens] → Keep mobile calendar interactions focused on day selection and chronological task details.

## Migration Plan

1. Introduce typed flow, task, and schedule utility modules alongside the existing prototype data.
2. Seed and assign the standard sourdough and focaccia flows, then generate plans for confirmed example orders.
3. Add flow builder, task detail/actions, and derived schedule views while retaining existing navigation.
4. Add focused unit and UI tests, then run the frontend quality checks.

Rollback is a normal source revert. No persisted data or schema migration is introduced in this phase.
