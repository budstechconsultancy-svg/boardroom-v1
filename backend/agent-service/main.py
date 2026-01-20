"""
BoardRoom Agent Service - Main Application.

FastAPI application for managing CXO domain agents with RAG integration.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app

# Import routers
from app.api import agents, health, proposals, rag

# Import shared components
import sys
sys.path.insert(0, "..")
from shared.config import settings
from shared.database import init_database, close_database

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.observability.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Agent Service...")
    await init_database()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Agent Service...")
    await close_database()
    logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(
    title="BoardRoom Agent Service",
    description="CXO Domain Agent Runtime with RAG Integration",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )


# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(proposals.router, prefix="/api/v1/proposals", tags=["Proposals"])
app.include_router(rag.router, prefix="/api/v1/rag", tags=["RAG"])

# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "BoardRoom Agent Service",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )
