# Fix Add New Customer From Order

## Summary

Repair the New Order customer step so **Add new customer** uses the existing customer-management capability instead of being a dead button.

## Problem

`AddOrderModal` renders an Add new customer action with no click handler. The application already has a reusable `CustomerEditorDialog` and a persisted bakery-scoped customer mutation path, so the missing behavior is an integration gap rather than a backend or schema gap.

## Scope

- Open the existing customer editor from the New Order customer step.
- Persist the customer through the existing bakery-domain `createCustomer` command.
- Use the authoritative returned customer as the selected customer in the order wizard.
- Keep the New Order wizard open after customer creation so the user can continue to Products.
- Surface persistence failures without selecting a fake customer or closing the editor.
- Add focused component coverage for success, failure, and cancel behavior.

## Non-Goals

- No new API, Supabase adapter, RPC, or migration.
- No duplicate customer form.
- No redesign of the Customer Directory.
- No change to order persistence or production-plan generation.
