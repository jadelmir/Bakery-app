## 1. Reproducible project setup

- [x] 1.1 Inspect the Figma-generated frontend manifest and select pnpm as the documented package manager.
- [x] 1.2 Install the declared frontend dependencies and commit the generated pnpm lockfile.
- [x] 1.3 Update package-manager metadata so installation does not rely on the broken global npm launcher.
- [x] 1.4 Verify a clean install completes using the documented pnpm command.

## 2. Quality gates

- [x] 2.1 Add TypeScript configuration and a `typecheck` script appropriate for the React/Vite project.
- [x] 2.2 Add linting configuration and a `lint` script with a focused baseline suitable for generated code.
- [x] 2.3 Add a test runner and a `test` script for frontend smoke coverage.
- [x] 2.4 Confirm the production `build`, `typecheck`, `lint`, and `test` commands each return actionable results.

## 3. Browser smoke verification

- [x] 3.1 Start the frontend locally and verify that the Home, Orders, Production, Recipes, Inventory, Customers, Finances, and Settings screens load at a desktop viewport.
- [x] 3.2 Verify sidebar navigation reaches every currently implemented desktop screen without browser runtime errors.
- [x] 3.3 Verify mobile bottom navigation and the floating Add Order action at a mobile viewport.
- [x] 3.4 Verify the existing Add Order prototype can select a customer, add products, enter pickup and payment details, review, and close successfully.
- [x] 3.5 Correct only runtime-blocking frontend defects discovered during verification, preserving the existing visual design and mock-data behavior.

## 4. Documentation and handoff

- [x] 4.1 Update the frontend README with pnpm installation, development, build, type-check, lint, test, and smoke-verification commands.
- [x] 4.2 Document that the frontend remains a Figma-generated mock-data prototype with no backend persistence in this phase.
- [x] 4.3 Record the Phase 1 verification results and any environment constraints for the later frontend-restructuring change.
