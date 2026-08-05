# Tasks: Production Time-Block Timeline

- [ ] 1.1 Define a pure derived production timeline model that groups selected-
  day tasks by scheduled minute and flow step, aggregates product quantities,
  preserves task IDs/statuses, and attaches compatible starter-build details.
- [ ] 1.2 Add focused model tests for same-step grouping, distinct-step
  separation, quantity aggregation, mixed statuses, starter contributors, and
  stable chronological ordering.
- [ ] 2.1 Build a responsive accessible time-block component with time rail,
  action summary, product quantities, progress/status, pickup coexistence,
  expandable task details, and grouped completion.
- [ ] 2.2 Add focused component tests for grouped product summaries, grouped
  completion, partial/mixed status presentation, starter detail, and preserved
  task-level exception controls.
- [ ] 3.1 Integrate the timeline model and time-block component into
  `ProductionScreen.tsx`, keep Today as the default, and preserve Tomorrow,
  Calendar, category filters, timers, dependency warnings, and Flow Builder
  access without changing Flow Builder behavior.
- [ ] 3.2 Add screen-level coverage proving the selected day renders grouped
  chronological blocks and existing task/pickup context remains available.
- [ ] 4.1 Add desktop/mobile Playwright coverage for the default Today timeline,
  grouped 10-loaf/5-focaccia-style quantities, grouped completion, Tomorrow,
  Calendar, and responsive action access.
- [ ] 4.2 Run focused tests, typecheck, lint, full Vitest, build, and affected
  browser journeys; record manual visual acceptance for the production page.
- [ ] 5.1 Review ownership and regressions against active order persistence and
  status changes; update task evidence and `openspec/PROGRAM_MAP.md`.
- [ ] 5.2 Synchronize the verified production-schedule-views delta only after
  manual desktop/mobile acceptance; leave archive as a separate lifecycle
  request.
