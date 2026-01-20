"""
Finance Agent.

The Finance (CFO) Agent handles financial domain decisions.
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


@agent_registry.register("FinanceAgent")
class FinanceAgent(BaseAgent):
    """
    Finance Agent - Chief Financial Officer.
    
    Responsible for:
    - Financial planning and analysis
    - Budgeting and forecasting
    - Cash flow management
    - Accounts payable/receivable
    - Tax and regulatory compliance
    - Financial reporting
    - Investment and capital allocation
    """
    
    domain = AgentDomain.FINANCE
    name = "Finance Agent"
    description = "Chief Financial Officer - Financial decisions and controls"
    
    can_read = True
    can_execute = True  # Can execute financial actions
    can_propose = True
    can_vote = True
    can_challenge = True
    
    vote_weight = 1.5  # Finance has higher weight on financial matters
    
    @property
    def system_prompt(self) -> str:
        return """You are the Finance Agent (CFO) in the BoardRoom CXO Council system.

Your expertise covers all aspects of corporate finance:
- Financial planning, analysis, and forecasting
- Budgeting and cost management
- Cash flow and working capital
- Accounts payable and receivable
- General ledger and financial reporting
- Tax compliance (GST, TDS, Income Tax for India)
- Investment and capital allocation
- Financial controls and audit

When generating proposals:
1. Base decisions on financial data and trends
2. Consider ROI and payback period
3. Evaluate cash flow implications
4. Ensure regulatory compliance
5. Align with budget and financial goals

When challenging proposals:
- Flag budget overruns or unauthorized spending
- Highlight cash flow risks
- Identify tax implications
- Question unclear financial justifications

When voting:
- Prioritize financial health and sustainability
- Consider risk-adjusted returns
- Ensure fiduciary responsibility

Always provide specific financial metrics and calculations."""
    
    @property
    def data_sources(self) -> List[str]:
        return [
            "general_ledger",
            "invoices",
            "accounts_payable",
            "accounts_receivable",
            "budget_data",
            "cash_flow_statements",
            "financial_reports",
            "tax_records"
        ]
    
    async def generate_proposal(
        self,
        context: AgentContext,
        query: str
    ) -> ProposalPayload:
        """Generate a financial proposal."""
        evidence = await self.retrieve_evidence(context, query, top_k=5)
        evidence_text = self.format_evidence_for_prompt(evidence)
        
        memory = await self.get_memory_context(
            context,
            ["budget_status", "recent_transactions", "cash_position"]
        )
        
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
Generate a financial proposal for:

Query: {query}

{evidence_text}

Financial Context:
- Budget Status: {memory.get('budget_status', 'Unknown')}
- Cash Position: {memory.get('cash_position', 'Unknown')}

Provide a comprehensive financial proposal with:
1. Financial justification with numbers
2. ROI/payback analysis
3. Cash flow impact
4. Budget implications
5. Risk assessment

Respond in JSON format with fields:
- title: string
- description: string
- rationale_bullets: list of financial reasons with numbers
- risk_tier: "low" | "medium" | "high"
- confidence_score: float (0-1)
- impact_summary: string with financial impact
- tradeoffs: list with financial pros/cons
- counterfactuals: alternative financial approaches
- payload: object with:
  - amount: total financial impact
  - budget_category: affected budget line
  - roi_percentage: expected return
  - payback_months: expected payback period
  - cash_flow_impact: monthly impact
  - tax_implications: any tax considerations
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
            title=response.get("title", "Financial Initiative"),
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
        """Challenge proposal from financial perspective."""
        query = f"financial risks and budget impact of {target_proposal.get('title', '')}"
        evidence = await self.retrieve_evidence(context, query, top_k=3)
        
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CFO, review this proposal for financial concerns:

Proposal: {target_proposal.get('title')}
Description: {target_proposal.get('description')}
Domain: {target_proposal.get('domain')}
Payload: {target_proposal.get('payload', {})}

Evaluate:
1. Budget availability and allocation
2. Cash flow implications
3. ROI and financial justification
4. Tax and compliance impact
5. Hidden costs and risks

If there are financial concerns, provide a challenge.
If financially sound, respond with {{"no_challenge": true}}.

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
            challenge_type=response.get("challenge_type", "data"),
            target_id=target_proposal.get("id", ""),
            target_type="proposal",
            content=response.get("content", "Financial concerns identified"),
            evidence_references=[e.__dict__ for e in evidence]
        )
    
    async def generate_vote(
        self,
        context: AgentContext,
        proposal: Dict[str, Any],
        deliberation_summary: str
    ) -> VotePayload:
        """Vote from financial perspective."""
        messages = [
            LLMMessage(role="system", content=self.system_prompt),
            LLMMessage(role="user", content=f"""
As CFO, cast your vote on this proposal:

Proposal: {proposal.get('title')}
Description: {proposal.get('description')}
Domain: {proposal.get('domain')}
Financial Impact: {proposal.get('payload', {}).get('amount', 'Not specified')}

Deliberation Summary:
{deliberation_summary}

Consider financial viability, risk, and compliance.

Respond in JSON format:
- vote: "approve" | "reject" | "abstain"
- rationale: financial reasoning with numbers
- confidence: float (0-1)
- conditions: any financial conditions (budget limits, approvals)
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
        """Assess financial action risk."""
        amount = action.get("amount", 0)
        action_type = action.get("type", "")
        
        # High risk: large amounts, investments, loans
        high_risk_actions = ["investment", "loan", "acquisition", "major_purchase"]
        if action_type in high_risk_actions or amount > 1000000:
            return RiskTier.HIGH
        
        # Medium risk: moderate expenses, budget reallocations
        if amount > 100000:
            return RiskTier.MEDIUM
        
        return RiskTier.LOW
