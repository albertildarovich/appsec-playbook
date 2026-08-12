# Lessons Learned

> Status: skeleton (Phase 0). To be filled as the project evolves.

## Planned Sections

### LLM
- Structured output validation is a security control, not just a convenience.
- Provider abstraction pays off when swapping models.

### RAG
- Grounding + citations reduce hallucinations but introduce injection surface.
- Permission filtering must happen before content reaches the model.

### Agents
- Tool allowlist + RBAC + approval beats any amount of prompt engineering.
- The agent is only as safe as its least-scoped tool.

### Security
- Prompt injection can't be "solved" by prompting — defense in depth required.
- Redaction must be deterministic and independent of the model.

### Process
- Threat model before code.
- Red-team after every phase, not at the end.

## Related

- [Attack Scenarios](attack-scenarios.md)
- [Implementation](implementation.md)
