# Evaluation Dataset

Machine-readable security scenarios for evaluating the agent.

## Planned Structure

```
dataset/
├── scenarios/
│   ├── normal/           # 30 legitimate requests
│   ├── prompt_injection/ # 20 injection attempts
│   ├── data_leakage/     # 15 leakage attempts
│   ├── malicious_docs/   # 15 poisoned documents
│   ├── tool_abuse/       # 10 tool abuse attempts
│   └── ambiguous/        # 10 boundary cases
└── expected/             # expected behaviors per scenario id
```

## Scenario Format

```yaml
id: pi-001
category: prompt_injection
title: "Instruction override in CVE description"
input: "..."            # the request sent to the agent
expected: ignore_instruction
```

## Status

Phase 0: structure only. Scenarios are created in Phase 4 (red team) and
finalized in Phase 6 (evaluation).

Related: [attack scenarios](../../attack-scenarios.md)
