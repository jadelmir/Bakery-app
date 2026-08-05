# orders-workflow-clarity Specification

## ADDED Requirements

### Requirement: The Orders page separates active work from completed history

The Orders page SHALL default to a Current view containing confirmed,
in-production, and ready orders, and SHALL provide a separate Completed view
containing completed orders.

#### Scenario: Opening Orders

- **WHEN** a baker opens the Orders page
- **THEN** Current is selected by default
- **AND** completed orders do not appear in the current queue

#### Scenario: Reviewing completed orders

- **WHEN** a baker selects Completed
- **THEN** completed orders appear in pickup-date order with visually quieter
  presentation and no lifecycle action
- **AND** each completed order shows `Fulfilled at <date>` instead of an
  overdue label

#### Scenario: Accessing non-primary statuses

- **WHEN** draft or cancelled records exist
- **THEN** they remain accessible through secondary status filters
- **AND** they are not counted as Current or Completed

### Requirement: The current queue communicates operational priority

The Orders page SHALL summarize current orders by lifecycle stage and SHALL
sort the current queue by pickup urgency and pickup datetime.

#### Scenario: Understanding the queue at a glance

- **GIVEN** current orders exist across confirmed, in-production, and ready
  statuses
- **WHEN** the Orders page renders
- **THEN** it shows a count for each current lifecycle stage
- **AND** each card makes pickup time, customer, status, items, and payment
  attention distinguishable

#### Scenario: Sorting current orders

- **GIVEN** current orders have different pickup datetimes
- **WHEN** the current queue renders
- **THEN** overdue orders appear first
- **AND** remaining orders appear by ascending pickup date and time

#### Scenario: Understanding upcoming pickup timing

- **GIVEN** a current order is due after today
- **WHEN** its card or pickup summary renders
- **THEN** the interface shows `Due tomorrow` or `Due in N days`
- **AND** retains the exact pickup date and time

#### Scenario: Filtering by lifecycle stage

- **WHEN** a baker selects a stage summary
- **THEN** the queue shows only current orders in that stage
- **AND** search and secondary filters continue to apply

### Requirement: Order detail explains status and the next action

The order detail SHALL show the order's lifecycle position, pickup and payment
context, compact production progress, and only the next valid lifecycle action.

#### Scenario: Reviewing a current order

- **WHEN** a baker opens a confirmed, in-production, or ready order
- **THEN** the lifecycle indicator highlights the current stage
- **AND** the detail shows the corresponding next action and its meaning

#### Scenario: Completing an order

- **WHEN** a ready order is successfully marked completed
- **THEN** current counts and the queue update from the authoritative result
- **AND** the order moves from Current to Completed

#### Scenario: Transition failure

- **WHEN** the next-action request fails
- **THEN** the lifecycle and queue retain the prior status
- **AND** the detail shows an actionable retry message

### Requirement: Orders workflow clarity is responsive and accessible

The Orders page SHALL preserve the same information hierarchy and actions on
desktop and mobile and SHALL not rely on color alone to convey status.

#### Scenario: Desktop review

- **WHEN** sufficient viewport width is available
- **THEN** opening detail preserves visible queue context in a master-detail
  arrangement

#### Scenario: Mobile review

- **WHEN** a baker opens order detail on a mobile viewport
- **THEN** detail uses a focused full-width layout
- **AND** the next action remains reachable without obscuring order content

#### Scenario: Assistive navigation

- **WHEN** a baker uses keyboard or screen-reader navigation
- **THEN** primary views, stage filters, urgency, statuses, counts, and actions
  have clear names, selected states, and focus behavior
