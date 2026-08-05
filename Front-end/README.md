# Bakery App Frontend

This folder contains the Figma-generated React/Vite frontend prototype for the Bakery Production, Costing & Order Planning App.

## Current scope

The user-facing prototype now uses Supabase Auth and persistent multi-store
workspace membership. The Supabase development foundation is complete and
verified: dependencies are pinned, the local stack rebuilds from migrations,
generated types are current, local and hosted development migration histories
match, and security/performance advisors are clear. Order, production,
inventory, customer, and reporting fixtures remain local until later domain
phases.

Backend contracts and the verified gap audit are documented in:

- [`../docs/API_REQUIREMENTS.md`](../docs/API_REQUIREMENTS.md)
- [`../docs/BACKEND_REQUIREMENTS.md`](../docs/BACKEND_REQUIREMENTS.md)
- [`../docs/MULTI_AGENT_DELIVERY.md`](../docs/MULTI_AGENT_DELIVERY.md)
- [`guidelines/MULTI_STORE_WORKSPACES.md`](guidelines/MULTI_STORE_WORKSPACES.md)

## Requirements

- Node.js 20 or later
- pnpm 11.9.0 (the supported package manager)
- Docker Desktop or another Docker-compatible runtime for the local Supabase stack

Use pnpm for this project. Do not create an npm lockfile or mix npm installation commands with the pnpm workflow.

## Install and run

```bash
pnpm install
pnpm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## Supabase development

Supabase tooling is pinned in this package. Run commands from `Front-end/`; a
global Supabase CLI is not required.

Copy `.env.example` to `.env.local`, then replace its placeholders with the
project URL and modern publishable key from the Supabase Connect dialog. These
values are browser-visible. Never place a Supabase secret key, service-role
key, database password, personal access token, or third-party private
credential in a Vite variable or committed file.

Start, rebuild, inspect, and stop the local database:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:migrations
pnpm supabase:stop
```

Generate and verify committed database types:

```bash
pnpm supabase:types
pnpm supabase:types:check
```

Create every schema change through the pinned CLI:

```bash
pnpm exec supabase migration new descriptive_change_name
```

Review the generated SQL, rebuild locally, regenerate types, and run the quality
gate before considering a hosted push. Do not use dashboard-only DDL as the
authoritative schema.

For the linked hosted development project, confirm the exact project reference
before running:

```bash
pnpm exec supabase link --project-ref <confirmed-development-project-ref>
pnpm supabase:migrations:linked
pnpm supabase:push:dry-run
pnpm exec supabase db push --linked
```

Never use `supabase db reset --linked` as a normal deployment or recovery step.
If migration application fails, inspect the error and both migration histories
before repairing history or adding a reviewed forward migration. Production
project provisioning and deployment automation remain deferred.

## Verification commands

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run test:e2e
pnpm run build
pnpm supabase:types:check
```

The automated test suite provides a lightweight smoke check for the primary navigation and the accessible Add Order entry point. Playwright provides browser coverage for primary navigation and the five-step Add Order prototype across desktop and mobile viewports. Install its Chromium browser once with `pnpm exec playwright install chromium` before the first end-to-end run.

Codex agents can access the browser through the project-local Playwright MCP configuration in `.codex/config.toml`. After changing it, start a new task so Codex loads the MCP server.

## Generated-project notes

- The Figma export currently keeps the prototype in `src/app/App.tsx`; planned restructuring belongs to a later phase.
- `src/lib/supabase/client.ts` is a dormant typed boundary. Existing screens
  intentionally keep their mock adapters until a later approved phase connects
  them to Supabase.
- `supabase/migrations` is the database source of truth. Machine-local CLI state
  under `supabase/.temp` and `supabase/.branches` is ignored.
- `pnpm-workspace.yaml` allows the required `esbuild` and Tailwind build steps and supports Windows development in addition to the original Linux target.
- If pnpm is run in a non-interactive environment and asks to replace `node_modules`, set `CI=true` for that command before running `pnpm install`.

