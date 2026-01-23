from __future__ import annotations
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..core.agent_registry import agent_registry
from ..core.base_agent import AgentDomain

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import get_async_session
from shared.models.agent import Agent as AgentModel, AgentType

router = APIRouter()


class AgentResponse(BaseModel):
    """Agent response model."""
    
    id: Optional[str] = None
    name: str
    domain: str
    description: str
    can_read: bool
    can_execute: bool
    can_propose: bool
    can_vote: bool
    vote_weight: float
    is_active: bool = True
    data_sources: List[str] = []


class AgentListResponse(BaseModel):
    """List of agents response."""
    
    agents: List[AgentResponse]
    total: int


@router.get("", response_model=AgentListResponse)
async def list_agents(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """List all agents from database."""
    query = select(AgentModel).filter(AgentModel.tenant_id == tenant_id)
    if domain:
        # Assuming domain maps to AgentType enum values
        try:
             query = query.filter(AgentModel.agent_type == domain)
        except:
             pass
        
    result = await session.execute(query)
    db_agents = result.scalars().all()
    
    agents = [
        AgentResponse(
            id=a.id,
            name=a.name,
            domain=a.agent_type.value,
            description=a.description or "",
            can_read=a.can_read,
            can_execute=a.can_execute,
            can_propose=a.can_propose,
            can_vote=a.can_vote,
            vote_weight=a.vote_weight,
            is_active=a.is_active,
            data_sources=a.rag_sources if a.rag_sources else []
        )
        for a in db_agents
    ]
    
    return AgentListResponse(agents=agents, total=len(agents))


@router.get("/{agent_domain}", response_model=AgentResponse)
async def get_agent(
    agent_domain: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """Get specific agent from DB."""
    query = select(AgentModel).filter(
        AgentModel.agent_type == agent_domain,
        AgentModel.tenant_id == tenant_id
    )
    result = await session.execute(query)
    a = result.scalars().first()
    
    if not a:
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_domain}")
    
    return AgentResponse(
        id=a.id,
        name=a.name,
        domain=a.agent_type.value,
        description=a.description or "",
        can_read=a.can_read,
        can_execute=a.can_execute,
        can_propose=a.can_propose,
        can_vote=a.can_vote,
        vote_weight=a.vote_weight,
        is_active=a.is_active,
        data_sources=a.rag_sources if a.rag_sources else []
    )


class CreateAgentRequest(BaseModel):
    name: str
    domain: str
    description: str
    weight: float = 1.0
    canExecute: bool = False
    llmModel: str = "gpt-4"
    ragEnabled: bool = False


@router.post("", response_model=AgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new agent in DB."""
    new_agent = AgentModel(
        name=request.name,
        agent_type=AgentType.CUSTOM, # Defaulting to custom for API added agents
        description=request.description,
        vote_weight=request.weight,
        can_execute=request.canExecute,
        llm_model=request.llmModel,
        rag_enabled=request.ragEnabled,
        tenant_id=tenant_id
    )
    session.add(new_agent)
    await session.commit()
    await session.refresh(new_agent)
    
    return AgentResponse(
        id=new_agent.id,
        name=new_agent.name,
        domain=new_agent.agent_type.value,
        description=new_agent.description,
        can_read=new_agent.can_read,
        can_execute=new_agent.can_execute,
        can_propose=new_agent.can_propose,
        can_vote=new_agent.can_vote,
        vote_weight=new_agent.vote_weight,
        is_active=new_agent.is_active,
        data_sources=new_agent.rag_sources if new_agent.rag_sources else []
    )


@router.delete("/{agent_domain}")
async def delete_agent(
    agent_domain: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """Delete agent from DB."""
    query = delete(AgentModel).filter(
        AgentModel.agent_type == agent_domain,
        AgentModel.tenant_id == tenant_id
    )
    await session.execute(query)
    await session.commit()
    return {"status": "deleted", "domain": agent_domain}


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
    
    Fixed: This still uses local registry for logic but could be mapped to DB agents if needed.
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
