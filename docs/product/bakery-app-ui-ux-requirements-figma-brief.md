# Bakery Production & Cost App — UI/UX Requirements

**Version:** 1.0  
**Purpose:** Design specification for a Figma design agent  
**Primary platform:** Mobile-first responsive web app  
**Secondary platforms:** Tablet and desktop  
**Audience:** Home bakers and small bakery operators  

---

## 1. Product Experience Goal

The app should feel like a calm, practical bakery assistant.

When the user opens the app, they should immediately understand:

- What must be done today
- What must be prepared tomorrow
- Which orders are coming up
- How much starter needs to be built
- Which ingredients are insufficient
- Which orders are unpaid
- How much each product costs and earns

The product should not feel like complicated restaurant-management software.

The overall experience should feel:

- Warm
- Clean
- Modern
- Handmade
- Professional
- Calm under pressure
- Easy to use in a kitchen

---

## 2. Core UX Principles

1. The user should see today's work immediately.
2. Creating an order should take less than one minute.
3. Production tasks must be readable from a short distance.
4. Buttons must be large enough to use with busy or flour-covered hands.
5. The user should never manually calculate recipe scaling or starter requirements.
6. The app must explain why each task was generated.
7. Complex scheduling rules should be displayed in plain language.
8. Financial information should be available but should not overpower production tasks.
9. Editing a recipe or flow should warn the user before affecting future orders.
10. Completed orders should preserve their original recipe, price, customer, and production data.
11. Destructive actions should require confirmation.
12. Common actions should require as few taps as possible.

---

## 3. Device Strategy

### Mobile

Mobile is the primary design target.

The mobile experience should prioritize:

- Today's tasks
- Upcoming orders
- Quick order creation
- Task completion
- Timers
- Starter instructions
- Inventory alerts

### Tablet

Tablet layouts should be optimized for kitchen use and production planning.

Use:

- Two-column layouts
- Larger task cards
- Side panels where appropriate
- Split views for timeline and task details

### Desktop

Desktop should support:

- Full production calendar
- Detailed order management
- Recipe editing
- Flow building
- Inventory tables
- Financial reporting

---

## 4. Information Architecture

Primary navigation:

1. Home
2. Orders
3. Production
4. Recipes
5. Inventory
6. Customers
7. Finances
8. Settings

### Mobile Bottom Navigation

Use five items:

- Home
- Orders
- Production
- Recipes
- More

Include a prominent floating or centered action for:

- Add Order

The Add Order action should remain accessible from all major screens.

---

# 5. Visual Style Direction

## 5.1 Overall Style

The interface should combine the warmth of an artisan bakery with the clarity of a modern productivity app.

The visual language should use:

- Warm neutral backgrounds
- Soft surfaces
- Gentle shadows
- Rounded corners
- Clean typography
- Muted bakery-inspired colors
- Strong hierarchy
- Minimal decoration
- Subtle food and bread imagery only where useful

Avoid:

- Rustic chalkboard styling
- Excessive script fonts
- Cartoon bread illustrations
- Heavy gradients
- Overly decorative textures
- Dense enterprise dashboards
- Excessive borders
- Bright saturated colors
- Tiny text
- Large amounts of information in one card

The app should feel closer to a modern calendar, task manager, and small-business tool than a restaurant point-of-sale system.

---

## 5.2 Color Palette

### Primary Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Primary 700 | `#7A3E24` | Main brand color, selected states, strong buttons |
| Primary 600 | `#934E2E` | Primary buttons and interactive elements |
| Primary 500 | `#B4643B` | Hover states, icons, highlights |
| Primary 100 | `#F3DED1` | Soft selected backgrounds |
| Primary 50 | `#FAF1EB` | Very light brand surface |

### Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| Background | `#FBF8F3` | Main application background |
| Surface | `#FFFFFF` | Cards, modals, panels |
| Surface Warm | `#F6F0E8` | Secondary panels and grouped sections |
| Border | `#E5DDD3` | Borders and dividers |
| Border Strong | `#CFC3B5` | Inputs and stronger separators |
| Text Primary | `#2F2925` | Main text |
| Text Secondary | `#6F655E` | Supporting text |
| Text Muted | `#988D84` | Labels and metadata |
| Disabled | `#C8C0B8` | Disabled text and controls |

### Status Colors

| Token | Hex | Usage |
|---|---|---|
| Success | `#3F7A55` | Completed tasks, healthy inventory, paid |
| Success Background | `#E8F3EB` | Success banners and chips |
| Warning | `#B7791F` | Low inventory and upcoming urgency |
| Warning Background | `#FFF4D8` | Warning cards and alerts |
| Danger | `#B8443C` | Overdue, shortages, failed actions |
| Danger Background | `#FCE9E7` | Error and urgent alert surfaces |
| Info | `#4B6F8C` | Informational states |
| Info Background | `#EAF2F8` | Informational banners |

### Production Category Colors

Use colors carefully and consistently.

| Category | Hex | Usage |
|---|---|---|
| Starter | `#A66A3F` | Starter building and feeding tasks |
| Mixing | `#587B75` | Mixing and dough preparation |
| Fermentation | `#7C6AA6` | Bulk and cold fermentation |
| Baking | `#C05A3A` | Preheating and baking |
| Cooling | `#4F7892` | Cooling stages |
| Packaging | `#6E7C4D` | Packaging and fulfillment |

Do not rely on color alone. Always include text labels or icons.

---

## 5.3 Typography

Use a readable sans-serif for all application UI.

### Recommended UI Font

- **Inter**
- Alternative: Geist or Manrope

### Optional Display Font

Use a subtle serif only for branding, large page titles, or recipe names.

- **Fraunces**
- Alternative: DM Serif Display

Do not use the serif font for:

- Task instructions
- Tables
- Forms
- Financial data
- Buttons
- Timers

### Type Scale

| Style | Size | Weight | Usage |
|---|---:|---:|---|
| Display | 32 px | 600 | Desktop page titles |
| Heading 1 | 28 px | 600 | Major mobile titles |
| Heading 2 | 22 px | 600 | Section headings |
| Heading 3 | 18 px | 600 | Card headings |
| Body Large | 17 px | 400 | Important instructions |
| Body | 15–16 px | 400 | Standard content |
| Label | 14 px | 500 | Form labels and metadata |
| Caption | 12–13 px | 400 | Supporting information |
| Button | 15–16 px | 600 | Buttons |

Production task titles and times should remain highly readable.

---

## 5.4 Spacing and Layout

Use an 8-point spacing system.

Suggested spacing tokens:

- 4 px: icon and label spacing
- 8 px: compact internal spacing
- 12 px: controls and smaller card spacing
- 16 px: standard component spacing
- 24 px: section spacing
- 32 px: major content groups
- 48 px: large desktop separation

### Mobile Margins

- 16 px minimum page margin
- 20 px preferred on larger phones

### Desktop Content Width

- Maximum content width: 1440 px
- Dashboard content: 1200–1360 px
- Form content: 720–900 px

---

## 5.5 Corners, Borders, and Shadows

### Corner Radius

| Element | Radius |
|---|---:|
| Buttons | 10 px |
| Inputs | 10 px |
| Cards | 14 px |
| Modals | 18 px |
| Chips | Full pill |
| Mobile bottom sheet | 20 px top corners |

### Borders

Use subtle 1 px borders with `#E5DDD3`.

Avoid using borders around every section. Prefer spacing and surface contrast.

### Shadows

Use minimal shadows.

Suggested card shadow:

```css
box-shadow: 0 2px 10px rgba(47, 41, 37, 0.06);
```

Suggested modal shadow:

```css
box-shadow: 0 20px 50px rgba(47, 41, 37, 0.16);
```

---

## 5.6 Iconography

Use a consistent outline icon set.

Recommended:

- Lucide Icons

Suggested icons:

- Home
- Clipboard list
- Calendar
- Wheat
- Package
- Users
- Dollar sign
- Bell
- Clock
- Check circle
- Alert triangle
- Flame
- Snowflake
- Scale
- Shopping basket

Icons should support labels rather than replace them in important actions.

---

## 5.7 Imagery

Product images are optional.

When used:

- Use natural-light bakery photography
- Use warm neutral backgrounds
- Avoid highly styled stock photography
- Crop consistently
- Use a 4:3 or square ratio for recipe cards

The app must remain fully usable without images.

---

# 6. Core Components

The design system should include:

- Primary button
- Secondary button
- Tertiary text button
- Destructive button
- Icon button
- Floating Add Order button
- Input field
- Search field
- Number input
- Date picker
- Time picker
- Select dropdown
- Combobox
- Checkbox
- Radio group
- Toggle
- Tabs
- Segmented control
- Status chip
- Alert banner
- Empty state
- Skeleton loading state
- Confirmation dialog
- Bottom sheet
- Side panel
- Toast notification
- Task card
- Order card
- Recipe card
- Customer card
- Inventory row
- Metric card
- Timeline item
- Calendar event
- Step editor card

All components should include:

- Default state
- Hover state
- Focus state
- Active state
- Disabled state
- Error state

---

# 7. Home Dashboard

The dashboard should prioritize action over analytics.

## 7.1 Header

Include:

- Greeting or current date
- Notification icon
- Profile access
- Add Order action

Example:

> Tuesday, July 28  
> Good evening, Jad

## 7.2 Today's Tasks

Display tasks in chronological order.

Each task card should include:

- Scheduled time
- Task name
- Product or order
- Quantity
- Short instructions
- Status
- Complete button
- Optional timer action
- Optional delay action

Task statuses:

- Upcoming
- Due now
- Overdue
- Completed
- Skipped

Completed tasks should collapse or become visually quieter.

## 7.3 Upcoming Orders

Show:

- Today
- Tomorrow
- Next seven days

Each card should include:

- Customer
- Products
- Quantity
- Pickup or delivery
- Due date and time
- Production status
- Payment status

## 7.4 Tomorrow's Preparation

Show a readable summary.

Example:

> Tomorrow you need to build 700 g of starter, mix three sourdough batches, and prepare two focaccia trays.

Include a View Plan action.

## 7.5 Alerts

Examples:

- Not enough flour for Friday's orders
- Starter build begins tomorrow at 8:00 AM
- Two orders are awaiting payment
- Focaccia packaging is running low

## 7.6 Summary Metrics

Show compact cards for:

- Revenue this week
- Gross profit
- Orders due
- Products sold
- Unpaid balance

These cards should appear below operational information.

---

# 8. Orders

## 8.1 Order List

Support:

- Search by customer
- Filter by date
- Filter by order status
- Filter by product
- Filter by payment status
- List view
- Calendar view

Order statuses:

- Draft
- Confirmed
- In production
- Ready
- Completed
- Cancelled

## 8.2 Create Order Flow

Use a step-based flow on mobile and a structured form on desktop.

### Step 1: Customer

Allow:

- Search existing customers
- Select recent customer
- Add new customer
- Continue as guest

Show selected:

- Name
- Phone
- Email
- Address

### Step 2: Products

For each item:

- Select product or recipe
- Quantity
- Size or variation
- Customizations
- Selling price
- Item notes

### Step 3: Fulfillment

Fields:

- Pickup or delivery
- Due date
- Due time
- Delivery address
- Order notes

Auto-fill saved customer address for delivery.

### Step 4: Payment

Fields:

- Total
- Deposit
- Remaining balance
- Payment method
- Payment status

Statuses:

- Unpaid
- Partially paid
- Paid
- Refunded

### Step 5: Production Preview

Show:

- Required ingredients
- Starter required
- Tasks to be generated
- Inventory shortages
- Estimated cost
- Estimated profit

Primary action:

- Confirm and Generate Production Plan

---

# 9. Production

## 9.1 Views

Provide:

- Today
- Tomorrow
- Week
- Calendar
- By order
- By product

## 9.2 Daily Timeline

Tasks should be grouped by time.

Example:

### 8:00 AM

**Build combined starter — 700 g needed**

Used for:

- Three sourdough loaves
- Two focaccia trays

Ingredients:

- 100 g retained starter
- 300 g flour
- 300 g water

### 2:00 PM

**Mix sourdough batch**

- Three loaves
- 1,500 g flour
- 1,050 g water
- 30 g salt
- 300 g starter

## 9.3 Task Interactions

Allow:

- Mark complete
- Start timer
- Delay task
- Change scheduled time
- Add notes
- View related order
- View recipe
- View ingredient quantities

When a task is delayed, ask:

> Mixing was delayed by one hour. Move dependent tasks by one hour?

## 9.4 Combined Tasks

Combine compatible tasks:

- Starter builds
- Ingredient preparation
- Packaging preparation
- Oven preheating

Allow manual separation.

---

# 10. Production Flow Builder

## 10.1 Template List

Each card should show:

- Flow name
- Recipes using the flow
- Number of steps
- Total preparation time
- Default or custom status

Default templates:

- Standard Sourdough Loaf
- Standard Focaccia
- Blank Custom Flow

## 10.2 Flow Editor

Use a vertical timeline.

Each step should include:

- Step name
- Relative timing rule
- Duration
- Instructions
- Notification
- Dependency
- Category

Allow:

- Drag to reorder
- Duplicate
- Disable
- Delete
- Add step
- Assign to recipes

## 10.3 Scheduling Controls

Support:

- Days before order
- Hours before order
- Fixed time on relative day
- Time after another step
- Immediately after another step
- Based on bake time
- Based on pickup time

Display readable summaries.

Example:

> Schedule one day before pickup at 8:00 AM.

---

# 11. Recipes

## 11.1 Recipe List

Each card should show:

- Product name
- Optional photo
- Batch yield
- Cost per batch
- Cost per unit
- Selling price
- Assigned production flow
- Active or archived

## 11.2 Recipe Editor

### Basic Information

- Recipe name
- Category
- Batch yield
- Yield unit
- Selling price
- Image

### Ingredients

Each row:

- Ingredient
- Quantity
- Unit
- Calculated cost

Allow:

- Add ingredient
- Reorder ingredient
- Scale batch
- Add optional topping

### Production Flow

Select:

- Standard Sourdough Loaf
- Standard Focaccia
- Saved custom flow
- Create new flow

### Cost Summary

Show:

- Ingredient cost
- Starter cost
- Packaging
- Labor
- Utilities
- Overhead
- Total batch cost
- Cost per unit
- Profit per unit
- Profit margin

---

# 12. Starter Manager

## 12.1 Starter Dashboard

Show:

- Estimated starter available
- Starter required for upcoming orders
- Next feeding
- Expected peak time
- Shortage or surplus

## 12.2 Starter Calculator

Inputs:

- Starter required
- Retained starter desired
- Existing starter
- Feeding ratio
- Desired completion time

Output:

- Existing starter amount
- Flour amount
- Water amount
- Total produced
- Expected peak time

Primary instruction format:

> Mix 20 g starter, 60 g flour, and 60 g water at 8:00 AM.

This instruction should be visually prominent.

---

# 13. Inventory

## 13.1 Inventory List

Each row should show:

- Ingredient
- Current quantity
- Unit
- Cost per unit
- Minimum stock
- Upcoming required quantity
- Remaining after orders

Statuses:

- In stock
- Low
- Insufficient
- Out of stock

## 13.2 Upcoming Requirements

Group by:

- Today
- Tomorrow
- Next seven days

Negative remaining quantities should be clearly emphasized.

## 13.3 Purchase Entry

Fields:

- Ingredient
- Package size
- Package price
- Purchase date
- Quantity purchased
- Store or supplier

---

# 14. Customers

## 14.1 Customer List

Support:

- Search by name
- Search by phone
- Search by email
- Sort by recent order
- Active and archived filters

Each customer card or row should show:

- Name
- Phone
- Email
- Number of orders
- Total spending
- Last order

## 14.2 Customer Profile

Sections:

- Contact information
- Address
- Notes
- Order history
- Outstanding balance
- Frequently ordered products

Actions:

- Create order
- Edit
- Call
- Email
- Open address in maps
- Archive

---

# 15. Finances

## 15.1 Financial Dashboard

Show:

- Revenue
- Product costs
- Gross profit
- Average order value
- Unpaid balances
- Best-selling products
- Most profitable products

Filters:

- Today
- This week
- This month
- Custom range

## 15.2 Pricing Tool

Show:

- Current cost
- Current selling price
- Profit
- Margin
- Suggested price

Allow targets by:

- Profit margin
- Food-cost percentage
- Dollar profit

Use USD formatting.

---

# 16. Notifications

Notification types:

- Production task upcoming
- Production task overdue
- Starter feeding required
- Starter expected to peak
- Inventory shortage
- Order due soon
- Unpaid order reminder

Settings:

- Notification types
- Reminder timing
- Quiet hours
- Push
- Email
- In-app

---

# 17. Accessibility Requirements

Design to WCAG AA standards.

Requirements:

- Minimum 4.5:1 text contrast
- Minimum 3:1 contrast for large text and important UI
- Touch targets at least 44 × 44 px
- Visible keyboard focus states
- Full keyboard navigation on desktop
- Form inputs must have visible labels
- Errors should not rely on color alone
- Icons should include accessible labels
- Motion should respect reduced-motion preferences
- Timers and urgent tasks should use text and icon indicators

---

# 18. Responsive Behavior

## Mobile

- Single-column layout
- Bottom navigation
- Bottom sheets for secondary actions
- Sticky primary actions
- Compact cards
- Horizontal scrolling only for date selectors, not core content

## Tablet

- Two-column dashboard
- Side-by-side task list and task details
- Larger calendar layouts

## Desktop

- Left sidebar navigation
- Multi-column dashboard
- Tables where appropriate
- Right-side detail panels
- Drag-and-drop flow builder
- Full calendar views

---

# 19. Empty States

Create helpful empty states for:

- No orders
- No tasks today
- No recipes
- No customers
- No inventory
- No alerts
- No financial data

Each empty state should:

- Explain what belongs here
- Include one clear action
- Avoid excessive illustration

Example:

> No orders yet  
> Add your first order to generate a production plan automatically.

---

# 20. Loading and Error States

Include:

- Skeleton cards
- Loading indicators
- Retry actions
- Offline or connection-loss state
- Save-in-progress state
- Autosave confirmation
- Form validation
- Partial failure messaging

Do not block the entire interface for small background updates.

---

# 21. Figma File Structure

Create the Figma file with these pages:

1. Cover
2. Foundations
3. Components
4. Mobile Screens
5. Tablet Screens
6. Desktop Screens
7. Prototypes
8. Archive

## Foundations Page

Include:

- Colors
- Typography
- Spacing
- Grid
- Radius
- Shadows
- Iconography
- Status system

## Components Page

Build reusable components with variants and Auto Layout.

Use variables for:

- Color
- Spacing
- Typography
- Radius
- Elevation

---

# 22. Initial Screen Priority

Design in this order:

1. Mobile Home Dashboard
2. Mobile Create Order Flow
3. Mobile Daily Production Timeline
4. Mobile Task Detail
5. Mobile Starter Manager
6. Mobile Recipe List and Editor
7. Mobile Production Flow Builder
8. Mobile Inventory
9. Mobile Customer List and Profile
10. Desktop Dashboard
11. Desktop Production Calendar
12. Desktop Recipe Editor
13. Desktop Flow Builder
14. Desktop Finances

Do not generate every screen at once before establishing the design system and reviewing the first three workflows.

---

# 23. Prototype Requirements

Create clickable prototypes for:

## Flow A: Create an Order

1. Open Add Order
2. Select customer
3. Add product
4. Set pickup date and time
5. Set payment
6. Review production plan
7. Confirm order

## Flow B: Complete Today's Production

1. Open Home
2. View task
3. Open task details
4. Start timer
5. Mark complete
6. View next task

## Flow C: Create a Custom Production Flow

1. Open Recipes
2. Open recipe
3. Select production flow
4. Duplicate template
5. Edit steps
6. Save
7. Assign flow

---

# 24. Deliverables Expected from the Figma Agent

The Figma agent should deliver:

- Design system foundations
- Reusable component library
- Mobile-first screens
- Responsive desktop versions
- Clickable prototypes
- Empty states
- Loading states
- Error states
- Confirmation dialogs
- Interaction annotations
- Developer-ready spacing and sizing
- Consistent naming of frames and components

The design should prioritize operational clarity and speed over decoration.
