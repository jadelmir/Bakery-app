## Why

Finishing the new-order flow generates tasks but does not reliably associate the resulting plan with the newly created order. Bakers therefore cannot open the order and review its production work.

## What Changes

- Persist the local generated-plan reference against the newly completed order.
- Show the assigned plan immediately after order creation and in order details.
- Prevent duplicate plan assignment when the completion action is repeated.

## Capabilities

### New Capabilities
- `order-production-plan-assignment`: Associate one generated local production plan with each completed order and expose it from order details.

### Modified Capabilities
- `production-task-generation`: Require generated tasks to retain their newly created order association.

## Impact

- Affects the add-order completion path, local order state, production-task collection, order details, and tests.
