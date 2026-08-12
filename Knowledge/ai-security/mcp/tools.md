# MCP Tools

> Status: skeleton (Phase 0). To be completed in later phases.

## Tool Definition Format

MCP tools follow the protocol's tool schema. Example:

```json
{
  "name": "calculate_risk",
  "description": "Compute risk for a vulnerability on an asset",
  "inputSchema": {
    "type": "object",
    "properties": {
      "cve_id": {"type": "string"},
      "asset_id": {"type": "string"}
    },
    "required": ["cve_id", "asset_id"]
  }
}
```

## Tool Inventory

| Tool | Input | Output | Notes |
|---|---|---|---|
| `get_vulnerability` | `vulnerability_id` | Vulnerability finding | Read-only |
| `search_assets` | `query`, `environment?` | List of assets | Read-only |
| `calculate_risk` | `cve_id`, `asset_id` | RiskAssessment | Requires analyst+ |
| `create_ticket` | `title`, `description`, `priority` | Ticket | Requires analyst+, approval for critical |

## Resource List

| Resource URI | Content |
|---|---|
| `vulnerabilities://active` | Active vulnerabilities |
| `assets://{id}` | Asset details |
| `policies://` | Security policies index |
| `playbooks://` | Playbooks index |

## Design Principles

1. **Tools mirror the main agent's tools.** One implementation, two surfaces
   (HTTP API + MCP), so behavior is consistent.
2. **Read-only by default.** Only explicitly listed tools are exposed.
3. **No free-form input.** Every parameter is typed and validated.
4. **Server-side enforcement.** The client only sends JSON-RPC requests;
   all policy is enforced in the server.

## TODO

- [ ] Implement MCP server (Phase 5)
- [ ] Test with a real MCP client (e.g. MCP Inspector)
- [ ] Add RBAC + approval to MCP tool calls
