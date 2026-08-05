# Design: Organize Project Documentation

## Context

The repository already defines organization policy in
`docs/PROJECT_ORGANIZATION.md`: OpenSpec owns proposed changes, requirements,
design decisions, implementation tasks, and change history, while durable docs
own reusable current-system reference. Orch adds a conservative docs-root
organization model and currently reports three ambiguous root documents plus a
missing categorized database reference.

The OpenSpec configuration currently names
`Bakery_Production_and_Cost_App_PRD_v1.1.md` directly as the product roadmap.
Therefore moving the PRD is not a simple filesystem operation: references must
be updated atomically or the repository's planning context becomes stale.

## Decisions

### 1. OpenSpec authority is preserved

Planning state stays exclusively in this OpenSpec change. Durable docs may
contain current product/technical reference, but MUST NOT contain active-task,
progress, active-change ownership, or archive-readiness claims.

### 2. Classification is content-aware and conservative

Execution MUST inspect a document before moving it. Filename-based categories
are useful hints but are not sufficient authority. Uncertain files remain in
place and are reported.

### 3. Canonical moves are atomic with reference repair

A moved canonical document MUST have repository references updated in the same
implementation pass. In particular, moving the PRD requires updating
`openspec/config.yaml` and any durable docs/OpenSpec files that reference the
old root path.

No duplicate compatibility copy should be left behind because that would create
two canonical-looking documents.

### 4. Governance docs may remain at `docs/` root

`docs/PROJECT_MAP.md`, `docs/PROJECT_ORGANIZATION.md`, and
`docs/AGENT_TOKEN_EFFICIENCY.md` are repository-governance/navigation documents,
not architecture/API/database/product artifacts. They may remain at `docs/`
root unless a stronger repository convention already exists.

### 5. Database reference gets a categorized canonical path

The existing `docs/DATABASE_SCHEMA.md` is the starting database reference. It
should move to `docs/database/` only after verifying it still describes current
implemented/persisted state. Stale assertions should be corrected from actual
migration/schema evidence during execution; product changes are out of scope.

### 6. Existing overlapping docs are audited before consolidation

`docs/API_REQUIREMENTS.md` and `docs/api/api.md` may overlap. Likewise
`docs/ARCHITECTURE.md`, `docs/BACKEND_REQUIREMENTS.md`, and the root technical
requirements may overlap. Execution MUST identify one canonical responsibility
for each durable topic and prefer updating/linking over duplicating content.

This change does not pre-approve deletion or merging of substantial content;
material consolidation requires evidence that the destination preserves the
still-current reusable information.

## Risks

- Moving the PRD without updating OpenSpec config could break planning context.
- Mechanical moves can preserve stale claims and make them look newly canonical.
- Consolidating API/backend/architecture docs without a responsibility audit can
  silently lose useful reference material.
- Old OpenSpec artifacts may intentionally contain historical paths; archived
  changes must remain immutable even if links become historical.

## Verification Strategy

1. Search non-archive repository content for references to every file selected
   for movement.
2. Verify source and destination bytes/content before and after each move; any
   edits must be intentional and reviewable.
3. Validate the updated `openspec/config.yaml` path(s).
4. Check Markdown links/references in current non-archive docs and OpenSpec
   artifacts.
5. Run `orch doctor` and confirm categorized reference warnings are resolved
   where expected.
6. Run `orch organize` and confirm there are no new safe-move violations.
7. Confirm application/source directories have no unrelated changes.

## Return Path

If a file's ownership or canonical destination is ambiguous, stop that move and
leave the source intact. If reference repair cannot be proven complete, revert
that individual move before continuing. Historical archived OpenSpec content is
not rewritten to chase new documentation paths.
