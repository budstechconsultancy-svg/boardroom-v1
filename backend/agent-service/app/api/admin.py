from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from shared.database import get_session_context, init_database
from shared.models.agent import Agent, AgentType
from shared.models.proposal import Proposal, ProposalStatus

router = APIRouter()

@router.post("/seed")
async def seed_database(
    tenant_id: str = Query(..., description="Tenant ID")
):
    """Initialize database and seed default data."""
    try:
        # 1. Create tables
        await init_database()
        
        async with get_session_context() as session:
            # 2. Check if agents exist
            result = await session.execute(select(Agent))
            existing_agent = result.scalars().first()
            
            if not existing_agent:
                # Seed Agents
                agents = [
                    Agent(
                        name="CEO Agent", agent_type=AgentType.CEO,
                        description="Identify strategic risks and benefits.",
                        vote_weight=2.0, tenant_id=tenant_id
                    ),
                    Agent(
                        name="Finance Agent", agent_type=AgentType.FINANCE,
                        description="Financial Analysis & Budgeting",
                        vote_weight=1.5, tenant_id=tenant_id
                    ),
                    Agent(
                        name="HR Agent", agent_type=AgentType.HR,
                        description="Human Resources & Talent Management",
                        vote_weight=1.0, tenant_id=tenant_id
                    ),
                    Agent(
                        name="Ops Agent", agent_type=AgentType.OPS,
                        description="Operational Efficiency & Supply Chain",
                        vote_weight=1.2, tenant_id=tenant_id
                    ),
                    Agent(
                        name="Sales Agent", agent_type=AgentType.SALES,
                        description="Revenue Growth & Market Strategy",
                        vote_weight=1.1, tenant_id=tenant_id
                    ),
                    Agent(
                        name="Legal Agent", agent_type=AgentType.LEGAL,
                        description="Compliance & Regulatory Affairs",
                        vote_weight=1.0, tenant_id=tenant_id
                    ),
                    Agent(
                        name="Security Agent", agent_type=AgentType.IT_SECURITY,
                        description="Cybersecurity & Data Protection",
                        vote_weight=1.3, tenant_id=tenant_id
                    ),
                     Agent(
                        name="Marketing Agent", agent_type=AgentType.CUSTOM,
                        description="Brand & Market Positioning",
                        vote_weight=1.0, tenant_id=tenant_id
                    )
                ]
                session.add_all(agents)
                await session.flush()
                
                # Seed Sample Proposal
                import uuid
                sample_proposal = Proposal(
                    id=f"P-{uuid.uuid4().hex[:4]}",
                    title="Database Persistence Upgrade",
                    description="Move from mock data to persistent MySQL storage.",
                    domain="IT",
                    status=ProposalStatus.DELIBERATING,
                    risk_tier="low",
                    confidence_score=0.99,
                    current_round=1,
                    max_rounds=3,
                    payload={"action": "migrate_db"},
                    tenant_id=tenant_id
                )
                session.add(sample_proposal)
                
            return {"status": "success", "message": "Database seeded successfully"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
