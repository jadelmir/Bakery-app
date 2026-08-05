# Design: Production Time-Block Timeline

## Current-State Findings

- `ProductionScreen.tsx` already supports Today, Tomorrow, and Calendar, but
  the schedule maps each generated task to an individual execution card.
- `Task` and `DomainTask` retain product, quantity, flow step, scheduled time,
  status, dependency, and execution fields needed for a derived grouping model.
- `generatePlan()` creates one task per order item and flow step. The current
  `buildStarterPlans()` calculation already combines compatible starter demand
  by peak window and exposes contributing order items.
- The workspace already owns the authoritative `onTaskUpdate` path, including
  task-completion inventory deductions and domain command forwarding. The
  grouped UI can reuse that callback without changing persistence contracts.
- Flow Builder is rendered from the same screen but is intentionally outside
  this change.

## Information Architecture

1. Production header: `Production`, selected day, and existing Flow Builder
   toggle.
2. Day controls: Today selected by default, with Tomorrow and Calendar
   retained.
3. Chronological timeline: one block per scheduled time and flow step.
4. Block summary: time, action/step name, total product quantities, status
   summary, and primary grouped action.
5. Product breakdown: one line per product with aggregated quantity and the
   number of underlying tasks/orders when useful.
6. Expanded details: existing task-level instructions, dependency warnings,
   timers, delay, skip, notes, and exception handling.

## Grouping Model

The presentation selector SHALL derive blocks without mutating domain records.
The stable grouping key is:

```text
selected day + scheduled minute + flow step identity
```

The flow step identity uses `flowStepId` when available and a safe title/category
fallback for legacy tasks. Product lines aggregate `quantity` by product while
retaining every underlying task ID. Tasks with different flow steps remain
separate even when their clock time matches.

Starter blocks additionally connect to the existing starter-build calculation,
show the contributing product quantities, and expose the calculated seed,
flour, water, retained, and usable amounts in the expanded detail.

## Grouped Execution

The primary block action operates on all active underlying tasks in that block.
It calls the existing task update callback for each task so current inventory
deduction and domain command behavior remain unchanged and idempotent per task.
Blocks with completed, skipped, or cancelled tasks show a derived progress
state and apply the action only to remaining active tasks. Expanded details
retain task-level controls for timers, delay, skip, notes, and prerequisite
exceptions.

## Responsive Behavior

- Desktop uses a wider timeline block with the time rail, product summary, and
  action aligned horizontally where space permits.
- Mobile stacks time, block summary, product lines, and actions without hiding
  the primary grouped action.
- Existing accessible labels, status text, and keyboard interaction remain
  explicit; color is supplemental only.

## Directional Prerequisites

- Preserve the existing `production-schedule-views` Today/Tomorrow/Calendar
  contract and `production-task-generation` task associations.
- Reuse `buildStarterPlans()` and existing task update behavior rather than
  introducing a second starter or mutation calculation.
- Do not edit `production.ts`, `planning.ts`, domain adapters, or Supabase
  migrations unless implementation reveals a genuine contract gap; stop and
  return for review if that occurs.

## Risks and Mitigations

- Different products can share a flow-step ID but have different wording.
  Preserve product lines and show the underlying task details on expansion.
- A group can contain mixed statuses. Derive progress from underlying tasks and
  never mark completed history active again.
- Repeated callback updates could expose partial completion if a future
  persisted adapter rejects one task. Keep the UI's grouped action explicit and
  preserve task-level status/error evidence; a true transactional batch command
  is out of scope.
- The timeline could become dense on busy days. Keep product summaries compact,
  allow details to collapse, and retain the existing category filter.

## Return Path for Failed Verification

If grouping changes task ordering, starter totals, dependency warnings, or
existing execution journeys, return to the presentation selector and focused
time-block tests first. Do not alter task-generation or persistence behavior to
make a visual test pass.
