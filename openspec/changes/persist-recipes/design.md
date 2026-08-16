## Context

The authenticated workspace composes a local domain adapter with Supabase-backed customer, inventory, and production-flow adapters. `BakeryWorkspace` creates and updates recipes through the local adapter, whose snapshot is intentionally initialized empty when persisted mode is active. Its persisted `loadSnapshot` path never loads `public.recipes`, so the recipe editor can show an optimistic in-memory row briefly but the authoritative reload removes it. The current database row stores recipe identity, yield, batch cost, selling price, and nullable flow assignment; recipe ingredient lines are represented only in the frontend domain model.

This is an F4/B4 corrective change. The existing `optional-recipe-production-flow` change remains the sole owner of nullable flow-assignment UX and contract behavior. This change owns the authenticated recipe persistence boundary, reload behavior, and the schema needed to retain ingredient lines.

## Goals / Non-Goals

**Goals:**

- Persist and load bakery-scoped recipe rows in authenticated mode.
- Persist and load recipe ingredient quantities without repurposing the existing finished-good `ingredients.recipe_id` relationship.
- Preserve dollar/cents conversion, current ingredient-cost calculation, nullable flow assignment, and the existing local fixture adapter.
- Make create/update operations authoritative and error-aware rather than leaving an optimistic row when persistence fails.
- Keep recipe and recipe-ingredient reads and writes protected by authenticated bakery membership, including cross-bakery denial tests.
- Prove create, update, reload, ingredient round-trip, tenant isolation, and local/mock regression behavior.

**Non-Goals:**

- Do not redesign the Recipe Manager or the optional production-flow UX.
- Do not persist duplicate/archive/restore lifecycle actions in this change; the current `public.recipes` table has no archived column and those actions require a separately approved lifecycle persistence contract.
- Do not change storefront publication behavior, historical order snapshots, manual-order RPCs, or production-task generation.
- Do not modify hosted or production data. Local migration reset and local authenticated/RLS verification are the planning boundary.

## Decisions

1. **Add a normalized `recipe_ingredients` relation.** Store `recipe_id`, `inventory_item_id`, and quantity in a new bakery-scoped relation. Do not use `ingredients.recipe_id`, which already identifies a finished-good inventory item produced by a recipe and has different semantics. Store line quantities as the source of truth; derive line costs and batch cost from current inventory unit prices at load/save boundaries.

   **Alternative considered:** Store ingredient lines as JSON in `recipes`. This would avoid a relation but would duplicate inventory identity and weaken foreign-key/RLS enforcement, so it is rejected.

2. **Use one atomic persisted save boundary for recipe plus ingredient lines.** Add a membership-checked `save_recipe` RPC (or the repository-approved equivalent established during implementation) that validates the active bakery, upserts the recipe row, replaces its ingredient lines, and returns the authoritative recipe data. The frontend recipe adapter will call this boundary for create and update and will retain the existing domain adapter result shape.

   **Alternative considered:** Issue independent Data API insert/delete/upsert calls from the browser. That can leave a recipe without its lines or leave stale lines when a second call fails, so it is rejected for the authoritative mutation path.

3. **Load recipes as part of the persisted workspace snapshot.** Extend the authenticated adapter composition to load recipes and recipe lines alongside customers, inventory, and flows, then merge them into `recipesById`. Recalculate displayed ingredient costs and batch cost from the loaded inventory snapshot so an ingredient price change is reflected without rewriting historic order data.

   **Alternative considered:** Reuse the manual-order snapshot's reduced recipe projection. That projection intentionally omits costing and ingredient lines and cannot serve Recipe Manager editing, so it remains an order-read model only.

4. **Use valid persisted identifiers at the boundary.** Authenticated recipe creation will send UUID identifiers accepted by `public.recipes`; local/mock mode may retain its existing fixture-friendly identifiers. The adapter must reject malformed or duplicate persisted IDs with a mapped validation error rather than silently creating an optimistic row.

5. **Make recipe mutation callbacks awaitable.** Update the recipe manager callback contract so persisted create/update completes before closing the dialog and uses the authoritative adapter result to refresh the list. On failure, keep the draft open and show the mapped error. This prevents a successful-looking local row from masking a failed Supabase write.

6. **Preserve tenant isolation at both relation and RPC boundaries.** Enable RLS on `recipe_ingredients`, grant only the required authenticated Data API/RPC access, and use the existing bakery-membership helper/policy pattern. The save function must verify that the recipe and every inventory item belong to the requested bakery; no browser-provided bakery ID may bypass membership checks.

7. **Align recipe flow identifiers with the persisted flow contract.** The current `public.production_flows` migration intentionally uses string IDs, while the older `public.recipes.flow_id` column is UUID-typed. The recipe persistence migration will convert the nullable recipe column to text using the existing values, so default and custom flow IDs round-trip without inventing UUID-only IDs.

   **Alternative considered:** Coerce non-UUID flow IDs to null at the recipe boundary. This would make saves appear successful while losing a selected flow, so it is rejected.

## Risks / Trade-offs

- [The existing database row IDs and browser-generated IDs may not be valid UUIDs] → Generate UUIDs for persisted mode and cover the boundary with adapter tests; leave local fixture IDs unchanged.
- [A relation migration or RPC may drift from generated Supabase types] → Create the migration through the repository's imperative Supabase workflow, regenerate/check types, and run a clean local reset before marking tasks complete.
- [Current ingredient pricing may change after a recipe is saved] → Recalculate derived costs from the loaded inventory snapshot while retaining order-time price snapshots; test the updated display without changing historical order rows.
- [RLS on the new relation can accidentally block legitimate edits or permit cross-bakery joins] → Test same-bakery read/write, cross-bakery read/write, anonymous denial, and direct privilege/policy assertions against the local database.
- [The local domain snapshot and the manual-order read model may diverge] → Keep one persisted recipe mapping for Recipe Manager and retain the manual-order adapter's reduced projection for order creation only.
- [Existing active changes touch recipe/flow contracts] → Keep nullable flow semantics unchanged, assign this change exclusive ownership of persistence files, and run the focused recipe/flow regression suite.

## Migration Plan

1. Confirm the local Supabase CLI version and current schema/RLS state using repository-supported commands.
2. Create an ordered migration adding `recipe_ingredients`, its constraints/indexes, membership-scoped RLS/grants, and the atomic recipe-save boundary; update generated types through the existing script.
3. Add the frontend recipe adapter and compose it into authenticated workspace load/create/update paths while preserving local/mock behavior.
4. Run local reset, database security/RLS tests, adapter/component tests, typecheck, lint, build, and the affected browser journey.
5. If verification fails, stop at the failing boundary and record the exact failure in the change; do not push or mutate a linked/production project. Rollback before hosted rollout is a frontend revert plus the normal migration rollback/recovery procedure approved for the local schema workflow.

## Open Questions

None for the proposed scope. Implementation must use the repository's pinned Supabase CLI and existing membership helper rather than inventing a second authorization path.
