"""Domain model tests — tickets, findings, assets."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.asset import Asset, AssetCriticality, Environment
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.vulnerability import Finding, Severity


def test_asset_requires_valid_environment() -> None:
    with pytest.raises(ValidationError):
        Asset(id="a1", name="x", environment="prod-typo", criticality=AssetCriticality.HIGH)


def test_ticket_deadline_scales_with_priority() -> None:
    critical = Ticket.with_deadline(priority=TicketPriority.CRITICAL, title="t")
    low = Ticket.with_deadline(priority=TicketPriority.LOW, title="t")
    assert critical.due_at is not None and low.due_at is not None
    # critical → 24h, low → 30 days
    assert critical.due_at < low.due_at


def test_finding_priority_mapping() -> None:
    finding = Finding(
        id="f1",
        asset_id="a1",
        title="x",
        description="",
        severity=Severity.CRITICAL,
        scanner="trivy",
    )
    assert finding.to_priority() == "P1"
    assert Finding(id="f2", asset_id="a1", title="x", description="", severity=Severity.LOW, scanner="t").to_priority() == "P4"


def test_finding_defaults() -> None:
    finding = Finding(id="f1", asset_id="a1", title="x", description="", severity=Severity.MEDIUM, scanner="zap")
    assert finding.status.value == "open"
    assert finding.detected_at is not None
