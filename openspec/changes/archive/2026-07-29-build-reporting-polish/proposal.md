## Why

The bakery can now plan production and inventory but cannot reliably review performance, export operational data, or receive timely reminders. Phase 5 turns the local prototype into a polished decision-support experience for completed work.

## What Changes

- Add filtered sales, cost, profit, payment, and product-performance reporting.
- Add exports for selected report and operational data.
- Add configurable in-app production, shortage, and pickup notifications.
- Improve mobile layouts, accessibility states, and end-to-end quality coverage.

## Capabilities

### New Capabilities
- `bakery-reporting`: Present filtered sales and profitability insights with product metrics and exportable results.
- `bakery-notifications`: Surface configurable in-app reminders for tasks, shortages, starter warnings, and pickups.
- `frontend-quality-polish`: Provide responsive, accessible, resilient states across the primary workflows.

### Modified Capabilities
- `inventory-requirements-management`: Surface shortages through the notification system.
- `starter-build-management`: Surface insufficient-starter warnings through the notification system.

## Impact

- Affects Finances, Dashboard, production alerts, responsive shared UI, local report data, and tests.
- Retains the current React, TypeScript, Vite local-prototype boundary; persistent delivery channels, external accounting, and native apps remain out of scope.
