# Tasks: Frontend CI/CD

- [ ] 1.1 Confirm/select the frontend static hosting provider and record required project/site identifiers without committing credentials.
- [ ] 1.2 Confirm GitHub `staging` and `production` Environments and required production approval policy.
- [ ] 2.1 Standardize frontend automation on the package manager declared by `Front-end/package.json` (`pnpm@11.9.0`) with a frozen lockfile.
- [ ] 2.2 Refactor CI so frontend and Supabase/database verification are distinct jobs with clear failure ownership.
- [ ] 2.3 Make frontend CI run typecheck, lint, unit tests, production build, and bundle-budget validation.
- [ ] 2.4 Add/enable appropriate Playwright smoke/E2E verification and preserve reports/artifacts on failure.
- [ ] 2.5 Keep PR CI free of production deployment credentials and private server secrets.
- [ ] 3.1 Create a real staging frontend deployment workflow for `develop` that builds with staging `VITE_*` configuration and publishes `Front-end/dist`.
- [ ] 3.2 Add staging deployment concurrency and a post-deploy smoke check against the deployed staging URL.
- [ ] 3.3 Remove the placeholder frontend deployment responsibility from the existing Supabase staging workflow while preserving migration/Edge Function behavior.
- [ ] 4.1 Create a real production frontend deployment workflow for `main` using the protected `production` GitHub Environment.
- [ ] 4.2 Add production deployment concurrency, deployment metadata/source SHA reporting, and post-deploy smoke verification.
- [ ] 4.3 Remove the placeholder frontend deployment responsibility from the existing Supabase production workflow while preserving backup/migration/Edge Function behavior.
- [ ] 4.4 Document the frontend rollback procedure as redeploying a last-known-good revision independently of database rollback.
- [ ] 5.1 Update the deployment playbook to match the implemented frontend CI/CD workflow, provider configuration, branch triggers, environment variables, and rollback path.
- [ ] 5.2 Verify no private/server-only secrets use the `VITE_` prefix or enter the browser bundle.
- [ ] 6.1 Run/observe a PR CI execution and confirm every required frontend quality gate passes.
- [ ] 6.2 Deploy to staging and manually verify root navigation plus a safe SPA deep-link route.
- [ ] 6.3 Verify a failed smoke test causes the staging/production frontend deployment job to fail visibly.
- [ ] 6.4 Perform an approved production deployment and verify the deployed revision/URL corresponds to the intended `main` commit.

## Documentation Impact

`docs/deployment/deployment-playbook.md` must be updated during execution because the current document claims automated frontend deployment while the existing workflows only contain placeholder publish commands.
