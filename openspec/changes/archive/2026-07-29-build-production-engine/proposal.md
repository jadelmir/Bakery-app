## Why

Confirmed bakery orders currently have no production plan, leaving the baker to translate pickup times into mixing, fermentation, baking, cooling, and packaging work manually. Phase 3 introduces the production engine needed to turn the supported sourdough loaf and focaccia orders into a usable, traceable daily work schedule.

## What Changes

- Add reusable production-flow templates and an in-app flow builder for ordered, timed bakery steps.
- Generate a dated production task plan from a confirmed order, its pickup time, product quantity, and assigned flow.
- Provide chronological Today, Tomorrow, and Calendar views for generated tasks and pickup events.
- Allow production tasks to be completed, skipped with a reason, rescheduled, and linked back to their source order and flow step.
- Surface schedule conflicts and incomplete dependencies as warnings without attempting automatic schedule optimization.
- Replace the Phase 2 prototype message that production planning is unavailable when a production plan is generated locally.

## Capabilities

### New Capabilities

- `production-flow-management`: Define, edit, duplicate, and assign ordered production-flow templates for sourdough loaf and focaccia recipes.
- `production-task-generation`: Create deterministic, traceable production tasks from confirmed orders and recalculate future incomplete tasks when relevant order details change.
- `production-schedule-views`: Present generated tasks and pickups in chronological Today, Tomorrow, and Calendar views with actionable task states and dependency visibility.

### Modified Capabilities

- `frontend-prototype-alignment`: Update prototype scope messaging so generated local production plans are represented accurately while persistence and backend behavior remain explicit.

## Impact

- Affected frontend areas include orders, recipes, production/task views, calendar navigation, shared local state, and focused frontend tests.
- Adds local prototype data models and deterministic scheduling utilities; no backend, authentication, persistence, inventory deduction, or automatic capacity optimization is included in this phase.
- Uses the existing React, TypeScript, Vite, Tailwind, shadcn/ui, and Vitest frontend stack.
