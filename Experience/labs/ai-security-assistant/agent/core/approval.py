"""Human approval workflow.

Status: skeleton (Phase 0). Implemented in Phase 4.

Design:
- Approval is scoped to ONE specific tool call.
- Approving a call does not grant any future permission.
- Approvals (and rejections) are audit-logged with the approver identity.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any


class ApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TIMED_OUT = "timed_out"


@dataclass
class ApprovalRequest:
    """A single pending approval for one tool call."""

    request_id: str
    tool_name: str
    parameters: dict[str, Any]
    requested_by: str  # user identity
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    decided_by: str | None = None
    timeout_seconds: int = 300

    def approve(self, approver: str) -> None:
        self.status = ApprovalStatus.APPROVED
        self.decided_by = approver

    def reject(self, approver: str) -> None:
        self.status = ApprovalStatus.REJECTED
        self.decided_by = approver


class ApprovalService:
    """Manages approval requests (in-memory for MVP, persistent later)."""

    def __init__(self) -> None:
        self._requests: dict[str, ApprovalRequest] = {}

    def request(
        self, tool_name: str, parameters: dict[str, Any], requested_by: str
    ) -> ApprovalRequest:
        request = ApprovalRequest(
            request_id=f"apr-{len(self._requests) + 1}",
            tool_name=tool_name,
            parameters=parameters,
            requested_by=requested_by,
        )
        self._requests[request.request_id] = request
        return request

    def decide(self, request_id: str, approver: str, approved: bool) -> ApprovalRequest:
        request = self._requests[request_id]
        if approved:
            request.approve(approver)
        else:
            request.reject(approver)
        return request

    def get(self, request_id: str) -> ApprovalRequest | None:
        return self._requests.get(request_id)
