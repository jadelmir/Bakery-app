# Tasks: Repair Staging Supabase Schema Drift

- [ ] 1.1 Capture the committed migration version list from `Front-end/supabase/migrations` and the linked staging migration-history list.
- [ ] 1.2 Capture the actual staging `public`/`private` schema objects required by `20260729140126_add_multi_store_workspaces.sql` and downstream migrations.
- [ ] 1.3 Document the exact mismatch: which migration versions are marked applied versus which expected objects are missing.

- [ ] 2.1 Add a new forward-only timestamped repair migration; do not edit historical migration files.
- [ ] 2.2 Guard creation/repair of missing `profiles`, `bakeries`, `bakery_memberships`, and `bakery_invitations` objects without deleting existing data.
- [ ] 2.3 Guard repair of required functions, triggers, indexes, foreign keys, RLS enablement, and policies needed by the current workspace contract.
- [ ] 2.4 Make conflicting existing schema shapes fail with an actionable error instead of silently replacing or truncating data.
- [ ] 2.5 Use Supabase migration-history repair commands only if the captured evidence shows metadata itself must be corrected; record before/after history.

- [ ] 3.1 Run the full migration set against a clean local Supabase database and verify database lint succeeds.
- [ ] 3.2 Apply the repair to linked staging without `db reset` or destructive drops.
- [ ] 3.3 Verify required staging tables remain checked: `profiles`, `bakeries`, `bakery_memberships`, `customers`, `orders`, `order_items`, `recipes`.
- [ ] 3.4 Verify foundational functions/triggers/RLS behavior, including auth-user profile synchronization and bakery membership access.
- [ ] 3.5 Verify a subsequent migration comparison/push is clean and does not attempt to replay historical migrations unexpectedly.
- [ ] 3.6 Verify existing staging customer/order rows, if present before repair, remain intact.

- [ ] 4.1 Rerun the staging deployment and confirm schema verification passes.
- [ ] 4.2 Confirm Edge Functions deploy after the schema gate.
- [ ] 4.3 Record GitHub Actions run IDs/log evidence and update OpenSpec task status only for gates actually proven.
- [ ] 4.4 Do not archive until staging schema, migration history, and runtime smoke checks are all verified.
