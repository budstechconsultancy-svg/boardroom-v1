"""
Core package for Agent Service.
"""

from .base_agent import (
    BaseAgent,
    AgentDomain,
    RiskTier,
    AgentContext,
    EvidenceReference,
    ProposalPayload,
    ChallengePayload,
    VotePayload,
)
from .agent_registry import agent_registry
from .llm_service import llm_service, embedding_service, LLMMessage, LLMResponse
from .rag_service import rag_service, RAGResult

__all__ = [
    # Base Agent
    "BaseAgent",
    "AgentDomain",
    "RiskTier",
    "AgentContext",
    "EvidenceReference",
    "ProposalPayload",
    "ChallengePayload",
    "VotePayload",
    # Registry
    "agent_registry",
    # Services
    "llm_service",
    "embedding_service",
    "LLMMessage",
    "LLMResponse",
    "rag_service",
    "RAGResult",
]
