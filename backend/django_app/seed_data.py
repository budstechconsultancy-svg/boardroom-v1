import os
import django
import json
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boardroom_backend.settings')
django.setup()

from agents.models import Agent
from proposals.models import Proposal, DeliberationMessage
from settings.models import SystemSetting

# Clear existing data
Proposal.objects.all().delete()
Agent.objects.all().delete()
SystemSetting.objects.all().delete()

# Initial Agents
agents_data = [
    {"name": "Finance Agent", "role": "Financial Analysis & Budgeting", "is_active": True, "vote_weight": 1.5, "can_execute": False, "configuration": {"domain": "finance"}},
    {"name": "HR Agent", "role": "Human Resources & Talent Management", "is_active": True, "vote_weight": 1.0, "can_execute": False, "configuration": {"domain": "hr"}},
    {"name": "Ops Agent", "role": "Operational Efficiency & Supply Chain", "is_active": True, "vote_weight": 1.2, "can_execute": False, "configuration": {"domain": "ops"}},
    {"name": "Legal Agent", "role": "Compliance & Regulatory Affairs", "is_active": True, "vote_weight": 1.0, "can_execute": False, "configuration": {"domain": "legal"}},
    {"name": "Sales Agent", "role": "Revenue Growth & Market Strategy", "is_active": True, "vote_weight": 1.1, "can_execute": False, "configuration": {"domain": "sales"}},
    {"name": "Security Agent", "role": "Cybersecurity & Data Protection", "is_active": True, "vote_weight": 1.3, "can_execute": False, "configuration": {"domain": "security"}},
]

for data in agents_data:
    Agent.objects.get_or_create(name=data["name"], defaults=data)

now = timezone.now()

deliberation_templates = {
    'Finance Agent': [
        "I've analyzed the budget impact. We have sufficient runway for this.",
        "ROI projections look promising, assuming a 12-month payback period.",
        "We should consider the tax implications of this reallocation.",
        "I suggest we tighten the cost controls for this initiative.",
        "Financially sound. I'm ready to move to a vote."
    ],
    'HR Agent': [
        "From a talent perspective, this aligns with our growth strategy.",
        "We need to ensure we have the right skillset for implementation.",
        "This could impact employee retention positively if handled well.",
        "I suggest we include a training module for the affected teams.",
        "HR supports this. The cultural fit is strong."
    ],
    'Ops Agent': [
        "Operations can support this transition with minimal downtime.",
        "We should optimize the supply chain workflow for this project.",
        "Scalability check: Our current infrastructure can handle increased load.",
        "I suggest a phased rollout to mitigate operational risks.",
        "Operational readiness confirmed. Proceed."
    ],
    'Legal Agent': [
        "Reviewing contract terms. Standard clauses seem applicable.",
        "Regulatory compliance check: No conflicts with existing laws.",
        "I suggest adding an indemnity clause for vendor interactions.",
        "Drafting final approval documents. All legal bases covered.",
        "Legally cleared. Ready for execution."
    ],
    'Security Agent': [
        "Security audit required. Initial assessment shows low risk.",
        "We must ensure compliance with data protection regulations.",
        "I suggest encrypting all transaction logs for this service.",
        "Firewall rules updated. Monitoring systems are in place.",
        "Security protocols met. No objections."
    ],
    'Sales Agent': [
        "Initial market feedback is positive.",
        "We should target the mid-market segment first.",
        "I suggest increasing the social media ad spend.",
        "Sales projections updated for next quarter.",
        "Incentive programs aligned with this proposal."
    ]
}

evidence_library = {
    'finance': [
        {'source': 'Q1 Budget Analysis', 'excerpt': 'Current runway exceeds projections by 20% due to OPEX optimization.'},
        {'source': 'Tax Compliance Audit', 'excerpt': 'Reallocation of funds between business units is compliant with local regulations.'},
        {'source': 'ROI Projection v2.1', 'excerpt': 'Expected payback period is 14 months with a 2.5x multiplier on initial investment.'}
    ],
    'hr': [
        {'source': 'Retention Survey 2024', 'excerpt': '85% of employees cited "Growth Opportunities" as their top priority.'},
        {'source': 'Market Salary Index', 'excerpt': 'Standard roles in this sector have seen a 12% increase in salary expectations.'},
        {'source': 'Skills Gap Analysis', 'excerpt': 'Current team has 60% coverage for required implementation technologies.'}
    ],
    'ops': [
        {'source': 'Supply Chain Log', 'excerpt': 'Lead times for hardware acquisition currently average 45 days.'},
        {'source': 'Infrastructure Health', 'excerpt': 'Current server load is at 88% capacity during peak hours.'},
        {'source': 'SLA Performance Report', 'excerpt': 'Average uptime for critical systems maintained at 99.98% over last quarter.'}
    ],
    'security': [
        {'source': 'Vulnerability Assessment', 'excerpt': 'Zero critical vulnerabilities found in the last penetration test of core services.'},
        {'source': 'Compliance ISO27001', 'excerpt': 'Section 5.2 - Access controls are fully aligned with industry best practices.'},
        {'source': 'Threat Intelligence Feed', 'excerpt': 'No active exploits detected targeting our current stack in the last 30 days.'}
    ],
    'legal': [
        {'source': 'Master Service Agreement', 'excerpt': 'Section 12.4 - Liability is clearly defined and capped at $500k.'},
        {'source': 'IP Registry', 'excerpt': 'Proposed feature name search returned no existing trademarks in relevant jurisdictions.'},
        {'source': 'Regulatory Update (Jan 24)', 'excerpt': 'Compliance requirements for data residency are met by our current AWS region.'}
    ],
    'sales': [
        {'source': 'CRM Data Q4', 'excerpt': 'Lead conversion rate increased by 15% after initial pilot.'},
        {'source': 'Market Research Report', 'excerpt': 'Competitor A has not yet entered the specific niche targeted by this proposal.'},
        {'source': 'Customer Sentiment Analysis', 'excerpt': '82% NPS recorded for existing similar features.'}
    ]
}

conclusions = [
    "Initial consensus reached. Moving to detailed impact assessment.",
    "Risk mitigation strategies identified. Proceeding to final review.",
    "Counsel has reached a majority agreement on technical feasibility.",
    "Counter-arguments addressed. Finalizing executive summary.",
    "Deliberation complete. Proposal reaches unified consensus for voting."
]

# Proposals
initial_proposals = [
    {"id": 8, "title": "it contracts", "domain": "IT Security", "status": "voting", "risk_tier": "medium", "confidence": 0.75, "proposer": "Security Agent", "created_at": now},
    {"id": 7, "title": "Staff needed in sales", "domain": "Ops", "status": "voting", "risk_tier": "medium", "confidence": 0.75, "proposer": "Ops Agent", "created_at": now - timedelta(minutes=5)},
    {"id": 6, "title": "New product patent", "domain": "Legal", "status": "rejected", "risk_tier": "low", "confidence": 0.75, "proposer": "Legal Agent", "created_at": now - timedelta(minutes=10)},
    {"id": 5, "title": "Sales budget increase", "domain": "Sales", "status": "approved", "risk_tier": "low", "confidence": 0.75, "proposer": "Sales Agent", "created_at": now - timedelta(minutes=15)},
    {"id": 105, "title": "Cloud Migration", "domain": "Ops", "status": "approved", "risk_tier": "low", "confidence": 0.85, "proposer": "Ops Agent", "created_at": now - timedelta(hours=1)}, 
    {"id": 109, "title": "Vendor Audit", "domain": "Finance", "status": "voting", "risk_tier": "medium", "confidence": 0.80, "proposer": "Finance Agent", "created_at": now - timedelta(hours=2)},
    {"id": 110, "title": "Office Relocation", "domain": "Ops", "status": "voting", "risk_tier": "high", "confidence": 0.70, "proposer": "Ops Agent", "created_at": now - timedelta(hours=3)},
    {"id": 111, "title": "New ERP Implementation", "domain": "Product", "status": "voting", "risk_tier": "high", "confidence": 0.65, "proposer": "Product Agent", "created_at": now - timedelta(hours=4)},
    {"id": 112, "title": "Marketing Campaign", "domain": "Sales", "status": "deliberating", "risk_tier": "medium", "confidence": 0.60, "proposer": "Sales Agent", "created_at": now - timedelta(hours=5)},
    {"id": 113, "title": "HR Policy Update", "domain": "HR", "status": "deliberating", "risk_tier": "low", "confidence": 0.90, "proposer": "HR Agent", "created_at": now - timedelta(hours=6)},
    {"id": 114, "title": "Legal Risk Assessment", "domain": "Legal", "status": "deliberating", "risk_tier": "medium", "confidence": 0.85, "proposer": "Legal Agent", "created_at": now - timedelta(hours=7)},
    {"id": 115, "title": "Customer Feedback Loop", "domain": "Sales", "status": "deliberating", "risk_tier": "low", "confidence": 0.88, "proposer": "Sales Agent", "created_at": now - timedelta(hours=8)},
    {"id": 116, "title": "Security Patch Update", "domain": "IT Security", "status": "deliberating", "risk_tier": "high", "confidence": 0.95, "proposer": "Security Agent", "created_at": now - timedelta(hours=9)},
]

for p_data in initial_proposals:
    p_id = p_data.pop("id")
    p_created_at = p_data.pop("created_at")
    if "description" not in p_data:
        p_data["description"] = f"Description for {p_data['title']}"
    
    p = Proposal.objects.create(id=p_id, **p_data)
    p.created_at = p_created_at
    p.save()

    # Add 5 rounds of messages
    for round_num in range(1, 6):
        for agent_name, agent_msgs in deliberation_templates.items():
            domain = agent_name.split(' ')[0].lower()
            
            metadata = {}
            if round_num in [2, 4] and domain in evidence_library:
                ev = evidence_library[domain][0 if round_num == 2 else 1]
                metadata = {
                    "source": ev['source'],
                    "evidence": ev['excerpt']
                }

            DeliberationMessage.objects.create(
                proposal=p,
                agent_name=agent_name,
                agent_domain=domain,
                message=agent_msgs[round_num-1],
                round_number=round_num,
                is_conclusion=False,
                metadata=metadata
            )
        # Add Round Conclusion
        DeliberationMessage.objects.create(
            proposal=p,
            agent_name="Council Lead",
            agent_domain="system",
            message=conclusions[round_num-1],
            round_number=round_num,
            is_conclusion=True
        )

# Initial Settings
initial_settings = [
    {"key": "company_name", "value": "Acme Corp"},
    {"key": "ceo_mode", "value": "hybrid"},
    {"key": "auto_execute_low_risk", "value": True},
    {"key": "rollback_window", "value": 60},
]

for s_data in initial_settings:
    SystemSetting.objects.get_or_create(key=s_data["key"], defaults=s_data)

print("Data seeded with 5 rounds of deliberation and evidence for all proposals!")
