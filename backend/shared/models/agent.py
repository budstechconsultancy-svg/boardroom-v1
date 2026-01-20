"""
Agent models for CXO domain agents.
"""

from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Column, Enum as SQLEnum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import CHAR, JSON, LONGTEXT
from sqlalchemy.orm import relationship

from .base import TenantBaseModel, BaseModel


class AgentType(str, Enum):
    """Types of CXO agents."""
    
    CEO = "ceo"                     # Chief Executive Officer
    HR = "hr"                       # Chief Human Resources Officer
    FINANCE = "finance"             # Chief Financial Officer
    OPS = "ops"                     # Chief Operations Officer
    SALES = "sales"                 # Chief Revenue Officer
    PROCUREMENT = "procurement"     # Chief Procurement Officer
    LEGAL = "legal"                 # Chief Legal Officer
    IT_SECURITY = "it_security"     # Chief Information Security Officer
    CUSTOMER_SUCCESS = "customer_success"  # Chief Customer Officer
    PRODUCT = "product"             # Chief Product Officer
    CUSTOM = "custom"               # Custom agent type


class Agent(TenantBaseModel):
    """
    CXO Agent configuration and state.
    
    Each agent represents a virtual C-level executive with domain expertise.
    """
    
    __tablename__ = "agents"
    
    # Agent identity
    name = Column(String(100), nullable=False)
    agent_type = Column(SQLEnum(AgentType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Agent persona
    persona = Column(Text, nullable=True)  # System prompt/persona
    
    # Capabilities
    can_read = Column(Boolean, default=True)
    can_execute = Column(Boolean, default=False)
    can_propose = Column(Boolean, default=True)
    can_vote = Column(Boolean, default=True)
    can_challenge = Column(Boolean, default=True)
    
    # Voting weight (0.0 - 2.0, default 1.0)
    vote_weight = Column(Float, default=1.0)
    
    # RAG configuration
    rag_enabled = Column(Boolean, default=True)
    rag_collection_name = Column(String(100), nullable=True)
    rag_sources = Column(JSON, default=list)  # List of data sources
    embedding_model = Column(String(100), default="text-embedding-3-small")
    
    # LLM configuration
    llm_model = Column(String(100), default="gpt-4-turbo")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=4096)
    
    # Prompt templates
    proposal_prompt_template = Column(LONGTEXT, nullable=True)
    challenge_prompt_template = Column(LONGTEXT, nullable=True)
    vote_prompt_template = Column(LONGTEXT, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Relationships
    memories = relationship("AgentMemory", back_populates="agent", lazy="dynamic")
    configs = relationship("AgentConfig", back_populates="agent", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, type={self.agent_type}, name={self.name})>"


# Add missing import
from sqlalchemy import Integer


class AgentMemory(TenantBaseModel):
    """
    Encrypted domain memory for agents.
    
    Stores learned patterns, preferences, and context for each agent.
    """
    
    __tablename__ = "agent_memories"
    
    # Parent agent
    agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=False, index=True)
    agent = relationship("Agent", back_populates="memories")
    
    # Memory type
    memory_type = Column(String(50), nullable=False, index=True)
    # e.g., "decision_pattern", "user_preference", "domain_context"
    
    # Memory key for retrieval
    memory_key = Column(String(255), nullable=False, index=True)
    
    # Encrypted content
    content_encrypted = Column(LONGTEXT, nullable=False)
    
    # Metadata
    metadata = Column(JSON, default=dict)
    
    # Embedding for similarity search
    embedding_id = Column(String(255), nullable=True)
    
    # Expiry
    expires_at = Column(String(50), nullable=True)
    
    def __repr__(self) -> str:
        return f"<AgentMemory(agent_id={self.agent_id}, type={self.memory_type})>"


class AgentConfig(TenantBaseModel):
    """
    Agent configuration overrides per tenant.
    """
    
    __tablename__ = "agent_configs"
    
    # Parent agent
    agent_id = Column(CHAR(36), ForeignKey("agents.id"), nullable=False, index=True)
    agent = relationship("Agent", back_populates="configs")
    
    # Config key-value
    config_key = Column(String(100), nullable=False, index=True)
    config_value = Column(JSON, nullable=True)
    
    # Description
    description = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<AgentConfig(agent_id={self.agent_id}, key={self.config_key})>"
