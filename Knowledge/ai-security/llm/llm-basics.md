# LLM Basics for Security Engineers

> Status: skeleton (Phase 0). To be completed in later phases.

## What Is an LLM?

A Large Language Model is a neural network trained on large corpora of text to predict
the next token given a sequence of tokens. From a security engineer's perspective, three
properties matter:

1. **Stateless inference** — each call is independent; the model has no persistent memory.
2. **Non-deterministic output** — the same prompt can produce different outputs.
3. **Grounding gap** — the model "knows" only what was in its training data and may be
   outdated, wrong or hallucinated.

## Why This Matters for Security

- Model output is **untrusted** and must be validated before it is used.
- The model has **no concept of permission** — access control must be enforced externally.
- The model **cannot be a source of truth** — that is what the RAG knowledge base is for.
- The model is **susceptible to manipulation** via prompt injection.

## Core Concepts

| Concept | Definition | Security implication |
|---|---|---|
| Token | Basic unit of text processing | Cost, rate limits |
| Context window | Max tokens per request | Longer context = higher injection surface |
| Temperature | Output randomness | Low temp for deterministic security output |
| System prompt | Instruction block (privileged) | Must be protected from overrides |
| User prompt | Input block (untrusted) | Source of prompt injection |
| Tool calling | Model emits structured calls | Must be validated before execution |
| Structured output | Model returns JSON per schema | Reduces parsing errors, enables validation |

## Recommended Reading Path

1. [Prompting](prompting.md)
2. [Structured Output](structured-output.md)
3. [Tool Calling](tool-calling.md)

## TODO

- [ ] Add practical examples (good/bad prompts for security tasks)
- [ ] Document provider differences (OpenAI vs Anthropic)
- [ ] Add cost and latency considerations for security workloads
