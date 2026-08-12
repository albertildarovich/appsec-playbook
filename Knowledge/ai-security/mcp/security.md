# MCP Security Model

> Status: skeleton (Phase 0). To be completed in later phases.

## Problem

Exposing security data and tools through MCP means an AI assistant (possibly a third-party
client like Claude Desktop) can now trigger actions. Without a security model, this is
just a remote-control API for attacks.

## Principles

1. **The client is untrusted.** The MCP server enforces everything server-side.
2. **Tools, not prompts.** The client can call defined tools; it cannot "ask" the server
   to do something else.
3. **Default deny.** Unknown tools, unknown parameters, unknown roles → rejected.
4. **Everything is logged.** Every JSON-RPC method call is an audit event.

## Security Controls

| Control | Implementation |
|---|---|
| Authentication | Bearer token / API key per client session |
| Authorization | User role bound to the session; RBAC per tool |
| Input validation | Strict JSON schema on every tool call |
| Rate limiting | Per-session and per-user limits |
| Secret redaction | Outputs scanned for secrets before returning |
| Audit logging | Full JSON audit trail of all calls |
| Approval | High-risk tools require a human approval flow |
| No code execution | The server never exposes shell/HTTP/freeform tools |

## Threat Mapping

| Threat | Control |
|---|---|
| Malicious client calls dangerous tool | RBAC + approval |
| Client forges parameters | Schema validation |
| Client bypasses prompt-injection protection | Protection is server-side, not prompt-side |
| Client exfiltrates sensitive resources | Permission-filtered resources, redaction |
| Credential theft from the client | Scoped credentials, no secrets in tool output |

## Config Sketch

```yaml
mcp:
  auth:
    token_env: MCP_AUTH_TOKEN
  tools:
    get_vulnerability: { roles: [viewer, analyst, engineer, admin] }
    calculate_risk:     { roles: [analyst, engineer, admin] }
    create_ticket:      { roles: [analyst, engineer, admin], approval: critical }
  rate_limit:
    calls_per_minute: 60
```

## TODO

- [ ] Implement auth + RBAC in the MCP server (Phase 5)
- [ ] Add approval flow for `create_ticket` via MCP
- [ ] Write MCP-specific red-team tests
- [ ] Document deployment (network isolation, egress control)
