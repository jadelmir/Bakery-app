## Purpose

Defines how the working frontend prototype stays traceable to the approved MVP requirements and communicates only the product scope it currently represents.

## ADDED Requirements

### Requirement: Requirement traceability audit
The project SHALL maintain an implementation audit that maps each MVP screen and primary workflow in the product requirements and UI/UX brief to an **implemented**, **partial**, or **not implemented** status, evidence in the frontend, and a planned follow-up phase where needed.

#### Scenario: Reviewing MVP coverage
- **WHEN** a team member reviews the frontend implementation status
- **THEN** they can identify the requirement source, current coverage status, frontend evidence, and planned follow-up for every audited MVP area

#### Scenario: Recording a missing workflow
- **WHEN** an MVP workflow has no usable frontend implementation
- **THEN** the audit records it as not implemented and identifies the phase intended to address it

### Requirement: MVP prototype catalog alignment
The frontend prototype SHALL present sourdough loaf and focaccia as the initial supported products and SHALL not represent out-of-MVP recipes as operationally supported offerings.

#### Scenario: Viewing prototype products
- **WHEN** a user views recipe, order, dashboard, or production content that names a product
- **THEN** the displayed example product belongs to the initial sourdough loaf and focaccia catalog

### Requirement: Canonical lifecycle vocabulary
The frontend prototype SHALL use the canonical order, task, and payment lifecycle vocabulary defined by the product requirements. Scheduling urgency, such as due-now or overdue, SHALL be displayed separately from a lifecycle state when both concepts are present.

#### Scenario: Viewing an order status
- **WHEN** a user views an order in a list, detail view, or dashboard summary
- **THEN** its lifecycle status is displayed as Draft, Confirmed, In Production, Ready, Completed, or Cancelled

#### Scenario: Viewing a production task
- **WHEN** a user views a production task with a time-based urgency
- **THEN** the task lifecycle state and its scheduling urgency are not presented as interchangeable statuses

### Requirement: Prototype scope transparency
The frontend prototype SHALL make local-only confirmation, data, and planning behavior clear and SHALL NOT present persistence, automatic production-plan generation, or backend processing as completed functionality.

#### Scenario: Confirming an example order
- **WHEN** a user completes the add-order flow
- **THEN** the confirmation language identifies the result as a local prototype preview rather than a persisted order or generated production plan

### Requirement: Existing responsive workflows remain available
The frontend prototype SHALL retain its working desktop and mobile navigation and its multi-step add-order journey while Phase 2 content and terminology are aligned.

#### Scenario: Navigating after alignment
- **WHEN** a user selects each primary navigation destination on desktop or mobile
- **THEN** the corresponding existing prototype screen remains reachable

#### Scenario: Completing the add-order journey after alignment
- **WHEN** a user progresses through customer, product, pickup, payment, review, and confirmation steps
- **THEN** the journey remains usable with the aligned MVP examples and prototype-scope messaging
