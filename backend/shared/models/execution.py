"""
Execution models for action execution and rollback.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel


class ExecutionStatus(str, Enum):
    """Status of an execution."""
    
    PENDING = "pending"
    APPROVED = "approved"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    ROLLBACK_FAILED = "rollback_failed"


class ExecutionMode(str, Enum):
    """Execution modes."""
    
    READ_ONLY = "read_only"       # No writes allowed
    AUTO_EXECUTE = "auto_execute" # Auto-execute low-risk
    MANUAL = "manual"             # All require approval


class ExecutionRecord(TenantBaseModel):
    """
    Record of an execution action on an ERP.
    
    Tracks the full lifecycle including rollback capability.
    """
    
    __tablename__ = "execution_records"
    
    # Parent proposal
    proposal_id = Column(CHAR(36), ForeignKey("proposals.id"), nullable=False, index=True)
    proposal = relationship("Proposal", back_populates="execution_records")
    
    # Executor
    executor_agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=True)
    executor_user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    
    # Approvers
    approved_by = Column(JSON, default=list)  # List of user IDs who approved
    
    # Execution mode
    execution_mode = Column(
        SQLEnum(ExecutionMode),
        default=ExecutionMode.MANUAL,
        nullable=False
    )
    
    # Status
    status = Column(
        SQLEnum(ExecutionStatus),
        default=ExecutionStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Risk tier
    risk_tier = Column(String(20), nullable=False)  # low, medium, high
    
    # Target connector
    connector_id = Column(CHAR(36), ForeignKey("connectors.id"), nullable=False)
    
    # Action details
    action_type = Column(String(100), nullable=False)  # create, update, delete
    action_payload = Column(JSON, nullable=False)
    
    # Target entity
    target_table = Column(String(255), nullable=True)
    target_id = Column(String(255), nullable=True)
    
    # Pre-execution snapshot
    pre_snapshot_id = Column(CHAR(36), nullable=True)
    pre_snapshot_hash = Column(String(64), nullable=True)
    
    # Post-execution snapshot
    post_snapshot_id = Column(CHAR(36), nullable=True)
    post_snapshot_hash = Column(String(64), nullable=True)
    
    # Rollback configuration
    rollback_window_minutes = Column(Integer, default=60)
    rollback_expires_at = Column(String(50), nullable=True)
    is_rollback_available = Column(Boolean, default=True)
    
    # Execution result
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)
    
    # Attestation
    attestation_hash = Column(String(64), nullable=True)
    
    # Relationships
    rollbacks = relationship("RollbackRecord", back_populates="execution", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<ExecutionRecord(id={self.id}, status={self.status})>"
    
    @property
    def can_rollback(self) -> bool:
        """Check if rollback is still available."""
        from datetime import datetime
        if not self.is_rollback_available:
            return False
        if self.rollback_expires_at:
            expires = datetime.fromisoformat(self.rollback_expires_at)
            return datetime.utcnow() < expires
        return True


class RollbackRecord(TenantBaseModel):
    """
    Record of a rollback operation.
    """
    
    __tablename__ = "rollback_records"
    
    # Parent execution
    execution_id = Column(CHAR(36), ForeignKey("execution_records.id"), nullable=False, index=True)
    execution = relationship("ExecutionRecord", back_populates="rollbacks")
    
    # Initiator
    initiated_by_user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    
    # Reason
    reason = Column(Text, nullable=False)
    
    # Status
    status = Column(String(50), default="pending")  # pending, in_progress, completed, failed
    
    # Rollback details
    rollback_snapshot_id = Column(CHAR(36), nullable=True)
    rollback_snapshot_hash = Column(String(64), nullable=True)
    
    # Result
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)
    
    def __repr__(self) -> str:
        return f"<RollbackRecord(id={self.id}, execution_id={self.execution_id})>"
