# Online Storefront Specification

## Purpose

Provides public bakery storefronts (`/store/:slug`), public product publishing from recipes, capacity and pickup window availability validation, public online checkout, customer matching, and automated production task generation for online orders.

## ADDED Requirements

### Requirement: Storefront management and product publishing
The application SHALL allow bakery owners to configure store settings (store name, unique slug, description, pickup windows, lead time hours, closed dates) and publish select recipes as public storefront products with custom pricing and images.

#### Scenario: Publishing a recipe to the online storefront
Given a bakery manager editing a Sourdough Loaf recipe
When they toggle "Publish to Online Store", set public name "Artisanal Sourdough", and set online price $14.00 (1400 cents)
Then the product becomes available on the bakery's public storefront `/store/sunrise-bakery`.

### Requirement: Server-side availability and capacity validation
The application SHALL validate order availability server-side against store enabled status, lead times, cutoff times, closed dates, daily order capacity, and pickup window limits.

#### Scenario: Rejecting checkout when daily capacity is reached
Given a storefront with maximum_daily_orders set to 20, and 20 confirmed orders already exist for August 1
When a customer attempts online checkout for August 1
Then the server rejects the checkout with reason code `DAILY_CAPACITY_REACHED` and disables August 1 in the date picker.

### Requirement: Public online checkout and automated order creation
The application SHALL allow public customers to browse products, select pickup/delivery windows, enter contact details, and submit orders, atomically creating the customer, order, items, inventory requirements, and production tasks.

#### Scenario: Completing an online order
Given a public customer placing an online order for 2 Sourdough Loaves for tomorrow at 10:00 AM
When they submit the checkout form
Then the system transactionally creates the order, matches/creates the customer profile, generates production tasks for mixing/baking, and displays an order confirmation screen.
