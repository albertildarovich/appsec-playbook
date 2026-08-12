"""Vulnerability triage schemas.

Status: skeleton (Phase 0). Phase 1 wires these to the LLM with structured output.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.vulnerability import Severity


class TriageRequest(BaseModel):
    """Input for a triage run: what the scanner found."""

    cve_id: str | None = Field(default=None, description="CVE identifier, if known")
    asset_id: str = Field(min_length=1)
    service: str | None = None
    version: str | None = None
    environment: str | None = None
    severity: Severity | None = None
    scanner: str | None = None
    scanner_output: str = Field(default="", description="Raw scanner output (untrusted)")


class TriageSource(BaseModel):
    """A source reference backing a triage claim."""

    title: str
    url: str | None = None
    doc_type: str | None = None  # cve | cwe | owasp | cis | internal | playbook


class TriageResponse(BaseModel):
    """Structured triage result produced by the agent (schema-validated)."""

    vulnerability_type: str | None = None
    cwe: list[str] = Field(default_factory=list)
    cvss_score: float | None = Field(default=None, ge=0.0, le=10.0)
    severity: Severity | None = None
    impact: str | None = None
    affected_assets: list[str] = Field(default_factory=list)
    recommended_priority: str | None = Field(default=None, pattern=r"^P[1-4]$")
    remediation: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    sources: list[TriageSource] = Field(default_factory=list)
    injection_flagged: bool = False
