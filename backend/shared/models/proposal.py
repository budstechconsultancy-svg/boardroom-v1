"""
Proposal models for the deliberation workflow.
"""

from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel


class ProposalStatus(str, Enum):
    """Status of a proposal through the deliberation workflow."""
    
    DRAFT = "draft"
    DELIBERATING = "deliberating"
    VOTING = "voting"
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_EXECUTION = "pending_execution"
    EXECUTING = "executing"
    EXECUTED = "executed"
    ROLLED_BACK = "rolled_back"
    CANCELLED = "cancelled"


class VoteValue(str, Enum):
    """Possible vote values."""
    
    APPROVE = "approve"
    REJECT = "reject"
    ABSTAIN = "abstain"


class Proposal(TenantBaseModel):
    """
    A proposal submitted for board deliberation.
    
    Proposals go through: propose → challenge → counterproposal → vote
    """
    
    __tablename__ = "proposals"
    
    # Proposal content
    title = Column(String(500), nullable=False)
    description = Column(LONGTEXT, nullable=True)
    
    # Proposer
    proposer_agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=True)
    proposer_user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    
    # Domain
    domain = Column(String(50), nullable=False, index=True)  # hr, finance, ops, etc.
    
    # Proposal payload (JSON with action details)
    payload = Column(JSON, nullable=False)
    
    # Impact summary
    impact_summary = Column(Text, nullable=True)
    
    # Risk assessment
    risk_tier = Column(String(20), default="medium")  # low, medium, high
    
    # Confidence score (0.0 - 1.0)
    confidence_score = Column(Float, default=0.0)
    
    # Status
    status = Column(
        SQLEnum(ProposalStatus),
        default=ProposalStatus.DRAFT,
        nullable=False,
        index=True
    )
    
    # Deliberation config
    max_rounds = Column(Integer, default=3)
    current_round = Column(Integer, default=0)
    
    # Voting
    quorum_required = Column(Integer, default=60)  # Percentage
    
    # Final decision
    final_decision = Column(String(20), nullable=True)  # approved, rejected
    decision_rationale = Column(LONGTEXT, nullable=True)
    
    # Board memo (generated after deliberation)
    board_memo = Column(LONGTEXT, nullable=True)
    
    # Tradeoff table
    tradeoffs = Column(JSON, default=list)
    
    # Relationships
    # Relationships
    rounds = relationship("Round", back_populates="proposal", order_by="Round.round_number")
    evidence_references = relationship("EvidenceReference", back_populates="proposal", lazy="dynamic")
    execution_records = relationship("ExecutionRecord", back_populates="proposal", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Proposal(id={self.id}, title={self.title[:50]}, status={self.status})>"


class Round(TenantBaseModel):
    """
    A deliberation round within a proposal.
    
    Each round contains agent contributions, challenges, and votes.
    """
    
    __tablename__ = "rounds"
    
    # Parent proposal
    proposal_id = Column(CHAR(36), ForeignKey("proposals.id"), nullable=False, index=True)
    proposal = relationship("Proposal", back_populates="rounds")
    
    # Round number (1, 2, 3, ...)
    round_number = Column(Integer, nullable=False)
    
    # Round type
    round_type = Column(String(50), default="deliberation")  # deliberation, voting, final
    
    # Timing
    started_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)
    timeout_at = Column(String(50), nullable=True)
    
    # Summary
    summary = Column(LONGTEXT, nullable=True)
    
    # Relationships
    contributions = relationship("AgentContribution", back_populates="round")
    challenges = relationship("Challenge", back_populates="round")
    votes = relationship("Vote", back_populates="round")
    
    def __repr__(self) -> str:
        return f"<Round(proposal_id={self.proposal_id}, number={self.round_number})>"


class AgentContribution(TenantBaseModel):
    """
    An agent's contribution to a deliberation round.
    """
    
    __tablename__ = "agent_contributions"
    
    # Parent round
    round_id = Column(CHAR(36), ForeignKey("rounds.id"), nullable=False, index=True)
    round = relationship("Round", back_populates="contributions")
    
    # Contributing agent
    agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=False, index=True)
    
    # Contribution content
    content = Column(LONGTEXT, nullable=False)
    
    # Rationale bullets
    rationale_bullets = Column(JSON, default=list)
    
    # Evidence references (IDs)
    evidence_ids = Column(JSON, default=list)
    
    # Confidence
    confidence_score = Column(Float, default=0.0)
    
    # Counter-proposal (if any)
    is_counterproposal = Column(Boolean, default=False)
    counterproposal_payload = Column(JSON, nullable=True)
    
    # Raw LLM interaction (for audit)
    raw_prompt = Column(LONGTEXT, nullable=True)  # Encrypted
    raw_response = Column(LONGTEXT, nullable=True)  # Encrypted
    
    def __repr__(self) -> str:
        return f"<AgentContribution(round_id={self.round_id}, agent_id={self.agent_id})>"


class Challenge(TenantBaseModel):
    """
    A challenge raised by an agent against a proposal or contribution.
    """
    
    __tablename__ = "challenges"
    
    # Parent round
    round_id = Column(CHAR(36), ForeignKey("rounds.id"), nullable=False, index=True)
    round = relationship("Round", back_populates="challenges")
    
    # Challenger
    challenger_agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=False)
    
    # Target (proposal or contribution)
    target_type = Column(String(50), nullable=False)  # proposal, contribution
    target_id = Column(CHAR(36), nullable=False)
    
    # Challenge content
    challenge_type = Column(String(50), nullable=False)  # data, logic, risk, compliance
    content = Column(LONGTEXT, nullable=False)
    
    # Evidence supporting challenge
    evidence_ids = Column(JSON, default=list)
    
    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolution = Column(LONGTEXT, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Challenge(round_id={self.round_id}, type={self.challenge_type})>"


class Vote(TenantBaseModel):
    """
    A vote cast by an agent or user on a proposal.
    """
    
    __tablename__ = "votes"
    
    # Parent round
    round_id = Column(CHAR(36), ForeignKey("rounds.id"), nullable=False, index=True)
    round = relationship("Round", back_populates="votes")
    
    # Voter (agent or user)
    voter_agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=True)
    voter_user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=True)
    
    # Vote details
    vote = Column(SQLEnum(VoteValue), nullable=False)
    
    # Weight (based on role/domain)
    weight = Column(Float, default=1.0)
    
    # Rationale
    rationale = Column(LONGTEXT, nullable=True)
    
    # Conditions (if conditional approval)
    conditions = Column(JSON, default=list)
    
    def __repr__(self) -> str:
        voter = self.voter_agent_id or self.voter_user_id
        return f"<Vote(round_id={self.round_id}, voter={voter}, vote={self.vote})>"
