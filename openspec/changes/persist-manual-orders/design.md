# Design: Persist Manual Bakery Orders

## Findings

- `Front-end/src/app/components/orders/AddOrderModal.tsx` renders fixture
  customers and recipes, describes the final step as a prototype preview, and
  calls `onCreatePlan` / `Generate Local Plan`.
- `Front-end/src/app/BakeryWorkspace.tsx` creates local optimistic order and
  task state, calls `domainContext.commands.createOrder` without awaiting its
  result, and always mounts `createLocalBakeryAdapter()` beneath the workspace.
- The local adapter expects fixture IDs such as `customer-sarah` and
  `recipe-sourdough`, while the live seed uses UUIDs. The current modal sends
  incompatible IDs such as `c1` and `r1`.
- The Orders view prefers any non-empty local snapshot over the optimistic
  `orders` state, so a failed local mutation can appear to do nothing.
- `public.orders`, `public.order_items`, and their membership RLS policies
  already exist. `public.generate_order_production_tasks` already provides
  authenticated, membership-checked, idempotent task regeneration.
- The current task generator creates one three-step task set for every
  `order_items` row and the latest task table does not persist task quantity;
  the live adapter therefore displays repeated work as separate quantity-one
  tasks and cannot scale inventory requirements.
- Generated `database.types.ts` currently does not include the domain tables,
  so the type-generation step must be treated as part of the integration work.

## Decisions

1. Add one new ordered Supabase migration containing an authenticated manual
   order RPC. The RPC will validate bakery membership through existing RLS and
   customer/recipe ownership, calculate totals from item inputs, insert the
   order and items atomically, and invoke the existing task-generation RPC.
2. Use the caller-generated order UUID as the retry identity. If the same UUID
   is submitted again after success, the RPC returns the existing order result
   without duplicating items or tasks. A new UUID is generated for a new
   submission.
3. Aggregate generated production work by recipe within an order. Each recipe
   receives one stable three-step plan, the task quantity is the sum of all
   matching order-item quantities, and the frontend requirement calculation
   multiplies recipe inputs by that quantity.
4. Keep monetary values in integer cents at the persistence boundary. The UI
   may display dollars, but it will not be the authority for total or payment
   status.
5. Add a persisted Supabase order port/adapter behind the existing domain
   command boundary. Feature screens will not call Supabase directly.
6. The live Add Order modal receives persisted customer and recipe catalog
   entries. Mock-mode tests continue using the local adapter and fixture data
   through the same port contract.
7. Persist the deposit amount and derived payment status. Do not silently claim
   that Cash/Venmo/Zelle selection is stored; payment-method persistence stays
   outside this change unless the product owner expands the scope.

## Integration Shape

```text
Active bakery membership
          |
          v
Persisted catalog snapshot ----> Add Order modal
          |                              |
          | real customer/recipe IDs     | stable order UUID
          v                              v
      Orders screen <---- shared domain command ---- Supabase manual-order RPC
          ^                                               |
          |                                               v
          +--------- persisted order/items/tasks <--- task regeneration RPC
```

The persisted adapter should return authoritative `DomainEntityChanges` so the
shared state controller updates the mounted Orders and Production projections
once. The UI must await that result, expose a typed failure, and only dismiss
the modal after a successful commit.

## Risks and Mitigations

- A browser-side sequence of order insert, item insert, and task generation can
  leave partial data. Use one RPC transaction and test rollback on invalid
  input.
- Existing online-order migration repair may add or replace related database
  functions. Keep this migration after that change's final migration or stop
  for orchestration sequencing if the two changes are both being applied.
- The current domain adapter interface contains more ports than this feature
  needs. Prefer a narrow persisted order port or an explicitly composed
  adapter over pretending unsupported local features are durable. Stop if
  integrating the port would mislabel unrelated prototype screens as
  persisted.
- The current payment method control has no storage contract. Preserve the
  deposit/payment-status behavior and record this limitation in the UI and
  acceptance evidence.
- Database identifiers are UUIDs while fixtures use semantic IDs. Tests must
  assert catalog IDs flow through unchanged and never rely on name-based
  lookup.

## Verification Boundary

Local Docker Supabase is the only database environment in scope. Verification
must include a clean migration reset, database tests for positive and denial
paths, generated-type drift checks, focused adapter tests, and desktop/mobile
browser coverage. No linked reset, production query, or hosted migration is
authorized by this plan.
