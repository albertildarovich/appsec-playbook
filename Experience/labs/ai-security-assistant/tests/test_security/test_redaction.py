"""Secret redaction tests."""

from __future__ import annotations

from security.secret_redaction import contains_secret, redact_secrets


def test_openai_key_is_redacted() -> None:
    text = "API_KEY=sk-abcdefghijklmnopqrstuvwxyz1234567890"
    redacted = redact_secrets(text)
    assert "sk-" not in redacted
    assert "[REDACTED]" in redacted


def test_aws_key_is_redacted() -> None:
    text = "aws_key=AKIAIOSFODNN7EXAMPLE"
    redacted = redact_secrets(text)
    assert "[REDACTED]" in redacted
    assert "AKIA" not in redacted


def test_password_assignment_is_redacted() -> None:
    text = "password=sup3rsecretvalue"
    redacted = redact_secrets(text)
    assert "[REDACTED]" in redacted


def test_plain_text_survives() -> None:
    text = "nginx version 1.25.3 is vulnerable"
    assert redact_secrets(text) == text


def test_contains_secret_detects_pattern() -> None:
    assert contains_secret("token=abc123def456ghi789")
    assert not contains_secret("just some normal text")
