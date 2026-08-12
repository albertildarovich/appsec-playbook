"""Core security helpers.

Status: skeleton (Phase 0). Full implementations land in Phase 4:
- secret redaction
- prompt-injection detection
- input/output validation
- RBAC policy checks
"""

from __future__ import annotations


def redact_secrets(text: str) -> str:
    """Deterministic secret redaction (Phase 4)."""
    return text


def detect_prompt_injection(text: str) -> bool:
    """Return True if the text looks like a prompt-injection attempt (Phase 4)."""
    return False
