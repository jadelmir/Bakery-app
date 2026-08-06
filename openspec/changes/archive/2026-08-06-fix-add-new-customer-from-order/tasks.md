# Tasks: Fix Add New Customer From Order

- [x] 1.1 Confirm the Add new customer action is a frontend wiring gap and that persisted customer creation already exists.
- [x] 2.1 Reuse `CustomerEditorDialog` from the New Order customer step.
- [x] 2.2 Route creation through the active bakery's existing `createCustomer` domain command.
- [x] 2.3 Select the authoritative returned customer and keep the New Order wizard open.
- [x] 2.4 Preserve failure and cancel behavior without creating a local fake customer.
- [x] 3.1 Add focused component tests for successful creation/selection, persistence failure, and cancel.
- [ ] 4.1 Run frontend typecheck, lint, focused/full tests, and production build locally. Record any failures before archive.
- [ ] 4.2 Manually verify authenticated Supabase mode: create a customer from New Order, continue through the wizard, and confirm the created customer remains persisted after reload.

## Documentation Impact

No durable API/database/setup/deployment documentation change is expected because this change only connects existing frontend and domain capabilities.
