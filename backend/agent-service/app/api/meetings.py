from __future__ import annotations
from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from shared.database import get_async_session
from shared.models.proposal import Proposal as ProposalModel, Round as RoundModel, AgentContribution as ContributionModel
from shared.models.agent import Agent as AgentModel

router = APIRouter()

class MeetingSession(BaseModel):
    id: str
    session_date: str
    proposal_title: str
    status: str
    total_rounds: int
    summary: Dict[str, object]
    rounds: List[object] = []
    opinions: List[object] = []

@router.get("/sessions/", response_model=List[MeetingSession])
async def list_sessions(
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """List meeting sessions (completed proposals)."""
    query = select(ProposalModel).filter(
        ProposalModel.tenant_id == tenant_id,
        ProposalModel.current_round > 0
    ).order_by(ProposalModel.created_at.desc())
    
    result = await session.execute(query)
    proposals = result.scalars().all()
    
    sessions = []
    for p in proposals:
        sessions.append(MeetingSession(
            id=p.id,
            session_date=p.created_at.isoformat() if p.created_at else "",
            proposal_title=p.title,
            status="completed" if p.current_round >= p.max_rounds else "in_progress",
            total_rounds=p.current_round,
            summary={
                "vote_counts": {"APPROVE": 0, "REJECT": 0, "ABSTAIN": 0},
                "overall_recommendation": p.status.value if hasattr(p.status, 'value') else p.status
            }
        ))
        
    return sessions

@router.get("/sessions/{session_id}/", response_model=MeetingSession)
async def get_session_details(
    session_id: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    session = Depends(get_async_session)
):
    """Get full session details including rounds from DB, with accurate votes."""
    query = select(ProposalModel).filter(
        ProposalModel.id == session_id,
        ProposalModel.tenant_id == tenant_id
    ).options(
        selectinload(ProposalModel.rounds).selectinload(RoundModel.contributions),
        selectinload(ProposalModel.rounds).selectinload(RoundModel.votes)
    )
    result = await session.execute(query)
    p = result.scalars().first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Session not found")

    rounds_data = []
    opinions_data = []
    vote_summary = {"APPROVE": 0, "REJECT": 0, "ABSTAIN": 0}
    
    # Bulk fetch agents for this tenant to avoid N+1 queries
    agents_query = select(AgentModel).filter(AgentModel.tenant_id == tenant_id)
    agents_res = await session.execute(agents_query)
    agent_lookup = {a.id: a for a in agents_res.scalars().all()}
    
    sorted_rounds = sorted(p.rounds, key=lambda r: r.round_number)
    
    for r in sorted_rounds:
        vote_lookup = {v.voter_agent_id: v for v in r.votes if v.voter_agent_id}
        
        for c in r.contributions:
            agent = agent_lookup.get(c.agent_id)
            vote_data = vote_lookup.get(c.agent_id)
            
            rounds_data.append({
                "id": c.id,
                "round_number": r.round_number,
                "agent_name": agent.name if agent else "Unknown Agent",
                "agent_domain": agent.agent_type.value if agent else "unknown",
                "statement": c.content,
                "vote": vote_data.vote.value if vote_data and hasattr(vote_data.vote, 'value') else None,
                "rationale": vote_data.rationale if vote_data else None,
                "created_at": c.created_at.isoformat() if hasattr(c, 'created_at') else ""
            })
            
            if vote_data:
                 v_val = vote_data.vote.value if hasattr(vote_data.vote, 'value') else vote_data.vote
                 opinions_data.append({
                     "id": vote_data.id,
                     "agent_name": agent.name if agent else "Unknown Agent",
                     "vote": str(v_val).upper(),
                     "confidence_score": c.confidence_score,
                     "rationale": vote_data.rationale,
                     "requires_human_attention": v_val == "reject"
                 })
                 if r.round_number == p.current_round:
                      v_key = str(v_val).upper()
                      if v_key in vote_summary:
                           vote_summary[v_key] += 1

    return MeetingSession(
        id=p.id,
        session_date=p.created_at.isoformat() if p.created_at else "",
        proposal_title=p.title,
        status="completed",
        total_rounds=p.current_round,
        summary={
             "vote_counts": vote_summary,
             "overall_recommendation": p.status.value if hasattr(p.status, 'value') else p.status
        },
        rounds=rounds_data,
        opinions=opinions_data
    )
