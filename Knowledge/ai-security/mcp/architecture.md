# MCP Architecture — Model Context Protocol

> Status: skeleton (Phase 0). To be completed in later phases.

## What Is MCP?

The **Model Context Protocol** is an open protocol that standardizes how LLM applications
(hosts/clients) discover and use external data and tools. An MCP server exposes:

- **Resources** — structured data (files, records, policies)
- **Tools** — callable functions the model can invoke
- **Prompts** — reusable prompt templates

The protocol is a good fit for exposing security data to AI assistants in a
standardized, controlled way.

## Architecture

```text
Claude / ChatGPT / other MCP client
                ↓
          MCP Security Server
                ↓
        ┌───────┼────────┐
        ↓       ↓        ↓
       CVE     Assets   Jira
```

## MCP Security Server — Scope

| Component | Content |
|---|---|
| Resources | `vulnerabilities://` assets, `policies://` security policies, `playbooks://` playbooks |
| Tools | `get_vulnerability`, `search_assets`, `calculate_risk`, `create_ticket` |
| Auth model | Server-side auth (bearer token), user role per session |

## Why MCP for This Project

1. **Interoperability** — the same security tools can be used from any MCP client
   (Claude Desktop, VS Code, custom hosts).
2. **Standard security boundaries** — tools, not raw prompts; the client cannot
   bypass the server's controls.
3. **Clean demo** — a great interview story: "the security platform is exposed to AI
   assistants through a standard protocol with a documented security model."

## Security Model (summary)

- The MCP server enforces the same RBAC as the main agent.
- Every tool call is validated, authorized and audit-logged server-side.
- No tools that execute arbitrary code or raw HTTP.
- Sensitive resources are permission-filtered.
- See [Security Model](security.md) for details.

## Related

- [Tools](tools.md)
- [Security](security.md)
- [Agent Architecture](../agents/architecture.md)
