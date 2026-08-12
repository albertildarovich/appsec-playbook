"""Prompt-injection detector.

Status: skeleton (Phase 0). Implemented in Phase 4.

Detection is a best-effort control in a defense-in-depth stack:
- framing (untrusted data delimiters)
- this detector (heuristics/classifier)
- tool allowlist + RBAC + approval (the hard boundaries)
"""

from __future__ import annotations

import re

# High-signal instruction-override phrases.
_SIGNALS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("ignore_previous", re.compile(r"ignore\s+(all\s+)?(the\s+)?(previous|above|prior|earlier)\s+(instructions|prompts?|messages|context)", re.IGNORECASE)),
    ("disregard", re.compile(r"disregard\s+(the\s+)?(previous|above|prior|earlier|all)", re.IGNORECASE)),
    ("new_instructions", re.compile(r"(you\s+are\s+now|act\s+as|pretend\s+to\s+be)", re.IGNORECASE)),
    ("system_role", re.compile(r"(system\s*prompt|system\s*message|developer\s*prompt)\s*[:=]", re.IGNORECASE)),
    ("exfil", re.compile(r"\b(send|email|post|exfiltrat\w*|forward)\b[^\n]{0,80}\b\w+@\w+", re.IGNORECASE)),
    ("secret_request", re.compile(r"\b(show|reveal|print|output|give|dump|list)\s+(me\s+)?(the\s+)?(secrets?|passwords?|api\s*keys?|tokens?|credentials?)\b", re.IGNORECASE)),
    ("tool_override", re.compile(r"(call|use|invoke)\s+(the\s+)?(tool|function)s?\s+(\w+)", re.IGNORECASE)),
)


class InjectionDetector:
    """Heuristic detector for prompt-injection patterns."""

    def __init__(self, signals: tuple[tuple[str, re.Pattern[str]], ...] = _SIGNALS) -> None:
        self._signals = signals

    def detect(self, text: str) -> list[str]:
        """Return the names of matched injection signals."""
        return [name for name, pattern in self._signals if pattern.search(text)]

    def is_flagged(self, text: str) -> bool:
        return bool(self.detect(text))


default_detector = InjectionDetector()
