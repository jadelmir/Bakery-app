# Tasks: Repair Idempotent Bakery Onboarding

- [x] 1.1 Create a new Supabase migration through the repository-pinned CLI;
  do not edit historical migrations.
- [x] 1.2 Restore `private.create_default_bakery(text)` as a locked,
  membership-idempotent onboarding operation and add authenticated public and
  private wrappers for `create_additional_bakery(text)`.
- [x] 1.3 Preserve owner membership atomicity, existing default preference,
  authenticated invoker boundaries, grants, validation, and generated type
  contracts for both operations.
- [x] 2.1 Extend `WorkspaceAdapter` and both adapters with
  `createAdditionalBakery(name)` while keeping `createDefaultBakery(name)` for
  first-time onboarding.
- [x] 2.2 Update the application create handler to call the default operation
  only for an empty membership list and the additional operation otherwise;
  preserve reload, activation, and existing-membership selection behavior.
- [x] 2.3 Update focused workspace and application tests for default retry
  idempotency, existing bakery visibility, and explicit additional creation.
- [x] 3.1 Update the pgTAP workspace test to expect idempotent default
  onboarding and add authenticated assertions for explicit additional
  creation, retained membership, and owner membership count.
- [x] 4.1 Review and extend the seeded-admin and multi-bakery browser journey
  to prove existing bakery visibility, no duplicate default onboarding, and
  explicit additional-bakery activation.
- [x] 5.1 Reset the local database, run all pgTAP tests, database lint,
  security/performance advisors, seed verification, and generated-type drift
  checks. Do not touch linked or production state.
- [x] 5.2 Run focused and full Vitest, typecheck, lint, production build, and
  the affected Playwright journey.
- [x] 5.3 After verification, synchronize the delta into main specs, update
  `openspec/PROGRAM_MAP.md`, and leave archival for a separately requested
  manual-testing workflow.
