# Tool Calling

> Status: skeleton (Phase 0). To be completed in later phases.

## What Is Tool Calling?

Tool calling (function calling) lets the LLM request the execution of a **predefined
function** instead of just producing text:

```text
LLM
 ↓
"call tool: get_asset(asset_id='prod-web-17')"
 ↓
Tool layer validates + executes
 ↓
result returned to the LLM
 ↓
LLM continues with the result
```

## The Critical Distinction

> **AI assistant** — can only generate text. `ai assistant`
> **AI agent** — can request tool execution. `ai agent with controlled boundaries`

An agent is only as safe as its tool boundary. The LLM should never:

- execute arbitrary shell commands
- make arbitrary HTTP requests
- access the filesystem
- delete or modify infrastructure

Instead, expose a **small, typed allowlist**:

```python
get_cve(cve_id: str) -> CVEData
get_asset(asset_id: str) -> Asset
search_knowledge(query: str, top_k: int) -> list[Document]
calculate_risk(cve_id: str, asset_id: str) -> RiskAssessment
create_ticket(title: str, priority: str, ...) -> Ticket
```

## Agent Loop (secure variant)

```
1. User request
2. LLM decides: answer directly OR emit tool call(s)
3. Tool layer validates the call against the schema
4. Policy layer checks RBAC (can this user call this tool?)
5. High-risk tool? → request human approval
6. Execute tool, log everything
7. Return result to LLM
8. Repeat until the task completes
```

## Failure Modes

| Failure | Description | Control |
|---|---|---|
| Tool call injection | Prompt tells the model to call a dangerous tool | Allowlist, RBAC, approval |
| Parameter smuggling | Model fills fields with malicious values | Pydantic validation, enum/format checks |
| Tool loop | Agent retries a failing tool endlessly | Max-turns cap, budget limits |
| Hallucinated tools | Model invents a tool name | Strict registry lookup, 404 on unknown |
| Tool misuse | Model calls a benign tool for malicious purpose | Audit logs, behavior detection |

## TODO

- [ ] Implement the tool registry with strict schemas (Phase 3)
- [ ] Add RBAC checks in the tool layer (Phase 4)
- [ ] Add human approval workflow (Phase 4)
- [ ] Document max-turns and budget limits
