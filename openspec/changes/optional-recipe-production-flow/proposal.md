## Why

Recipe creation currently forces a production-flow choice even when a bakery
has not designed the workflow yet. This blocks saving a valid recipe and makes
flow design an unnecessary prerequisite; recipe creation should support a
later assignment without weakening the separate production-flow builder.

## What Changes

- Keep Production Flow available in the recipe editor as an optional field.
- Allow a recipe to be saved with no assigned production flow.
- Preserve a selected flow when the baker chooses one during creation or edit.
- Show the unassigned state clearly and allow the flow to be assigned later
  through the existing recipe/production-flow workflow.
- Keep flow assignment bakery-scoped and preserve existing task-generation
  behavior for recipes that have a flow.
- Do not add a database migration; the existing nullable `recipes.flow_id`
  column already supports this state.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `recipe-management`: recipe creation and editing support an unassigned
  production-flow state.
- `production-flow-management`: a recipe may receive its production flow
  during creation or through a later assignment workflow.

## Impact

- Frontend recipe editor, recipe manager types, flow display, and focused tests
  under `Front-end/src/app/components/recipes/`.
- Recipe/domain adapter contracts and generated mapping where `flowId` is
  currently treated as required.
- No Supabase schema, RLS, hosted deployment, or migration changes are
  expected because `public.recipes.flow_id` is already nullable.
- Product roadmap trace: F4 Recipe Management and F7 Production Flow Builder;
  depends on the existing F1 shared application foundation and B4 recipe/flow
  foundation.
