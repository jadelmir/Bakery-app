# Proposal: Add Recipe Management and Costing (Phase F4)

## Why

Bakery managers and head bakers require precise recipe configuration, batch yield scaling, ingredient cost accumulation, target profit margin calculations, and recipe lifecycle management (duplication, archiving, and restoration). F4 builds upon F1 Shared Application Foundation, F2 Authentication & Workspaces, and F3 Ingredients & Stock Entry.

## User Impact

- **Bakers & Managers**: Can configure structured recipes with exact ingredient quantities, compute real-time batch costs based on stock ingredient pricing, evaluate gross profit margins against selling prices, duplicate existing recipes for quick variations, and archive/restore recipes without losing order history.

## Proposed Changes

- Add `DomainRecipe` management commands to the domain port contract (`createRecipe`, `updateRecipe`, `duplicateRecipe`, `archiveRecipe`, `restoreRecipe`).
- Implement recipe batch costing and margin calculation utilities ($Cost = \sum Q_i \cdot P_i$, $Margin = \frac{Price - Cost}{Price} \cdot 100\%$).
- Build interactive UI components for recipe creation, ingredient selector dropdowns, batch yield adjustments, duplication, and archive controls.
- Integrate full Vitest unit suite and Playwright end-to-end browser verification.

## Dependencies

- **Prerequisites**: F1 (Shared Application Foundation), F2 (Multi-Store Workspaces), F3 (Ingredients & Stock Entry).
- **Downstream**: F7 (Production Flow Builder), F11 (Finances & Invoices).

## Risks and Mitigations

- **Cost Precision**: Floating-point rounding errors in ingredient unit prices. *Mitigation*: Round currency calculations to 2 decimal places and preserve high-precision base unit costs.
- **Workflow Safety**: Accidental deletion of active recipes used in past orders. *Mitigation*: Soft-archive instead of hard deletion; preserve historic recipe snapshots on existing orders.
