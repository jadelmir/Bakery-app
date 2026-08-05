# Production Time-Block Timeline

## Problem

The Production page currently renders generated tasks as separate cards. When
multiple orders require the same work, the baker has to scan repeated cards and
manually add quantities. Starter demand is calculated by the planning layer but
does not read as one clear preparation instruction such as “10 loaves + 5
focaccia worth of starter.”

## Goal

Make the Production page an operational timeline organized by time. The default
Today view should show grouped time blocks, product quantities, and a clear
group-level execution action so a baker can understand what needs to happen
next without reconstructing the plan from individual order tasks.

## Program Traceability

- Frontend roadmap phase: F8 Production Task Workspace.
- Owning capability: `production-schedule-views`.
- Related capabilities: `production-task-generation`,
  `production-flow-management`, and `starter-build-management`.
- Prerequisites: existing generated task plans and the current local starter
  build calculations.
- Owning change: `production-time-block-timeline`.

## Scope

- Add a derived time-block presentation model grouped by scheduled time and
  flow step.
- Aggregate product quantities inside each block, while retaining product and
  underlying task traceability.
- Present the default Today view as a chronological production timeline.
- Apply the same grouping model to Tomorrow and Calendar day selections for
  consistent behavior.
- Add grouped execution for the primary completion action while preserving
  existing task-level controls for exceptions and detail work.
- Keep pickup events in chronological order alongside production work.
- Show starter-build quantities and contributing product demand in the starter
  block.

## Non-Goals

- Do not redesign or expand the Flow Builder in this change; it remains
  available as-is for a later phase.
- Do not change flow timing rules, task-generation algorithms, order status
  transitions, starter formulas, inventory calculations, persistence, RLS, or
  Supabase schemas.
- Do not introduce bakery-specific URLs, a new scheduling backend, drag-and-
  drop planning, or automatic rescheduling.
- Do not remove the existing Tomorrow or Calendar views, timers, delay, skip,
  notes, dependency warnings, or pickup context.

## Acceptance Evidence

- Today is selected by default when Production opens.
- Tasks at the same scheduled time and flow step appear in one time block.
- Each block shows product-level quantities, for example 10 sourdough loaves
  and 5 focaccia.
- Starter blocks show the contributing product quantities and calculated
  starter preparation details.
- The grouped completion action completes all active underlying tasks in the
  block through the existing update path.
- Tomorrow and Calendar preserve the same chronological grouping.
- Desktop and mobile layouts remain readable and actionable.
