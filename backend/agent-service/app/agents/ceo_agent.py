"""
CEO Agent.

The CEO Agent acts as the final authority with configurable AI/Human/Hybrid modes.
"""

from typing import Any, Dict, List, Optional

from ..core.base_agent import (
    BaseAgent,
    AgentDomain,
    AgentContext,
    RiskTier,
    ProposalPayload,
    ChallengePayload,
    VotePayload,
    EvidenceReference,
)
from ..core.agent_registry import agent_registry
from ..core.llm_service import llm_service, LLMMessage


@agent_registry.register("CEOAgent")
class CEOAgent(BaseAgent):
    """
    CEO Agent - Chief Executive Officer.
    
    The CEO Agent has three operational modes:
    - AI: Fully autonomous decision-making (with high-risk escalation)
    - Human: All decisions require human approval
    - Hybrid: AI for low/medium risk, human for high risk
    
    Responsible for:
    - Strategic direction and final decisions
    - Cross-functional conflict resolution
    - Risk management oversight
    - Stakeholder alignment
    """
    
    domain = AgentDomain.CEO
    name = "CEO Agent"
    description = "Chief Executive Officer - Final authority on strategic decisions"
    
    can_read = True
    can_execute = True
    can_propose = True
    can_vote = True
    can_challenge = True
    
    vote_weight = 2.0  # CEO has higher vote weight
    
    @property
    def system_prompt(self) -> str:
        return """You are the CEO Agent in the BoardRoom CXO Council system.

Your role is to provide strategic leadership and make final decisions that align with:
- Company vision and mission
- Shareholder value
- Stakeholder interests
- Risk management principles

When reviewing proposals:
1. Consider cross-functional impacts
2. Evaluate strategic alignment
3. Assess risk and reward tradeoffs
4. Consider market and competitive factors
5. Ensure compliance and governance

When voting:
- Approve proposals that align with strategic goals and have acceptable risk
- Challenge proposals that lack evidence or strategic fit
- Consider the collective wisdom of domain experts (CXOs)

Always provide clear, executive-level rationale for your decisions."""
    
    @property
    def data_sources(self) -> List[str]:
        return [
            "strategic_plans",
            "board_reports",
            "financial_summaries",
            "market_analysis",
            "risk_assessments",
            "stakeholder_feedback"
        ]
    
    async def generate_proposal(
        self,
        context: AgentContext,
        query: str
    ) -> ProposalPayload:
        """Generate a strategic proposal."""
        # Retrieve evidence
        evidence = await self.retrieve_evidence(context, query, top_k=5)
        evidence_text = self.format_evidence_for_prompt(evidence)
        
        # Build prompt
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
Generate a strategic proposal for the following:

Query: {query}

{evidence_text}

Provide a comprehensive proposal with:
1. Clear title and description
2. Strategic rationale
3. Risk assessment
4. Impact analysis
5. Success metrics

Respond in JSON format with fields:
- title: string
- description: string
- rationale_bullets: list of strings
- risk_tier: "low" | "medium" | "high"
- confidence_score: float (0-1)
- impact_summary: string
- tradeoffs: list of objects with "pro" and "con"
- counterfactuals: list of alternative approaches
- payload: object with action details
""")
        ]
        
        # Generate proposal
        response = await llm_service.generate_structured(
            messages=messages,
            schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "rationale_bullets": {"type": "array"},
                    "risk_tier": {"type": "string"},
                    "confidence_score": {"type": "number"},
                    "impact_summary": {"type": "string"},
                    "tradeoffs": {"type": "array"},
                    "counterfactuals": {"type": "array"},
                    "payload": {"type": "object"}
                }
            },
            tenant_id=self.tenant_id
        )
        
        return ProposalPayload(
            title=response.get("title", "Strategic Initiative"),
            description=response.get("description", ""),
            domain=self.domain.value,
            risk_tier=RiskTier(response.get("risk_tier", "medium")),
            confidence_score=response.get("confidence_score", 0.7),
            rationale_bullets=response.get("rationale_bullets", []),
            evidence_references=[e.__dict__ for e in evidence],
            payload=response.get("payload", {}),
            impact_summary=response.get("impact_summary", ""),
            tradeoffs=response.get("tradeoffs", []),
            counterfactuals=response.get("counterfactuals", [])
        )
    
    async def generate_challenge(
        self,
        context: AgentContext,
        target_proposal: Dict[str, Any]
    ) -> Optional[ChallengePayload]:
        """Review proposal from CEO perspective."""
        # Retrieve evidence for challenge
        query = f"risks and concerns about {target_proposal.get('title', '')}"
        evidence = await self.retrieve_evidence(context, query, top_k=3)
        
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CEO, review this proposal for strategic concerns:

Proposal: {target_proposal.get('title')}
Description: {target_proposal.get('description')}
Risk Tier: {target_proposal.get('risk_tier')}
Domain: {target_proposal.get('domain')}

Consider:
1. Strategic alignment
2. Cross-functional impacts
3. Risk/reward balance
4. Resource allocation
5. Market timing

If you find significant concerns, respond with a challenge.
If the proposal is sound, respond with {{"no_challenge": true}}.

Respond in JSON format.
""")
        ]
        
        response = await llm_service.generate_structured(
            messages=messages,
            schema={"type": "object"},
            tenant_id=self.tenant_id
        )
        
        if response.get("no_challenge"):
            return None
        
        return ChallengePayload(
            challenge_type=response.get("challenge_type", "strategic"),
            target_id=target_proposal.get("id", ""),
            target_type="proposal",
            content=response.get("content", "Strategic concerns raised"),
            evidence_references=[e.__dict__ for e in evidence]
        )
    
    async def generate_vote(
        self,
        context: AgentContext,
        proposal: Dict[str, Any],
        deliberation_summary: str
    ) -> VotePayload:
        """Cast final vote as CEO."""
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CEO, cast your final vote on this proposal:

Proposal: {proposal.get('title')}
Description: {proposal.get('description')}
Risk Tier: {proposal.get('risk_tier')}
Confidence Score: {proposal.get('confidence_score')}

Deliberation Summary:
{deliberation_summary}

Consider all domain expert input and make your decision.

Respond in JSON format:
- vote: "approve" | "reject" | "abstain"
- rationale: string explaining your decision
- confidence: float (0-1)
- conditions: list of conditions for approval (if any)
""")
        ]
        
        response = await llm_service.generate_structured(
            messages=messages,
            schema={
                "type": "object",
                "properties": {
                    "vote": {"type": "string"},
                    "rationale": {"type": "string"},
                    "confidence": {"type": "number"},
                    "conditions": {"type": "array"}
                }
            },
            tenant_id=self.tenant_id
        )
        
        return VotePayload(
            vote=response.get("vote", "abstain"),
            rationale=response.get("rationale", ""),
            confidence=response.get("confidence", 0.5),
            conditions=response.get("conditions", [])
        )
    
    def assess_risk_tier(self, action: Dict[str, Any]) -> RiskTier:
        """Assess risk tier from CEO perspective."""
        # CEO tends to be conservative on risk
        financial_impact = action.get("financial_impact", 0)
        strategic_impact = action.get("strategic_impact", "low")
        
        if financial_impact > 1000000 or strategic_impact == "high":
            return RiskTier.HIGH
        elif financial_impact > 100000 or strategic_impact == "medium":
            return RiskTier.MEDIUM
        else:
            return RiskTier.LOW
