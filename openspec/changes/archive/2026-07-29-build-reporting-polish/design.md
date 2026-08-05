## Context

Phase 4 provides local production, starter, and inventory data. Phase 5 derives reports and alerts from that shared state while improving presentation quality.

## Goals / Non-Goals

**Goals:** Derive reports, CSV-style exports, and notification records from existing local data; standardize responsive states.

**Non-Goals:** Persistent notifications, accounting integrations, browser push, or native applications.

## Decisions

Use pure reporting and notification selectors over shared local state so filters, exports, dashboard metrics, and alerts remain consistent. Use an in-app notification center rather than an external delivery service, preserving the current prototype boundary.

## Risks / Trade-offs

- [Local data resets] → Clearly label the prototype limitation.
- [Responsive regressions] → Add desktop/mobile UI coverage and smoke checks.

## Migration Plan

Add derived utilities, connect report and alert views, verify exports and responsive states, then run the frontend quality suite.
