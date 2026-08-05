# Bakery App — Project Map

## Repository Root
- `AGENTS.md`: Defines repository-wide agent guidelines, multi-agent delivery protocols, shared workspace safety rules, and verification standards.
- `README.md`: Provides the main project summary, local environment setup instructions, and quick-start scripts.
- `Bakery_App_Technical_Requirements.md`: Outlines core technical architecture, performance targets, and system requirements.
- `Bakery_App_UI_UX_Requirements_Figma_Brief.md`: Details visual design specifications, component design tokens, and Figma mock references.
- `Bakery_Production_and_Cost_App_PRD_v1.1.md`: Serves as the primary Product Requirements Document defining business goals, user personas, and domain workflows.
- `orchestration/`: Houses Bakery-specific multi-agent delivery profile configurations and orchestration scripts.
- `packages/`: Contains reusable generic libraries including the multi-agent delivery package framework.

## Front-end Application (Front-end/)
- `package.json` / `vite.config.ts`: Configures dependencies, scripts, build options, and Vite dev server parameters for the React application.

### Source (src/app/)
- `App.tsx`: Main application entry point managing authentication state, session routing, workspace selection, and shell layout.
- `BakeryWorkspace.tsx`: Top-level workspace container orchestrating provider context, sidebar navigation, screen routing, and modal dialogs.
- `AuthProvider.tsx` / `auth.ts`: Provides Supabase authentication state management, user login, signup, session restoration, and password handlers.
- `workspace.ts`: Manages multi-bakery workspace creation, membership loading, active store selection, and invitation consumption adapters.
- `planning.ts`: Contains domain logic for ingredient requirement calculations, sourdough starter builds, and inventory deduction rules.
- `production.ts`: Defines production flow templates, task status constants, and flow step timing structures.
- `reporting.ts`: Provides financial aggregation functions for gross sales, manual expenses, and cost metrics.
- `types.ts` / `constants.ts`: Contains shared TypeScript interface definitions, mock data fixtures, and initial workspace constants.
- `screens/`: Contains top-level feature screens including Home, Orders, Production, Inventory, Starter, Finances, Settings, and More.
- `navigation/`: Provides layout navigation controls including Sidebar, BottomNav, FAB, and dirty form guard context.
- `domain/`: Contains domain data adapters supporting both local in-memory mock storage and Supabase network integration.
- `state/`: Implements React Context state providers, custom hooks, action reducers, and selectors for bakery domain state.

### Components (src/app/components/)
- `orders/`: Components for creating, displaying, and managing customer orders and order modal forms.
- `production/`: Components for rendering production task cards, daily schedules, timer controls, and execution lists.
- `inventory/`: Components for ingredient adjustments, restocking modals, package unit conversions, and shopping list drawers.
- `recipes/`: Components for recipe creation, ingredient costing breakdowns, and recipe list management.
- `customers/`: Components for customer directory management, contact profiles, notes, and order history tracking.
- `invoicing/`: Components for invoice generation, payment method settings, payment processing, status badges, and public customer invoice views.
- `storefront/`: Components for online storefront configuration, product catalog publishing, pickup windows, and customer cart views.
- `shared/`: Reusable basic UI components such as status chips, modal dialog wrappers, section headers, and form inputs.
- `ui/`: Generic baseline UI components and icon bindings.
- `application-state/`: Development utilities for inspecting and managing app-wide application state and local debug tooling.

### E2E Tests (e2e/)
- `app.spec.ts`: Core application layout, navigation smoke tests, and basic UI interaction specs.
- `authentication-and-account.spec.ts`: End-to-end specs for user authentication, login, signup, and profile editing.
- `customer-management.spec.ts`: Playwright tests for creating, searching, editing, and archiving customer profiles.
- `ingredients-and-stock-entry.spec.ts`: End-to-end specs for adding ingredients, recording purchases, and adjusting inventory levels.
- `invoicing-and-payments.spec.ts`: Playwright specs for generating invoices, recording payments, status changes, and voiding.
- `online-storefront.spec.ts`: Playwright tests for public storefront catalog browsing and order placement flows.
- `production-workspace.spec.ts`: End-to-end specs for production task generation, task completion, rescheduling, and daily task views.
- `recipe-management.spec.ts`: Specs for creating recipes, assigning ingredients, calculating recipe costs, and production flows.
- `shared-application-foundation.spec.ts`: Base infrastructure and common page state test suites.

### Supabase (supabase/)
- `migrations/`: Versioned SQL migration files defining PostgreSQL tables, constraints, RLS policies, indexes, and RPC functions.

## Documentation (docs/)
- `BACKEND_REQUIREMENTS.md`: Comprehensive backend specification detailing database models, RLS rules, Edge Functions, and API contracts.
- `DEPLOYMENT_PLAYBOOK.md`: Specifies 3-tier environment architecture, secret isolation rules, migration governance, and CI/CD pipelines.
- `API_DOCUMENTATION.md` / `api.md`: Canonical API documentation covering Supabase Data API, Auth, Storage, and Edge Functions.
- `AI_AGENT_TOKEN_EFFICIENCY.md`: Operational guidelines and rules for token efficiency and context optimization during agent execution.
- `PROJECT_ORGANIZATION_STANDARD.md`: Standards for file organization, directory layout, naming conventions, and documentation placement.
- `MULTI_AGENT_DELIVERY.md`: Protocol specifying roles, responsibilities, task boundaries, and delivery workflows for multi-agent execution.

## OpenSpec (openspec/)
- `PROGRAM_MAP.md`: Master registry tracking active, completed, and archived OpenSpec changes and specification history.
- `config.yaml`: Configuration settings for OpenSpec change tracking and schema validation.
- `changes/`: Active feature proposals, designs, delta specifications, and task lists currently under development.
- `specs/`: Archived canonical specification documents representing implemented system capabilities.

## Agent Skills (.agents/skills/)
- `orch/`: Multi-agent execution skills for change delivery and automated task execution.
- `orch-plan/`: Planning skills for generating OpenSpec implementation plans and task breakdowns without code modification.
- `orch-archive/`: Archival skills for finalizing completed OpenSpec changes and updating main specs.
- `supabase/` / `supabase-postgres-best-practices/`: Domain skills providing guidelines and reference patterns for Supabase Postgres, RLS, and CLI workflows.
