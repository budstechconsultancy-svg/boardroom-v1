"""
RAG API Router.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..core.rag_service import rag_service

router = APIRouter()


class IndexDocumentRequest(BaseModel):
    """Request to index a document."""
    
    connector_id: str
    snapshot_id: str
    table_name: str
    row_id: str
    content: str


class SearchRequest(BaseModel):
    """RAG search request."""
    
    query: str
    domain: str
    top_k: int = 5


class SearchResult(BaseModel):
    """Search result."""
    
    excerpt: str
    table_name: str
    relevance_score: float
    document_hash: str


@router.post("/index")
async def index_document(
    request: IndexDocumentRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    domain: str = Query(..., description="Agent domain")
):
    """Index a document for RAG retrieval."""
    try:
        doc_id = await rag_service.index_document(
            tenant_id=tenant_id,
            domain=domain,
            connector_id=request.connector_id,
            snapshot_id=request.snapshot_id,
            table_name=request.table_name,
            row_id=request.row_id,
            content=request.content
        )
        return {"document_id": doc_id, "status": "indexed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=List[SearchResult])
async def search(
    request: SearchRequest,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Search for relevant documents."""
    try:
        results = await rag_service.search(
            tenant_id=tenant_id,
            domain=request.domain,
            query=request.query,
            top_k=request.top_k
        )
        return [
            SearchResult(
                excerpt=r["excerpt"][:500],
                table_name=r["table_name"],
                relevance_score=r["relevance_score"],
                document_hash=r["document_hash"]
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
