import os
import django
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
    {"name": "Finance Agent", "role": "Financial Analysis & Budgeting", "is_active": True, "vote_weight": 1.5, "can_execute": False, "configuration": {"domain": "finance", "llm_model": "gpt-4"}},
    {"name": "HR Agent", "role": "Human Resources & Talent Management", "is_active": True, "vote_weight": 1.0, "can_execute": False, "configuration": {"domain": "hr", "llm_model": "gpt-4"}},
    {"name": "Ops Agent", "role": "Operational Efficiency & Supply Chain", "is_active": True, "vote_weight": 1.2, "can_execute": False, "configuration": {"domain": "ops", "llm_model": "gpt-4"}},
    {"name": "Legal Agent", "role": "Compliance & Regulatory Affairs", "is_active": True, "vote_weight": 1.0, "can_execute": False, "configuration": {"domain": "legal", "llm_model": "gpt-4"}},
    {"name": "Sales Agent", "role": "Revenue Growth & Market Strategy", "is_active": True, "vote_weight": 1.1, "can_execute": False, "configuration": {"domain": "sales", "llm_model": "gpt-4"}},
    {"name": "Security Agent", "role": "Cybersecurity & Data Protection", "is_active": True, "vote_weight": 1.3, "can_execute": False, "configuration": {"domain": "security", "llm_model": "gpt-4"}},
    {"name": "Procurement Agent", "role": "Strategic Sourcing & Vendor Management", "is_active": True, "vote_weight": 1.0, "can_execute": False, "configuration": {"domain": "procurement", "llm_model": "gpt-4"}},
    {"name": "Product Agent", "role": "Product Development & UX Strategy", "is_active": True, "vote_weight": 1.2, "can_execute": False, "configuration": {"domain": "product", "llm_model": "gpt-4"}},
]

for data in agents_data:
    Agent.objects.get_or_create(name=data["name"], defaults=data)

now = timezone.now()

# Proposals to match screenshot KPIs and table exactly
initial_proposals = [
    # Top 4 from screenshot table (Ordered by most recent)
    {"id": 8, "title": "it contracts", "domain": "IT Security", "status": "voting", "risk_tier": "medium", "confidence": 0.75, "proposer": "Security Agent", "created_at": now},
    {"id": 7, "title": "Staff needed in sales", "domain": "Ops", "status": "voting", "risk_tier": "medium", "confidence": 0.75, "proposer": "Ops Agent", "created_at": now - timedelta(minutes=5)},
    {"id": 6, "title": "New product patent", "domain": "Legal", "status": "rejected", "risk_tier": "low", "confidence": 0.75, "proposer": "Legal Agent", "created_at": now - timedelta(minutes=10)},
    {"id": 5, "title": "Sales budget increase", "domain": "Sales", "status": "approved", "risk_tier": "low", "confidence": 0.75, "proposer": "Sales Agent", "created_at": now - timedelta(minutes=15)},
    
    # 2nd approved to make Auto Executed = 2
    {"id": 105, "title": "Cloud Migration", "domain": "Ops", "status": "approved", "risk_tier": "low", "confidence": 0.85, "proposer": "Ops Agent", "created_at": now - timedelta(hours=1)}, 
    
    # +3 more voting to make Pending Approvals = 5 total (ids 8, 7, 109, 110, 111)
    {"id": 109, "title": "Vendor Audit", "domain": "Finance", "status": "voting", "risk_tier": "medium", "confidence": 0.80, "proposer": "Finance Agent", "created_at": now - timedelta(hours=2)},
    {"id": 110, "title": "Office Relocation", "domain": "Ops", "status": "voting", "risk_tier": "high", "confidence": 0.70, "proposer": "Ops Agent", "created_at": now - timedelta(hours=3)},
    {"id": 111, "title": "New ERP Implementation", "domain": "Product", "status": "voting", "risk_tier": "high", "confidence": 0.65, "proposer": "Product Agent", "created_at": now - timedelta(hours=4)},
    
    # 5 deliberating to make Active Proposals = 5
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
    # Set created_at after save to avoid auto_now_add override
    p.created_at = p_created_at
    p.save()

# Initial Settings
initial_settings = [
    {"key": "company_name", "value": "Acme Corp"},
    {"key": "ceo_mode", "value": "hybrid"},
    {"key": "auto_execute_low_risk", "value": True},
    {"key": "rollback_window", "value": 60},
]

for s_data in initial_settings:
    SystemSetting.objects.get_or_create(key=s_data["key"], defaults=s_data)

print("Data seeded to match dashboard KPIs and table layout exactly!")
