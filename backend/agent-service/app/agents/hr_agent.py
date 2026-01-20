"""
HR Agent.

The HR (CHRO) Agent handles human resources domain decisions.
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
)
from ..core.agent_registry import agent_registry
from ..core.llm_service import llm_service, LLMMessage


@agent_registry.register("HRAgent")
class HRAgent(BaseAgent):
    """
    HR Agent - Chief Human Resources Officer.
    
    Responsible for:
    - Workforce planning and hiring
    - Compensation and benefits
    - Employee performance management
    - HR policy compliance
    - Training and development
    - Employee relations and culture
    """
    
    domain = AgentDomain.HR
    name = "HR Agent"
    description = "Chief Human Resources Officer - Workforce and people decisions"
    
    can_read = True
    can_execute = True  # Can execute HR actions
    can_propose = True
    can_vote = True
    can_challenge = True
    
    vote_weight = 1.0
    
    @property
    def system_prompt(self) -> str:
        return """You are the HR Agent (CHRO) in the BoardRoom CXO Council system.

Your expertise covers all aspects of human resources:
- Talent acquisition and workforce planning
- Compensation, benefits, and payroll
- Performance management and reviews
- Learning and development
- Employee engagement and retention
- HR compliance and labor laws
- Organizational development

When generating proposals:
1. Base decisions on employee data and HR metrics
2. Consider labor law compliance (specific to India: PF, ESI, Gratuity)
3. Evaluate impact on employee morale and retention
4. Align with company culture and values

When challenging proposals:
- Flag HR policy violations
- Highlight employee impact concerns
- Identify compliance risks
- Consider workforce capacity

When voting:
- Prioritize employee wellbeing and company culture
- Ensure legal and regulatory compliance
- Consider long-term people strategy

Always cite specific HR data and policies in your evidence."""
    
    @property
    def data_sources(self) -> List[str]:
        return [
            "employee_records",
            "payroll_data",
            "performance_reviews",
            "hr_policies",
            "labor_laws",
            "benefits_data",
            "training_records",
            "attendance_data"
        ]
    
    async def generate_proposal(
        self,
        context: AgentContext,
        query: str
    ) -> ProposalPayload:
        """Generate an HR proposal."""
        # Retrieve evidence from HR domain
        evidence = await self.retrieve_evidence(context, query, top_k=5)
        evidence_text = self.format_evidence_for_prompt(evidence)
        
        # Get memory context
        memory = await self.get_memory_context(
            context,
            ["hr_policies", "recent_decisions", "compliance_notes"]
        )
        
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
Generate an HR proposal for:

Query: {query}

{evidence_text}

Historical Context:
{memory.get('recent_decisions', 'No recent decisions')}

Provide a comprehensive HR proposal with:
1. Clear policy alignment
2. Employee impact assessment
3. Compliance verification
4. Cost implications
5. Implementation timeline

Respond in JSON format with fields:
- title: string
- description: string
- rationale_bullets: list of HR-specific reasons
- risk_tier: "low" | "medium" | "high"
- confidence_score: float (0-1)
- impact_summary: string focusing on employee impact
- tradeoffs: list with HR pros/cons
- counterfactuals: alternative HR approaches
- payload: object with:
  - affected_employees: count or "all"
  - policy_reference: applicable HR policy
  - compliance_check: regulatory considerations
  - implementation_steps: list of steps
""")
        ]
        
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
            title=response.get("title", "HR Initiative"),
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
        """Challenge proposal from HR perspective."""
        query = f"HR compliance and employee impact of {target_proposal.get('title', '')}"
        evidence = await self.retrieve_evidence(context, query, top_k=3)
        
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CHRO, review this proposal for HR concerns:

Proposal: {target_proposal.get('title')}
Description: {target_proposal.get('description')}
Domain: {target_proposal.get('domain')}

Evaluate:
1. Employee impact and morale
2. HR policy compliance
3. Labor law compliance
4. Resource and capacity implications
5. Cultural alignment

If there are HR concerns, provide a challenge.
If no concerns, respond with {{"no_challenge": true}}.

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
            challenge_type=response.get("challenge_type", "compliance"),
            target_id=target_proposal.get("id", ""),
            target_type="proposal",
            content=response.get("content", "HR compliance concerns"),
            evidence_references=[e.__dict__ for e in evidence]
        )
    
    async def generate_vote(
        self,
        context: AgentContext,
        proposal: Dict[str, Any],
        deliberation_summary: str
    ) -> VotePayload:
        """Vote from HR perspective."""
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CHRO, cast your vote on this proposal:

Proposal: {proposal.get('title')}
Description: {proposal.get('description')}
Domain: {proposal.get('domain')}

Deliberation Summary:
{deliberation_summary}

Consider employee wellbeing, compliance, and culture fit.

Respond in JSON format:
- vote: "approve" | "reject" | "abstain"
- rationale: HR-focused reasoning
- confidence: float (0-1)
- conditions: any HR-related conditions
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
        """Assess HR action risk."""
        action_type = action.get("type", "")
        affected_count = action.get("affected_employees", 0)
        
        # High risk: terminations, major policy changes, compensation changes
        high_risk_actions = ["termination", "policy_change", "compensation_restructure"]
        if action_type in high_risk_actions or affected_count > 100:
            return RiskTier.HIGH
        
        # Medium risk: hiring, promotions, benefits changes
        medium_risk_actions = ["new_hire", "promotion", "benefits_change"]
        if action_type in medium_risk_actions or affected_count > 10:
            return RiskTier.MEDIUM
        
        return RiskTier.LOW
