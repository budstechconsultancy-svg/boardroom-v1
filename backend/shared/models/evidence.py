"""
Evidence models for provenance tracking.
"""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, Float, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel


class EvidenceReference(TenantBaseModel):
    """
    Reference to evidence supporting a proposal or claim.
    
    Every claim must include evidence references with full provenance.
    """
    
    __tablename__ = "evidence_references"
    
    # Parent proposal
    proposal_id = Column(CHAR(36), ForeignKey("proposals.id"), nullable=True, index=True)
    proposal = relationship("Proposal", back_populates="evidence_references")
    
    # Source connector
    connector_id = Column(CHAR(36), ForeignKey("connectors.id"), nullable=False, index=True)
    
    # Snapshot reference
    snapshot_id = Column(CHAR(36), nullable=False, index=True)
    
    # Data location
    table_name = Column(String(255), nullable=False)
    row_id = Column(String(255), nullable=True)
    column_name = Column(String(255), nullable=True)
    
    # Extracted content
    excerpt = Column(LONGTEXT, nullable=False)
    
    # Full context (for audit)
    full_context = Column(LONGTEXT, nullable=True)
    
    # Document hash for integrity
    document_hash = Column(String(64), nullable=False)  # SHA-256
    
    # Vector embedding reference
    embedding_id = Column(String(255), nullable=True)
    
    # RAG relevance score
    relevance_score = Column(Float, default=0.0)
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    # Query that retrieved this evidence
    retrieval_query = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<EvidenceReference(id={self.id}, table={self.table_name})>"
    
    def to_citation(self) -> dict:
        """Generate citation format for display."""
        return {
            "connector_id": self.connector_id,
            "snapshot_id": self.snapshot_id,
            "source": f"{self.table_name}:{self.row_id}",
            "excerpt": self.excerpt[:200] + "..." if len(self.excerpt) > 200 else self.excerpt,
            "hash": self.document_hash[:12],
            "relevance": round(self.relevance_score, 2)
        }


class EvidenceArtifact(TenantBaseModel):
    """
    Stored artifact (document, file) as evidence.
    
    Stored in S3-compatible object store.
    """
    
    __tablename__ = "evidence_artifacts"
    
    # Artifact identity
    artifact_type = Column(String(50), nullable=False, index=True)
    # e.g., "document", "spreadsheet", "image", "report"
    
    # File info
    file_name = Column(String(255), nullable=False)
    file_size = Column(String(20), nullable=True)  # In bytes
    mime_type = Column(String(100), nullable=True)
    
    # Storage location
    storage_bucket = Column(String(100), nullable=False)
    storage_key = Column(String(500), nullable=False)
    
    # Integrity
    file_hash = Column(String(64), nullable=False)  # SHA-256
    
    # Source
    source_connector_id = Column(CHAR(36), nullable=True)
    source_sync_id = Column(CHAR(36), nullable=True)
    
    # Vector indexing
    is_indexed = Column(String(10), default="false")
    chunk_count = Column(String(10), default="0")
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    # Retention
    retention_until = Column(String(50), nullable=True)
    
    def __repr__(self) -> str:
        return f"<EvidenceArtifact(id={self.id}, name={self.file_name})>"
