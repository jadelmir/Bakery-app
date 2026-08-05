# Tasks - Add Invoicing, Payments, and Payment Methods (Phase F11 / B6 / B11)

## 1. Database Schema & Security (Backend B6 / B11)

- [x] 1.1 Create SQL migration `Front-end/supabase/migrations/20260729160000_invoices_and_payments.sql` adding `invoices`, `invoice_items`, `invoice_events`, `bakery_payment_methods`, `invoice_payment_methods`, and `payments` tables with integer-cents columns and foreign key constraints.
- [x] 1.2 Enable Row Level Security (RLS) on all private tables scoped to `bakery_memberships` and add public token select policy for `/invoice/:publicToken`.
- [x] 1.3 Add SQL functions/triggers for generating unique invoice numbers per bakery, generating secure `public_token`s, and recalculating balances upon payment insertion.

## 2. Server Functions & Email/PDF (Backend B11)

- [x] 2.1 Build Supabase Edge Function `send-invoice-email` utilizing Resend API to send invoice emails with public links.
- [x] 2.2 Build PDF generation utility for rendering invoice PDFs with bakery branding, items, totals, and payment instructions.

## 3. Domain Ports & Adapter Integration

- [x] 3.1 Update `Front-end/src/app/domain/types.ts` with `DomainInvoice`, `DomainPayment`, `CreateInvoiceInput`, `RecordPaymentInput`, and `InvoicingPort`.
- [x] 3.2 Implement `createInvoice`, `updateInvoice`, `recordPayment`, and `cancelInvoice` in `Front-end/src/app/domain/localAdapter.ts`.
- [x] 3.3 Add unit tests in `Front-end/src/app/domain/localAdapter.test.ts` for invoice total calculations, partial payments, and balance updates.

## 4. React UI Components & Screens (Frontend F11)

- [x] 4.1 Build `PaymentSettings.tsx` for managing Zelle, PayPal, Cash, Check, and Custom payment instructions.
- [x] 4.2 Build `RecordPaymentDialog.tsx` for entering partial or full payment amounts, payment methods, reference numbers, and notes.
- [x] 4.3 Build `InvoiceEditor.tsx` modal for creating and editing invoices from orders or custom line items.
- [x] 4.4 Build `InvoiceList.tsx` view with search, filter tabs (Draft, Sent, Viewed, Partially Paid, Paid, Overdue, Cancelled), and action menus.
- [x] 4.5 Build `PublicInvoiceView.tsx` component mounted at route `/invoice/:publicToken`.
- [x] 4.6 Register `/app/invoices` and `/app/settings/payments` routes in workspace navigation.

## 5. Integrated Verification & Quality Gates

- [x] 5.1 Run TypeScript typecheck (`npm run typecheck`) and Vitest test suite (`npm test`).
- [x] 5.2 Add Playwright E2E journey in `Front-end/e2e/invoicing-and-payments.spec.ts` testing invoice creation, public viewing, payment recording, and balance updates.
- [x] 5.3 Update `openspec/PROGRAM_MAP.md` marking Phase F11 / B6 / B11 as verified.
