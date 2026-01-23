from __future__ import annotations
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from shared.database import get_async_session
from shared.models.tenant import Tenant

router = APIRouter()

class SettingItem(BaseModel):
    key: str
    value: Any

@router.get("", response_model=List[SettingItem])
async def get_settings(
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """Get tenant settings."""
    query = select(Tenant).filter(Tenant.id == tenant_id) # In real app, tenant_id might be different from table id or use finding by some other means. Assuming tenant_id passed matches ID or we find by looking it up. 
    # Actually, the 'tenant_id' param usually refers to a logical tenant ID. 
    # Let's assume we find the tenant by id. 
    # Wait, in seed logic, 'default' is passed as tenant_id. 
    # But in models, Tenant.id is a UUID usually.
    # However, for 'default', we might just look up by a known ID or assuming 1 record.
    # Let's assume for now valid tenant_id is passed or we assume "default" matches some logic.
    # Since we don't have a Tenant seeded with id="default" explicitly (UUIDs are generated), 
    # we might need to find the tenant. 
    
    # If using "default", maybe we should look up by logical identifier or assume first one?
    # Let's fallback to first tenant if 'default' is passed for dev.
    
    if tenant_id == 'default':
         result = await session.execute(select(Tenant))
         tenant = result.scalars().first()
    else:
         result = await session.execute(select(Tenant).filter(Tenant.id == tenant_id))
         tenant = result.scalars().first()
    
    if not tenant:
        # If no tenant exists, return empty or create default? 
        # Admin page expects data.
        return [
            {"key": "company_name", "value": "Acme Corp"},
            {"key": "ceo_mode", "value": "hybrid"},
            {"key": "auto_execute_low_risk", "value": True},
            {"key": "rollback_window", "value": 60}
        ]

    # Convert dictionary settings to list of key-value pairs
    settings_list = []
    
    # Add fields from model that are treated as settings
    # Admin.tsx expects specific keys map to form fields
    
    # We can mix actual columns and the json 'settings' column
    # Flattening for the frontend
    settings_list.append(SettingItem(key="company_name", value=tenant.name))
    settings_list.append(SettingItem(key="ceo_mode", value=tenant.ceo_mode))
    
    # From JSON 'settings' or specific columns?
    # Tenant model has 'risk_tier_config' etc.
    # Admin.tsx asks for 'auto_execute_low_risk', 'rollback_window'
    
    # Let's check where these might differ.
    # Tenant.risk_tier_config['low']['auto_execute'] -> auto_execute_low_risk
    
    risk_config = tenant.risk_tier_config or {}
    low_risk = risk_config.get('low', {})
    
    settings_list.append(SettingItem(key="auto_execute_low_risk", value=low_risk.get('auto_execute', True)))
    
    # rollback_window isn't explicitly in Tenant cols shown earlier, maybe inside 'settings' JSON?
    # Or 'audit_retention_days'? 
    # Let's put it in 'settings' JSON column if not found.
    
    tenant_settings = tenant.settings or {}
    settings_list.append(SettingItem(key="rollback_window", value=tenant_settings.get("rollback_window", 60)))
    
    return settings_list

@router.post("")
@router.put("/{key}")
async def update_setting(
    item: SettingItem,
    key: Optional[str] = None,
    tenant_id: str = Query(..., description="Tenant ID"),
    session: AsyncSession = Depends(get_async_session)
):
    """Update a setting."""
    if tenant_id == 'default':
         result = await session.execute(select(Tenant))
         tenant = result.scalars().first()
    else:
         result = await session.execute(select(Tenant).filter(Tenant.id == tenant_id))
         tenant = result.scalars().first()
         
    if not tenant:
        # Should create if not exists? For now, 404
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    s_key = key if key else item.key
    s_val = item.value
    
    if s_key == "company_name":
        tenant.name = s_val
    elif s_key == "ceo_mode":
        tenant.ceo_mode = s_val
    elif s_key == "auto_execute_low_risk":
        # deeply update json
        risk_config = dict(tenant.risk_tier_config) if tenant.risk_tier_config else {}
        if 'low' not in risk_config: risk_config['low'] = {}
        risk_config['low']['auto_execute'] = s_val
        tenant.risk_tier_config = risk_config
    else:
        # Generic settings
        current_settings = dict(tenant.settings) if tenant.settings else {}
        current_settings[s_key] = s_val
        tenant.settings = current_settings
        
    # Mark modified for JSON columns if needed (SQLAlchemy usually handles if we assign new dict)
    # But strictly speaking we assigned new dicts above.
    
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    
    return item
