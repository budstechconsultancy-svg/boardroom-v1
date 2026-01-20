"""
Health Check Router.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "agent-service"}


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    # TODO: Add checks for dependencies (DB, Milvus, Redis)
    return {"status": "ready"}
