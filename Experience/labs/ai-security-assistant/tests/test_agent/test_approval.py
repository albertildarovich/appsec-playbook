"""Human approval workflow tests."""

from __future__ import annotations

from agent.core.approval import ApprovalService, ApprovalStatus


def test_request_is_pending() -> None:
    service = ApprovalService()
    request = service.request("create_ticket", {"title": "x"}, requested_by="alice")
    assert request.status == ApprovalStatus.PENDING
    assert request.decided_by is None


def test_approve_sets_decider() -> None:
    service = ApprovalService()
    request = service.request("create_ticket", {}, requested_by="alice")
    decided = service.decide(request.request_id, approver="bob", approved=True)
    assert decided.status == ApprovalStatus.APPROVED
    assert decided.decided_by == "bob"


def test_reject_sets_status() -> None:
    service = ApprovalService()
    request = service.request("update_ticket", {}, requested_by="alice")
    decided = service.decide(request.request_id, approver="bob", approved=False)
    assert decided.status == ApprovalStatus.REJECTED


def test_approval_is_scoped_to_one_call() -> None:
    """Approving one call must not auto-approve a different call."""
    service = ApprovalService()
    first = service.request("create_ticket", {"title": "a"}, requested_by="alice")
    second = service.request("update_ticket", {}, requested_by="alice")

    service.decide(first.request_id, approver="bob", approved=True)

    assert first.status == ApprovalStatus.APPROVED
    assert second.status == ApprovalStatus.PENDING
