"""
Board Orchestrator Service - Main Application.

Implements the deliberation workflow: propose → challenge → vote
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.api import deliberation, health
from app.core.workflow_engine import WorkflowEngine

import sys
sys.path.insert(0, "..")
from shared.config import settings
from shared.database import init_database, close_database

logging.basicConfig(level=getattr(logging, settings.observability.log_level))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan."""
    logger.info("Starting Orchestrator Service...")
    await init_database()
    yield
    await close_database()
    logger.info("Orchestrator Service stopped")


app = FastAPI(
    title="BoardRoom Orchestrator Service",
    description="Board Deliberation Workflow Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(deliberation.router, prefix="/api/v1/deliberation", tags=["Deliberation"])

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/")
async def root():
    return {"service": "BoardRoom Orchestrator", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=settings.debug)
