"""Health check router."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "healthy", "service": "orchestrator-service"}

@router.get("/ready")
async def ready():
    return {"status": "ready"}
