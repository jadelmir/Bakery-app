# Design: Clarify Orders Workflow UI

## Current-State Findings

- The page defaults to an undifferentiated `All Orders` list, so completed
  records compete with work still requiring attention.
- Filters mix workflow state (`In Production`) and payment state (`Unpaid`)
  without showing how they relate.
- Cards give status, money, customer, items, and pickup similar visual weight;
  pickup urgency and the next operational step are not dominant.
- Selecting an order replaces the entire list, removing queue context.
- The full production plan is visually heavy in order detail even when the
  baker primarily needs status, pickup, payment, and the next action.

## Information Architecture

### Orders overview

1. Header: `Orders`, current-order count, and `New Order`.
2. Primary segmented control: `Current` and `Completed`, each with a count.
3. Current workflow summary: `Confirmed`, `In Production`, and `Ready for
   Pickup`; selecting a stage filters the current queue.
4. Search and secondary filters for pickup date, payment state, product, draft,
   and cancelled records.
5. Pickup-first queue, sorted overdue first and then ascending pickup datetime.

### Order card hierarchy

1. Current orders show pickup date/time and an urgency label (`Overdue`,
   `Today`, `Due tomorrow`, or `Due in N days`). Completed orders instead show
   `Fulfilled at <date>` and never display overdue treatment. The recorded
   pickup time remains visible.
2. Customer and concise item summary.
3. Plain-language order status.
4. Payment state, with balance due emphasized only when action is required.
5. Clear affordance to open details; lifecycle mutation remains in detail to
   reduce accidental updates and card clutter.

### Order detail hierarchy

1. Customer, order number, pickup deadline, and status.
2. Four-step lifecycle indicator:
   `Confirmed -> In Production -> Ready -> Completed`.
3. One sticky primary action matching the next valid transition, plus a short
   explanation of what that action means.
4. Pickup and payment summary cards.
5. Items and notes.
6. Production progress summary such as `4 of 7 tasks complete` and the next
   pending task; full task history is collapsible.

## Responsive Behavior

- Desktop uses a master-detail layout when space allows: the queue remains
  visible while detail opens in a right panel.
- Mobile uses a full-width queue and a dedicated detail view with a sticky
  bottom action.
- Controls wrap or scroll without hiding Current/Completed selection.

## Visual Language

- Use color as reinforcement, never as the only status signal.
- Use one dominant accent for the next action; reserve red for overdue or
  unpaid attention and green for ready/completed success.
- Reduce completed-card contrast so history remains readable but visually
  quieter than current work.
- Keep stage names, counts, labels, and icons consistent across summary,
  cards, and detail.

## Behavioral Decisions

1. Current means `confirmed`, `in-production`, or `ready`.
2. Completed means only `completed`; cancelled is not mislabeled as completed.
3. Draft and cancelled records remain discoverable through secondary status
   filters.
4. Current sorting is overdue first, then pickup date, then pickup time.
5. Search narrows the selected primary view and preserves its sorting.
6. A successful transition refreshes counts, the selected card, and its
   placement. Completion moves the order to Completed immediately after the
   authoritative result.
7. Existing transition pending/error behavior remains visible beside the
   primary action.

## Risks and Mitigations

- A dashboard-like header could become noisy. Limit the workflow summary to
  three actionable current stages and one count per stage.
- Inline actions could cause accidental changes. Keep lifecycle changes in
  the detail surface.
- Desktop master-detail and mobile full-screen detail could drift. Build them
  from shared presentation components and test the same state transitions in
  both viewports.
- Active order changes share implementation files. Serialize this change after
  their manual acceptance or explicitly transfer ownership before execution.
