"""
Audit models for compliance and logging.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel


class AuditEventType(str, Enum):
    """Types of audit events."""
    
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    
    # Proposals
    PROPOSAL_CREATED = "proposal_created"
    PROPOSAL_UPDATED = "proposal_updated"
    PROPOSAL_DELETED = "proposal_deleted"
    PROPOSAL_STATUS_CHANGED = "proposal_status_changed"
    
    # Deliberation
    ROUND_STARTED = "round_started"
    ROUND_COMPLETED = "round_completed"
    CONTRIBUTION_ADDED = "contribution_added"
    CHALLENGE_RAISED = "challenge_raised"
    VOTE_CAST = "vote_cast"
    
    # Execution
    EXECUTION_INITIATED = "execution_initiated"
    EXECUTION_APPROVED = "execution_approved"
    EXECUTION_REJECTED = "execution_rejected"
    EXECUTION_COMPLETED = "execution_completed"
    EXECUTION_FAILED = "execution_failed"
    
    # Rollback
    ROLLBACK_INITIATED = "rollback_initiated"
    ROLLBACK_COMPLETED = "rollback_completed"
    ROLLBACK_FAILED = "rollback_failed"
    
    # Connectors
    CONNECTOR_CREATED = "connector_created"
    CONNECTOR_UPDATED = "connector_updated"
    CONNECTOR_SYNC_STARTED = "connector_sync_started"
    CONNECTOR_SYNC_COMPLETED = "connector_sync_completed"
    CONNECTOR_SYNC_FAILED = "connector_sync_failed"
    
    # Admin
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    ROLE_CHANGED = "role_changed"
    SETTINGS_CHANGED = "settings_changed"
    
    # LLM
    LLM_REQUEST = "llm_request"
    LLM_RESPONSE = "llm_response"
    
    # Export
    AUDIT_EXPORT = "audit_export"
    REPORT_GENERATED = "report_generated"


class AuditLog(TenantBaseModel):
    """
    Append-only audit log entry.
    
    All significant system events are logged here with cryptographic hashes.
    """
    
    __tablename__ = "audit_logs"
    
    # Event type
    event_type = Column(SQLEnum(AuditEventType), nullable=False, index=True)
    
    # Actor
    actor_user_id = Column(CHAR(36), nullable=True, index=True)
    actor_agent_id = Column(CHAR(36), nullable=True, index=True)
    actor_ip = Column(String(45), nullable=True)
    actor_user_agent = Column(String(500), nullable=True)
    
    # Target
    target_type = Column(String(50), nullable=True)  # proposal, user, connector, etc.
    target_id = Column(CHAR(36), nullable=True, index=True)
    
    # Event details
    description = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    
    # Before/After for changes
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    
    # Raw LLM data (for LLM events only, encrypted)
    raw_prompt = Column(LONGTEXT, nullable=True)
    raw_response = Column(LONGTEXT, nullable=True)
    
    # Cryptographic hash chain
    previous_hash = Column(String(64), nullable=True)
    event_hash = Column(String(64), nullable=False)
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, event={self.event_type})>"


class AuditBundle(TenantBaseModel):
    """
    Exported audit bundle for compliance.
    
    Contains a signed collection of audit logs and evidence.
    """
    
    __tablename__ = "audit_bundles"
    
    # Bundle identity
    bundle_name = Column(String(255), nullable=False)
    bundle_type = Column(String(50), nullable=False)  # compliance, legal_hold, export
    
    # Date range
    from_date = Column(String(50), nullable=False)
    to_date = Column(String(50), nullable=False)
    
    # Included items
    included_event_types = Column(JSON, default=list)
    included_proposal_ids = Column(JSON, default=list)
    
    # Storage
    storage_bucket = Column(String(100), nullable=False)
    storage_key = Column(String(500), nullable=False)
    
    # Format
    format = Column(String(20), default="json")  # json, pdf, csv
    
    # Size
    file_size_bytes = Column(String(20), nullable=True)
    record_count = Column(String(20), nullable=True)
    
    # Integrity
    bundle_hash = Column(String(64), nullable=False)
    
    # Signing
    is_signed = Column(Boolean, default=False)
    signature = Column(LONGTEXT, nullable=True)
    signing_certificate = Column(Text, nullable=True)
    signed_at = Column(String(50), nullable=True)
    
    # Requester
    requested_by_user_id = Column(CHAR(36), nullable=False)
    
    # Status
    status = Column(String(20), default="pending")  # pending, generating, completed, failed
    
    # Retention
    expires_at = Column(String(50), nullable=True)
    is_legal_hold = Column(Boolean, default=False)
    
    def __repr__(self) -> str:
        return f"<AuditBundle(id={self.id}, name={self.bundle_name})>"
