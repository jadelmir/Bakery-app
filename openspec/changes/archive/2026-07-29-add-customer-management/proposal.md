# Change Proposal: Add Customer Directory and Management (Phase F5)

## Why

Bakery operations require managing customer profiles for both wholesale and retail clients. Previously, customer data was static mock data in `App.tsx`. Implementing Phase F5 provides a reactive customer directory, customer creation/editing, type tagging (Wholesale vs Retail), contact notes, and domain port integration with local storage persistence.

## What Changes

- **Domain Model & Ports**:
  - Define `DomainCustomer`, `CreateCustomerInput`, `UpdateCustomerInput`, and `CustomerPort` interfaces in `Front-end/src/app/domain/types.ts`.
  - Update `BakeryDomainSnapshot` and `BakeryDomainAdapter` to include customer collections and methods.
- **Session-Local Adapter**:
  - Implement `createCustomer` and `updateCustomer` in `Front-end/src/app/domain/localAdapter.ts`.
- **UI Components**:
  - Build `CustomerEditorDialog.tsx` for adding and editing customer details (Name, Email, Phone, Type: Wholesale/Retail, Address, Notes).
  - Build `CustomerManager.tsx` view featuring search, wholesale/retail filter tabs, customer profile cards with stats, and edit dialog trigger.
- **Integration**:
  - Mount `CustomerManager` under the Customers screen navigation route in `App.tsx`.
  - Add Playwright E2E journey for customer creation and directory filtering.

## Impacted Specs

- `customer-management`: ADDED capability covering customer directory management, wholesale/retail categorization, and profile editing.
