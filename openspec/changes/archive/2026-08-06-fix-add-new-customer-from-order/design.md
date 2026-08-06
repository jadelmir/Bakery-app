# Design: Fix Add New Customer From Order

## Existing Capability Reuse

The customer directory already owns customer validation and persistence. The order flow will reuse `CustomerEditorDialog` and the bakery-domain `createCustomer` command.

## Interaction

1. User opens New Order and remains on the Customer step.
2. Add new customer opens `CustomerEditorDialog`.
3. Saving invokes `createCustomer` with the active bakery ID.
4. Failed mutations remain inside the editor and display the existing error state.
5. Successful mutations provide an authoritative returned customer.
6. The editor closes, the returned customer becomes selected, and the New Order wizard remains open.
7. The user can continue to Products immediately without waiting for a full page or manual-order snapshot reload.

## Implementation Boundary

`useBakeryDomain` exposes the active bakery ID alongside the existing state and commands so the order modal can call the established domain command without adding a second persistence path. This is a backward-compatible hook extension.

No database or API changes are required.
