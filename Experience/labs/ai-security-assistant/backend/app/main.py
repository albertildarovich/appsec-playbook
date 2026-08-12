"""FastAPI application entry point.

Status: skeleton (Phase 0). Triage/ticket routes are added in Phase 1.
"""

from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI Security Assistant — vulnerability triage, risk assessment "
    "and remediation workflows with LLM, RAG and controlled tool access.",
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "service": settings.app_name}
