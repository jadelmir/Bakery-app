# Design Document: Customer Directory and Management (Phase F5)

## Overview

This document outlines the technical design for Phase F5 **Customer Directory & Management**.

## Data Architecture

```typescript
export type CustomerType = "wholesale" | "retail";

export interface DomainCustomer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly type: CustomerType;
  readonly address?: string;
  readonly notes?: string;
  readonly totalOrders?: number;
  readonly totalSpent?: number;
}
```

## Workstream Boundaries

1. **Workstream 1 (Domain & Adapter Lane)**:
   - Files: `Front-end/src/app/domain/types.ts`, `Front-end/src/app/domain/localAdapter.ts`, `Front-end/src/app/domain/localAdapter.test.ts`.
   - Responsibilities: Domain input interfaces, adapter methods (`createCustomer`, `updateCustomer`), Vitest unit test suite.

2. **Workstream 2 (UI Components Lane)**:
   - Files: `Front-end/src/app/components/customers/CustomerEditorDialog.tsx`, `Front-end/src/app/components/customers/CustomerManager.tsx`.
   - Responsibilities: Modal editor dialog, main Customer Manager grid/table view with search and Wholesale/Retail filter tabs.

3. **Workstream 3 (Integration & E2E Lane)**:
   - Files: `Front-end/src/app/App.tsx`, `Front-end/e2e/customer-management.spec.ts`.
   - Responsibilities: App.tsx route mounting, Playwright E2E browser tests.
