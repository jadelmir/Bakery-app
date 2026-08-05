## Context

The React application currently renders its entire workspace from one `App` entry component and keeps domain data in component memory. It has no router-level or component-level authentication boundary. The existing Vitest, Testing Library, and Playwright setup can cover the new entry journey. See `proposal.md` for motivation and the frontend authentication shell spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Introduce a replaceable authentication boundary without coupling UI components to Supabase.
- Keep the first implementation small enough to verify independently.
- Preserve the existing workspace and navigation after a mock session starts.
- Make login, signup, failure, loading, and logout states testable.

**Non-Goals:**

- Persisting a session across page refreshes.
- Creating real users, sending verification email, resetting passwords, or storing credentials.
- Protecting data at a server or database boundary.
- Moving existing bakery domain state into persistence.

## Decisions

### Put authentication behind a small adapter contract

Define a frontend authentication contract for login, signup, and logout results, then provide an in-memory mock implementation for this change. Components consume the contract rather than importing a future provider SDK.

This keeps the screen behavior stable when Supabase is introduced. Directly embedding fake logic in form components would make the backend phase replace presentation code, while adding Supabase now would violate the frontend-first boundary.

### Use a top-level session boundary

Split the current workspace rendering from the application entry. The entry owns authentication mode and session state, rendering either the authentication experience or the bakery workspace, never both.

This is simpler and safer than adding checks to every screen. It also creates one replacement point for Supabase session restoration later.

### Keep the mock session memory-only

The mock adapter returns a minimal session identity for accepted submissions, and the frontend stores it only in React state. Refreshing the page returns to login.

Using local storage could make the prototype appear secure or persistent when it is neither. Real persistence belongs to the Supabase session phase.

### Keep login/signup navigation local to the auth shell

Use an explicit login/signup mode inside the authentication experience instead of restructuring the existing state-based navigation around URL routes. Provider callbacks and dedicated recovery routes will be designed with the backend integration.

Introducing a full application router in this small phase would broaden regression risk without being required for the current behavior.

### Share validation rules at the form boundary

Keep email and password validation in reusable frontend helpers and map errors to their fields. The mock adapter owns only request outcomes, not validation.

This allows unit tests to cover validation deterministically and lets the later backend phase translate provider errors without weakening client feedback.

## Risks / Trade-offs

- [The mock flow can be mistaken for real security] → Keep sessions memory-only and document the frontend-only boundary in code-facing documentation and tests.
- [The future provider may use different password rules] → Keep the initial rule minimal and centralize it so the Supabase phase can align it in one place.
- [Splitting the large application entry may cause regressions] → Extract the workspace with minimal internal changes and run existing unit, build, and desktop/mobile smoke coverage.
- [Local auth navigation does not provide shareable URLs] → Accept this for the frontend shell and introduce callback/recovery routes when provider behavior requires them.

## Migration Plan

Add the adapter and validation boundary, build the authentication screens, wrap the existing workspace, add logout, then verify the full quality suite. Rollback removes the new boundary and restores the existing workspace as the direct application export; no user or database migration is involved.
