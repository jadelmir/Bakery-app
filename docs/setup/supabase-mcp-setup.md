# Supabase MCP Setup

## Codex registration

The Supabase MCP server is registered in the user's global Codex configuration:

```text
C:\Users\Jad\.codex\config.toml
```

The registration appears under:

```toml
[mcp_servers.supabase]
url = "https://mcp.supabase.com/mcp?project_ref=strwmmcpewxkigsofsda&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
```

This connection is scoped to Supabase project:

```text
strwmmcpewxkigsofsda
```

Enabled MCP feature groups:

- Documentation
- Account
- Database
- Debugging
- Development
- Functions
- Branching

Authentication uses Supabase OAuth. Codex manages the OAuth credentials outside
this project; no access token or secret is stored in this file.

## Verification

Check the registered server:

```powershell
codex mcp get supabase
```

List all configured MCP servers:

```powershell
codex mcp list
```

The expected status is `enabled`, with `OAuth` authentication.

If authentication expires, run:

```powershell
codex mcp login supabase
```

Start a new Codex task after adding or authenticating the server so its tools are
loaded into the new session.

## Installed Supabase skills

The optional agent skills are installed locally for this BakeryApp workspace:

```text
C:\Users\Jad\Desktop\BakeryApp\.agents\skills\supabase
C:\Users\Jad\Desktop\BakeryApp\.agents\skills\supabase-postgres-best-practices
```

These skills provide Supabase workflow guidance and PostgreSQL best practices.

## Removal

To remove the global Supabase MCP registration:

```powershell
codex mcp remove supabase
```
