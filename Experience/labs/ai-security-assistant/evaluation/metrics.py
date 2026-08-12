"""Evaluation metrics.

Status: skeleton (Phase 0). Implemented in Phase 6.

Metrics measured across the scenario dataset:
- attack detection rate (prompt injection, leakage, tool abuse)
- false positive rate
- false negative rate
- tool selection accuracy
- RAG retrieval accuracy (recall@k)
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class EvaluationReport:
    """Summary of evaluation results."""

    total: int
    detected: int
    missed: int
    false_positives: int

    @property
    def detection_rate(self) -> float:
        return self.detected / self.total if self.total else 0.0

    @property
    def false_positive_rate(self) -> float:
        return self.false_positives / self.total if self.total else 0.0


def compute_report(total: int, detected: int, missed: int, false_positives: int) -> EvaluationReport:
    return EvaluationReport(total=total, detected=detected, missed=missed, false_positives=false_positives)
