# Proposal: Production Task Workspace & Execution (Phase F8 / B8)

## Executive Summary
This change implements Phase F8 / B8 (Production Task Workspace & Execution), enabling interactive daily task execution, real-time timer tracking, task delay rescheduling (+15m, +30m, next shift), skip reason logging, and prerequisite step dependency validation on the Production Screen.

## User Value & Use Cases
1. **Interactive Task Execution**: Bakers can view today's scheduled tasks grouped by category (prep, starter, mixing, shaping, ferment, baking, packaging) or urgency (overdue, due-now, upcoming).
2. **Timer Tracking**: Bakers can start/stop active timers per task to measure actual vs estimated durations.
3. **Delay & Skip Logging**: When delays occur in the kitchen, bakers can postpone tasks with preset durations (+15m, +30m, tomorrow) or record skip reasons for auditing.
4. **Prerequisite Safety**: System prevents completing downstream tasks if prerequisite flow steps are incomplete.

## Proposed Scope
- `Front-end/src/app/domain/types.ts`: Add `TaskExecutionLog`, `StartTaskTimerInput`, `StopTaskTimerInput`, `DelayTaskInput`, `SkipTaskInput`.
- `Front-end/src/app/domain/localAdapter.ts`: Implement task execution, timer tracking, delay rescheduling, and skip logging in domain adapter.
- `Front-end/src/app/screens/ProductionScreen.tsx`: Enhance Production workspace with timer controls, category filters, delay modal, and prerequisite dependency badges.
- `Front-end/src/app/components/production/TaskExecutionCard.tsx` `[NEW]`: Enhanced task card component with active timer, delay trigger, skip dialog, and instructions viewer.

## Non-Goals
- Persistence to Supabase database (handled in Phase B8/B12 backend migrations).
- Hardware timer audio chimes or push notifications.
