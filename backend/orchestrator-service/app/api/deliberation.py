"""
Deliberation API Router.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..core.workflow_engine import workflow_engine, DeliberationStatus

router = APIRouter()


class StartDeliberationRequest(BaseModel):
    """Request to start deliberation."""
    
    proposal_id: str
    proposal_title: str
    proposal_description: str
    domain: str
    risk_tier: str = "medium"
    agents: List[str] = ["HRAgent", "FinanceAgent", "OpsAgent"]
    ceo_mode: str = "hybrid"


class DeliberationResponse(BaseModel):
    """Deliberation response."""
    
    id: str
    proposal_id: str
    status: str
    current_phase: str
    current_round: int
    max_rounds: int


@router.post("/start", response_model=DeliberationResponse)
async def start_deliberation(
    request: StartDeliberationRequest,
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Start a new deliberation session."""
    proposal = {
        "id": request.proposal_id,
        "title": request.proposal_title,
        "description": request.proposal_description,
        "domain": request.domain,
        "risk_tier": request.risk_tier
    }
    
    context = await workflow_engine.start_deliberation(
        tenant_id=tenant_id,
        proposal=proposal,
        agents=request.agents,
        ceo_mode=request.ceo_mode
    )
    
    return DeliberationResponse(
        id=context.deliberation_id,
        proposal_id=context.proposal_id,
        status=context.status.value,
        current_phase=context.current_phase.value,
        current_round=context.current_round,
        max_rounds=context.max_rounds
    )


@router.get("/{deliberation_id}", response_model=DeliberationResponse)
async def get_deliberation(deliberation_id: str):
    """Get deliberation status."""
    context = workflow_engine.get_deliberation(deliberation_id)
    if not context:
        raise HTTPException(status_code=404, detail="Deliberation not found")
    
    return DeliberationResponse(
        id=context.deliberation_id,
        proposal_id=context.proposal_id,
        status=context.status.value,
        current_phase=context.current_phase.value,
        current_round=context.current_round,
        max_rounds=context.max_rounds
    )


class AdvanceRoundRequest(BaseModel):
    """Request to advance round."""
    
    agents: List[str]


@router.post("/{deliberation_id}/advance")
async def advance_round(
    deliberation_id: str,
    request: AdvanceRoundRequest
):
    """Advance to next deliberation round."""
    try:
        round_result = await workflow_engine.run_round(
            deliberation_id=deliberation_id,
            participating_agents=request.agents
        )
        return {
            "round_number": round_result.round_number,
            "contributions_count": len(round_result.contributions),
            "challenges_count": len(round_result.challenges),
            "votes_count": len(round_result.votes)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{deliberation_id}/summary")
async def get_summary(deliberation_id: str):
    """Get deliberation summary."""
    summary = workflow_engine.get_deliberation_summary(deliberation_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Deliberation not found")
    return summary
