"""
Seed default agents into the database.
"""
import asyncio
import sys
import os
import uuid

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from shared.database import async_engine


async def seed_agents():
    """Create default CXO agents using raw SQL to avoid relationship issues."""
    
    agents_data = [
        ("CEO - Chief Executive Officer", "ceo", "Strategic oversight and final decision authority", 2.0, True),
        ("CFO - Chief Financial Officer", "finance", "Financial planning, budgeting, and fiscal responsibility", 1.5, False),
        ("CHRO - Chief Human Resources Officer", "hr", "Talent management, culture, and organizational development", 1.0, False),
        ("COO - Chief Operations Officer", "ops", "Operational efficiency and process optimization", 1.5, False),
        ("CRO - Chief Revenue Officer", "sales", "Revenue generation and market expansion", 1.5, False),
        ("CLO - Chief Legal Officer", "legal", "Legal compliance and risk mitigation", 1.0, False),
        ("CISO - Chief Information Security Officer", "it_security", "Cybersecurity and data protection", 1.0, False),
        ("CPO - Chief Product Officer", "product", "Product strategy and innovation", 1.0, False),
        ("CCO - Chief Customer Officer", "customer_success", "Customer satisfaction and retention", 1.0, False),
        ("CPO - Chief Procurement Officer", "procurement", "Strategic sourcing and vendor management", 1.0, False),
    ]
    
    async with async_engine.begin() as conn:
        # Check if agents already exist
        result = await conn.execute(
            text("SELECT COUNT(*) as cnt FROM agents WHERE tenant_id = 'default'")
        )
        count = result.scalar()
        
        if count > 0:
            print(f"Found {count} existing agents. Skipping seed.")
            return
        
        # Insert agents
        for name, agent_type, description, vote_weight, can_execute in agents_data:
            agent_id = str(uuid.uuid4())
            await conn.execute(
                text("""
                    INSERT INTO agents 
                    (id, tenant_id, name, agent_type, description, vote_weight, 
                     can_read, can_execute, can_propose, can_vote, can_challenge, 
                     rag_enabled, is_active, llm_model, temperature, max_tokens)
                    VALUES 
                    (:id, :tenant_id, :name, :agent_type, :description, :vote_weight,
                     :can_read, :can_execute, :can_propose, :can_vote, :can_challenge,
                     :rag_enabled, :is_active, :llm_model, :temperature, :max_tokens)
                """),
                {
                    "id": agent_id,
                    "tenant_id": "default",
                    "name": name,
                    "agent_type": agent_type,
                    "description": description,
                    "vote_weight": vote_weight,
                    "can_read": True,
                    "can_execute": can_execute,
                    "can_propose": True,
                    "can_vote": True,
                    "can_challenge": True,
                    "rag_enabled": True,
                    "is_active": True,
                    "llm_model": "gpt-4-turbo",
                    "temperature": 0.7,
                    "max_tokens": 4096
                }
            )
        
        print(f"Successfully created {len(agents_data)} agents!")


if __name__ == "__main__":
    asyncio.run(seed_agents())
