"""
RAG Service.

Handles retrieval-augmented generation with per-agent vector stores.
"""

import hashlib
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    connections,
    utility,
)

import sys
sys.path.insert(0, "../..")
from shared.config import settings

from .llm_service import embedding_service

logger = logging.getLogger(__name__)


@dataclass
class RAGResult:
    """Result from RAG search."""
    
    connector_id: str
    snapshot_id: str
    table_name: str
    row_id: Optional[str]
    excerpt: str
    document_hash: str
    embedding_id: str
    relevance_score: float
    metadata: Dict[str, Any]


class RAGService:
    """
    RAG Service for per-agent evidence retrieval.
    
    Each agent has an isolated vector store namespace:
    - Collection name: {tenant_id}_{domain}
    - Enables domain-specific retrieval
    - Supports multiple data sources per agent
    """
    
    EMBEDDING_DIM = 1536  # OpenAI embedding dimension
    
    def __init__(self):
        self._connected = False
    
    async def connect(self):
        """Connect to Milvus vector database."""
        if self._connected:
            return
        
        try:
            connections.connect(
                alias="default",
                host=settings.milvus.host,
                port=settings.milvus.port
            )
            self._connected = True
            logger.info(f"Connected to Milvus at {settings.milvus.host}:{settings.milvus.port}")
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            raise
    
    def _get_collection_name(self, tenant_id: str, domain: str) -> str:
        """Get collection name for tenant and domain."""
        # Sanitize for Milvus naming rules
        safe_tenant = tenant_id.replace("-", "_")[:20]
        return f"br_{safe_tenant}_{domain}"
    
    async def ensure_collection(self, tenant_id: str, domain: str) -> Collection:
        """Ensure collection exists for tenant/domain."""
        await self.connect()
        
        collection_name = self._get_collection_name(tenant_id, domain)
        
        if utility.has_collection(collection_name):
            return Collection(collection_name)
        
        # Create collection schema
        fields = [
            FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
            FieldSchema(name="tenant_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="connector_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="snapshot_id", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="table_name", dtype=DataType.VARCHAR, max_length=255),
            FieldSchema(name="row_id", dtype=DataType.VARCHAR, max_length=255),
            FieldSchema(name="excerpt", dtype=DataType.VARCHAR, max_length=65535),
            FieldSchema(name="document_hash", dtype=DataType.VARCHAR, max_length=64),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=self.EMBEDDING_DIM),
        ]
        
        schema = CollectionSchema(
            fields=fields,
            description=f"RAG collection for {domain} domain"
        )
        
        collection = Collection(name=collection_name, schema=schema)
        
        # Create index for vector search
        index_params = {
            "metric_type": "COSINE",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 128}
        }
        collection.create_index(field_name="embedding", index_params=index_params)
        
        logger.info(f"Created collection: {collection_name}")
        return collection
    
    async def index_document(
        self,
        tenant_id: str,
        domain: str,
        connector_id: str,
        snapshot_id: str,
        table_name: str,
        row_id: Optional[str],
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Index a document in the vector store.
        
        Args:
            tenant_id: Tenant ID
            domain: Agent domain
            connector_id: Source connector
            snapshot_id: Snapshot reference
            table_name: Source table
            row_id: Row identifier
            content: Document content
            metadata: Additional metadata
            
        Returns:
            Document ID
        """
        collection = await self.ensure_collection(tenant_id, domain)
        
        # Generate embedding
        embedding = await embedding_service.embed_single(content, tenant_id)
        
        # Generate document ID and hash
        doc_id = hashlib.sha256(
            f"{tenant_id}:{connector_id}:{table_name}:{row_id}:{content[:100]}".encode()
        ).hexdigest()[:32]
        
        doc_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # Truncate excerpt for storage
        excerpt = content[:65000] if len(content) > 65000 else content
        
        # Insert into collection
        entities = [
            [doc_id],
            [tenant_id],
            [connector_id],
            [snapshot_id],
            [table_name],
            [row_id or ""],
            [excerpt],
            [doc_hash],
            [embedding],
        ]
        
        collection.insert(entities)
        collection.flush()
        
        logger.debug(f"Indexed document {doc_id} in {collection.name}")
        return doc_id
    
    async def search(
        self,
        tenant_id: str,
        domain: str,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant documents.
        
        Args:
            tenant_id: Tenant ID
            domain: Agent domain
            query: Search query
            top_k: Number of results
            filters: Additional filters
            
        Returns:
            List of matching documents with scores
        """
        collection = await self.ensure_collection(tenant_id, domain)
        collection.load()
        
        # Generate query embedding
        query_embedding = await embedding_service.embed_single(query, tenant_id)
        
        # Build filter expression
        expr = f'tenant_id == "{tenant_id}"'
        if filters:
            for key, value in filters.items():
                expr += f' and {key} == "{value}"'
        
        # Search
        search_params = {"metric_type": "COSINE", "params": {"nprobe": 10}}
        
        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=expr,
            output_fields=["connector_id", "snapshot_id", "table_name", "row_id", "excerpt", "document_hash"]
        )
        
        # Format results
        formatted = []
        for hits in results:
            for hit in hits:
                formatted.append({
                    "connector_id": hit.entity.get("connector_id"),
                    "snapshot_id": hit.entity.get("snapshot_id"),
                    "table_name": hit.entity.get("table_name"),
                    "row_id": hit.entity.get("row_id"),
                    "excerpt": hit.entity.get("excerpt"),
                    "document_hash": hit.entity.get("document_hash"),
                    "embedding_id": hit.id,
                    "relevance_score": hit.score,
                    "metadata": {}
                })
        
        return formatted
    
    async def delete_by_snapshot(
        self,
        tenant_id: str,
        domain: str,
        snapshot_id: str
    ):
        """Delete all documents for a snapshot."""
        collection = await self.ensure_collection(tenant_id, domain)
        
        expr = f'tenant_id == "{tenant_id}" and snapshot_id == "{snapshot_id}"'
        collection.delete(expr)
        collection.flush()
        
        logger.info(f"Deleted documents for snapshot {snapshot_id}")


# Service instance
rag_service = RAGService()
