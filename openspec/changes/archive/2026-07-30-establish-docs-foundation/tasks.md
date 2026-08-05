# Tasks: Establish Documentation Foundation

## WS-1: New Docs + api.md Rename

- [x] 1.1 Create `docs/project-map.md` — repo navigation map (74 lines)
- [x] 1.2 Create `docs/architecture.md` — stable technical decisions (49 lines)
- [x] 1.3 Create `docs/database.md` — table inventory and relationships (68 lines)
- [x] 1.4 Create `docs/api.md` (verbatim copy of API_DOCUMENTATION.md with canonical header, 365 lines)

## WS-2: Renames + Cross-Reference Fixes

- [x] 2.1 Create `docs/agent-token-efficiency.md` (verbatim copy of AI_AGENT_TOKEN_EFFICIENCY.md with canonical header)
- [x] 2.2 Create `docs/project-organization.md` (verbatim copy of PROJECT_ORGANIZATION_STANDARD.md with canonical header)
- [x] 2.3 Update `AGENTS.md` — fixed all three doc cross-references; added project-map.md reference
- [x] 2.4 Verify no remaining stale references — found 2 in external files, fixed by orchestrator

## Orchestrator Integration

- [x] Fix `Bakery_App_Technical_Requirements.md:L35` — `API_DOCUMENTATION.md` → `api.md`
- [x] Fix `Front-end/README.md:L17` — `API_DOCUMENTATION.md` → `api.md`

## Verification

- [x] V.1 All six canonical paths exist under `docs/`
- [x] V.2 No remaining `.md` references to old filenames (outside archives and the originals themselves)
- [x] V.3 `npm run typecheck` — ✅ zero errors
- [x] V.4 `npm test` — ✅ 129/129 tests pass
