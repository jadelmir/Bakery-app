# Tasks: Add Customer Directory and Management (Phase F5)

## 1. Domain Ports & Session-Local Adapter

- [x] 1.1 [Domain-Contract Lane: `Front-end/src/app/domain/types.ts`] Define `DomainCustomer`, `CreateCustomerInput`, `UpdateCustomerInput`, and `CustomerPort` interfaces.
- [x] 1.2 [Domain-Contract Lane: `Front-end/src/app/domain/localAdapter.ts`] Implement `createCustomer` and `updateCustomer` in `createSessionLocalBakeryDomainAdapter`.
- [x] 1.3 [Verification Lane: `Front-end/src/app/domain/localAdapter.test.ts`] Add unit tests for customer creation and property updates.

## 2. Customer Management UI Components

- [x] 2.1 [UI Lane: `Front-end/src/app/components/customers/CustomerEditorDialog.tsx`] Build modal editor for creating and editing customer profiles (Name, Email, Phone, Type, Address, Notes).
- [x] 2.2 [UI Lane: `Front-end/src/app/components/customers/CustomerManager.tsx`] Build main Customer Management view with search filter, Wholesale/Retail tab filters, and customer cards.
- [x] 2.3 [Integration Lane: `Front-end/src/app/App.tsx`] Mount `CustomerManager` under the Customers route in `App.tsx`.

## 3. Integrated Verification & Quality Gates

- [x] 3.1 [Verification Lane] Run `npm run typecheck`, `npm run lint`, and `npm run test` from `Front-end`.
- [x] 3.2 [Browser Verification Lane: `Front-end/e2e/customer-management.spec.ts`] Add Playwright E2E journey for creating a customer, filtering by Wholesale/Retail, and editing details.
