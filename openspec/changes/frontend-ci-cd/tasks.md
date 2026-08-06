# Tasks: Frontend CI/CD

- [x] 1.1 Select GitHub Pages as the development/staging frontend static host and record that production frontend hosting remains deferred.
- [ ] 1.2 Confirm repository Pages source is set to GitHub Actions and create/confirm the GitHub `development` environment with staging browser-safe Supabase values.
- [x] 2.1 Standardize frontend automation on the package manager declared by `Front-end/package.json` (`pnpm@11.9.0`) with a frozen lockfile.
- [x] 2.2 Refactor CI so frontend and Supabase/database verification are distinct jobs with clear failure ownership.
- [x] 2.3 Make frontend CI run typecheck, lint, unit tests, production build, and bundle-budget validation.
- [x] 2.4 Run the Playwright Chromium desktop project in CI and preserve the Playwright report when the job fails.
- [x] 2.5 Keep PR CI free of production deployment credentials and private server secrets.
- [x] 3.1 Create a real GitHub Pages frontend deployment workflow for `develop` that builds with staging client-safe configuration and publishes `Front-end/dist`.
- [x] 3.2 Add deployment concurrency, Pages deployment URL reporting, root smoke verification, and SPA-fallback verification.
- [x] 3.3 Remove frontend publication responsibility from the existing Supabase staging workflow while preserving migration/Edge Function behavior.
- [x] 3.4 Configure Vite and BrowserRouter for the `/Bakery-app/` Pages base path and add a static `404.html` SPA deep-link fallback.
- [x] 4.1 Remove the placeholder frontend publication step from the production Supabase workflow.
- [x] 4.2 Keep automatic production frontend deployment disabled until a production provider/domain is selected in a future approved change.
- [x] 4.3 Document frontend rollback as revision-based redeployment independent of database rollback.
- [x] 5.1 Add durable frontend CI/CD documentation covering GitHub Pages, branch triggers, browser-safe variables, routing fallback, GitHub setup, and rollback.
- [x] 5.2 Verify the frontend environment example and workflows expose only browser-safe Supabase URL/publishable-key values to Vite.
- [ ] 6.1 Run/observe a PR CI execution and confirm every required frontend quality gate passes.
- [ ] 6.2 After GitHub Pages repository/environment setup, deploy `develop` and manually verify root navigation plus `/Bakery-app/orders` refresh behavior.
- [ ] 6.3 Verify a failed Pages publish/fallback smoke test causes the development frontend deployment job to fail visibly.

## Documentation Impact

`docs/deployment/frontend-ci-cd.md` records the implemented frontend-specific delivery contract. The broader deployment playbook remains authoritative for Supabase/database release governance; production frontend hosting is explicitly deferred rather than represented by a placeholder deployment.
