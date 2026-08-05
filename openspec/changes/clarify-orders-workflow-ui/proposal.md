# Clarify Orders Workflow UI

## Problem

The Orders page presents all orders in one flat list with only broad filters.
Status, pickup urgency, payment state, customer, items, and production details
compete for attention, so a baker cannot quickly answer what is current, what
needs action next, or what has already been completed.

## Goal

Make the Orders page an operational queue that communicates, at a glance:

- which orders are current versus completed;
- which current orders are confirmed, in production, or ready for pickup;
- which pickup is due next or overdue;
- which orders still have a balance due; and
- what the next valid action is for a selected order.

## Program Traceability

- Frontend roadmap phase: F6 Orders and Payments.
- Owning capability: `orders-workflow-clarity`.
- Prerequisites: `manual-order-persistence` and
  `order-status-transitions`.
- This work must be serialized after the active order changes because they
  share `OrdersScreen.tsx`, `BakeryWorkspace.tsx`, and order-flow tests.

## Scope

- Replace the flat default list with a Current/Completed primary view.
- Default to Current and sort current orders by pickup date and time, with
  overdue orders first.
- Add a compact workflow summary for Confirmed, In Production, and Ready.
- Redesign order cards around pickup urgency, current status, customer/items,
  and payment attention.
- Redesign order detail around a visible lifecycle, one clear next action,
  payment/pickup context, and a compact production-progress summary.
- Preserve access to draft and cancelled records through secondary filters
  without treating them as current or completed.
- Provide responsive desktop and mobile behavior and accessible status cues.

## Non-Goals

- Do not change order statuses, transition rules, persistence, RLS, task
  generation, payment behavior, cancellation behavior, or public checkout.
- Do not add a calendar view in this change.
- Do not add drag-and-drop status changes or automatic task-driven status
  transitions.
- Do not redesign the Home or Production pages.

## Acceptance Evidence

- Current is selected by default and contains only confirmed, in-production,
  and ready orders.
- Completed orders appear under Completed and no longer compete with active
  work.
- Current orders are ordered by pickup urgency and pickup datetime.
- Stage counts and card hierarchy let a baker identify the next pickup,
  production state, and unpaid balance without opening every order.
- The detail view explains the lifecycle position and exposes only the next
  valid action.
- Completing an order removes it from Current and places it in Completed.
- Desktop and mobile browser journeys remain usable with keyboard and screen
  reader labels.
