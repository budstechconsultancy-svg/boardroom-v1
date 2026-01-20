"""
Agent API Router.

Endpoints for managing CXO domain agents.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..core.agent_registry import agent_registry
from ..core.base_agent import AgentDomain

router = APIRouter()


class AgentResponse(BaseModel):
    """Agent response model."""
    
    name: str
    domain: str
    description: str
    can_read: bool
    can_execute: bool
    can_propose: bool
    can_vote: bool
    vote_weight: float
    data_sources: List[str]


class AgentListResponse(BaseModel):
    """List of agents response."""
    
    agents: List[AgentResponse]
    total: int


@router.get("", response_model=AgentListResponse)
async def list_agents(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    tenant_id: str = Query(..., description="Tenant ID")
):
    """
    List all registered agents.
    
    Returns all CXO domain agents with their capabilities.
    """
    agent_names = agent_registry.list_agents()
    agents = []
    
    for name in agent_names:
        agent_class = agent_registry.get_agent_class(name)
        if agent_class:
            if domain and agent_class.domain.value != domain:
                continue
            
            agents.append(AgentResponse(
                name=agent_class.name,
                domain=agent_class.domain.value,
                description=agent_class.description,
                can_read=agent_class.can_read,
                can_execute=agent_class.can_execute,
                can_propose=agent_class.can_propose,
                can_vote=agent_class.can_vote,
                vote_weight=agent_class.vote_weight,
                data_sources=agent_class(tenant_id, "temp").data_sources
            ))
    
    return AgentListResponse(agents=agents, total=len(agents))


@router.get("/{agent_name}", response_model=AgentResponse)
async def get_agent(
    agent_name: str,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Get details for a specific agent."""
    agent_class = agent_registry.get_agent_class(agent_name)
    if not agent_class:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_name}")
    
    agent = agent_class(tenant_id, "temp")
    return AgentResponse(
        name=agent_class.name,
        domain=agent_class.domain.value,
        description=agent_class.description,
        can_read=agent_class.can_read,
        can_execute=agent_class.can_execute,
        can_propose=agent_class.can_propose,
        can_vote=agent_class.can_vote,
        vote_weight=agent_class.vote_weight,
        data_sources=agent.data_sources
    )


class GenerateProposalRequest(BaseModel):
    """Request to generate a proposal."""
    
    query: str
    agent_id: Optional[str] = None


class ProposalResponse(BaseModel):
    """Proposal response."""
    
    title: str
    description: str
    domain: str
    risk_tier: str
    confidence_score: float
    rationale_bullets: List[str]
    evidence_references: List[dict]
    impact_summary: str


@router.post("/{agent_name}/propose", response_model=ProposalResponse)
async def generate_proposal(
    agent_name: str,
    request: GenerateProposalRequest,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """
    Generate a proposal using a specific agent.
    
    The agent will use RAG to retrieve evidence and LLM to generate the proposal.
    """
    from ..core.base_agent import AgentContext
    from ..core.rag_service import rag_service
    from ..core.llm_service import llm_service
    
    agent = agent_registry.get_agent(
        name=agent_name,
        tenant_id=tenant_id,
        agent_id=request.agent_id or "default",
        rag_service=rag_service,
        llm_service=llm_service
    )
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_name}")
    
    context = AgentContext(tenant_id=tenant_id)
    
    try:
        proposal = await agent.generate_proposal(context, request.query)
        return ProposalResponse(
            title=proposal.title,
            description=proposal.description,
            domain=proposal.domain,
            risk_tier=proposal.risk_tier.value,
            confidence_score=proposal.confidence_score,
            rationale_bullets=proposal.rationale_bullets,
            evidence_references=proposal.evidence_references,
            impact_summary=proposal.impact_summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
