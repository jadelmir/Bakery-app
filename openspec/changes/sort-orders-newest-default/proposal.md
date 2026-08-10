# Sort Orders Newest First by Default

## Summary

Change the Orders page default presentation so the most recently created orders appear first.

## Problem

The current Orders presentation always sorts filtered orders by pickup date/time ascending. That is useful for fulfillment urgency, but it does not satisfy the common default expectation of seeing the newest orders first. The current frontend `Order` model also does not expose an authoritative creation timestamp, even though persisted orders already have database `created_at` metadata.

## Scope

- Expose an authoritative order creation timestamp through the persisted manual-order read path and UI order model.
- Make Orders default ordering newest-created-first (`createdAt` descending).
- Preserve all current filtering, status tabs, selection, payment, and lifecycle behavior.
- Preserve deterministic ordering when timestamps are equal or unavailable.
- Add focused tests proving the default sort and fallback behavior.

## Non-Goals

- Do not add or alter a database migration solely for this change; the orders table already has `created_at`.
- Do not infer recency from order IDs, pickup dates, or array insertion position when an authoritative timestamp exists.
- Do not change the order lifecycle, pickup urgency calculations, customer flow, payment flow, or production task ordering.
- Do not add a user-facing sort selector in this change unless one already exists and only needs its default changed.

## Acceptance

- Newly created persisted orders appear above older orders by default.
- Filtering by current/completed/status/payment/product/search preserves newest-first ordering within the filtered result.
- Equal or missing creation timestamps produce deterministic stable ordering.
- Pickup urgency labels and order detail behavior remain unchanged.
