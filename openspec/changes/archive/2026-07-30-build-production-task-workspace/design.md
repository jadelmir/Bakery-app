# Design: Production Task Workspace & Execution (Phase F8 / B8)

## Architecture Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │                ProductionScreen.tsx                     │
 │   ┌─────────────────┐       ┌───────────────────────┐   │
 │   │ Task Filter Tabs│       │  Active Timers Widget │   │
 │   └─────────────────┘       └───────────────────────┘   │
 │   ┌─────────────────────────────────────────────────┐   │
 │   │              TaskExecutionCard                  │   │
 │   │  [Play/Pause Timer] [Delay +15m] [Skip] [Done]  │   │
 │   └─────────────────────────────────────────────────┘   │
 └────────────────────────────┬────────────────────────────┘
                              │
                    domainAdapter commands
                              │
 ┌────────────────────────────▼────────────────────────────┐
 │                   localAdapter.ts                       │
 │  - updateTask (updates status, timers, delays, skips)   │
 │  - calculates prerequisite step completion state        │
 └─────────────────────────────────────────────────────────┘
```

## Technical Decisions

1. **Timer State Management**:
   - Timers are tracked with `startedAt` timestamps and accumulated `elapsedSeconds`.
   - Active timers update live every second in local state without triggering full snapshot re-fetches.

2. **Delay & Rescheduling Logic**:
   - Postponing a task adds minutes to its scheduled time string (`10:00` + `15m` -> `10:15`) and updates its `urgency` tier.

3. **Prerequisite Dependency Validation**:
   - `calculateTaskDependencyStatus(task, allTasks, flows)` checks if all tasks belonging to prerequisite step IDs (`dependsOn`) are in `completed` status.
   - If incomplete, the UI renders a warning badge (`Prerequisite Step Pending: Mix Dough`) and disables quick-completion until the upstream step is marked complete.

## Data Structures

```typescript
export interface TaskExecutionState {
  readonly taskId: string;
  readonly timerRunning: boolean;
  readonly timerStartedAt?: string;
  readonly elapsedSeconds: number;
  readonly delayMinutes: number;
  readonly skipReason?: string;
}

export interface DelayTaskInput {
  readonly bakeryId: string;
  readonly taskId: string;
  readonly delayMinutes: number;
}

export interface SkipTaskInput {
  readonly bakeryId: string;
  readonly taskId: string;
  readonly reason: string;
}
```
