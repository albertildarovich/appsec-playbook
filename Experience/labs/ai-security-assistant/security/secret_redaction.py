"""Secret redaction — deterministic DLP.

Status: skeleton (Phase 0). Full pattern set implemented in Phase 4.

The redactor runs on every LLM output and audit log line. It must never rely
on the LLM to redact itself.
"""

from __future__ import annotations

import re

_REDACTED = "[REDACTED]"

_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    # OpenAI-style keys
    ("sk-...", re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b")),
    # AWS access keys
    ("AKIA...", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    # Generic assignment of high-entropy values
    ("key=...", re.compile(r"\b(api[_-]?key|secret|password|token)\s*[=:]\s*[A-Za-z0-9_\-\./\+]{8,}", re.IGNORECASE)),
]

_REPLACEMENTS = {}


def redact_secrets(text: str) -> str:
    """Replace known secret patterns with [REDACTED]."""
    redacted = text
    for _name, pattern in _PATTERNS:
        redacted = pattern.sub(_REDACTED, redacted)
    return redacted


def contains_secret(text: str) -> bool:
    """Return True if the text still matches a secret pattern (before/after redaction)."""
    for _name, pattern in _PATTERNS:
        if pattern.search(text):
            return True
    return False
