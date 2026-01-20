"""
Agent Registry.

Manages registration and retrieval of CXO domain agents.
"""

from typing import Dict, Type, Optional, List
import logging

from .base_agent import BaseAgent, AgentDomain

logger = logging.getLogger(__name__)


class AgentRegistry:
    """
    Registry for CXO domain agents.
    
    Allows dynamic registration and retrieval of agent classes.
    """
    
    def __init__(self):
        self._agents: Dict[str, Type[BaseAgent]] = {}
        self._instances: Dict[str, BaseAgent] = {}
    
    def register(self, name: Optional[str] = None):
        """
        Decorator to register an agent class.
        
        Usage:
            @agent_registry.register("CustomAgent")
            class CustomAgent(BaseAgent):
                ...
        """
        def decorator(cls: Type[BaseAgent]) -> Type[BaseAgent]:
            agent_name = name or cls.__name__
            if agent_name in self._agents:
                logger.warning(f"Agent {agent_name} already registered, overwriting")
            self._agents[agent_name] = cls
            logger.info(f"Registered agent: {agent_name}")
            return cls
        return decorator
    
    def get_agent_class(self, name: str) -> Optional[Type[BaseAgent]]:
        """Get an agent class by name."""
        return self._agents.get(name)
    
    def get_agent(
        self,
        name: str,
        tenant_id: str,
        agent_id: str,
        **kwargs
    ) -> Optional[BaseAgent]:
        """
        Get or create an agent instance.
        
        Args:
            name: Agent class name
            tenant_id: Tenant ID
            agent_id: Agent ID
            **kwargs: Additional arguments for agent initialization
            
        Returns:
            Agent instance or None if not found
        """
        instance_key = f"{tenant_id}:{name}:{agent_id}"
        
        if instance_key in self._instances:
            return self._instances[instance_key]
        
        agent_class = self._agents.get(name)
        if not agent_class:
            logger.error(f"Agent class not found: {name}")
            return None
        
        instance = agent_class(
            tenant_id=tenant_id,
            agent_id=agent_id,
            **kwargs
        )
        self._instances[instance_key] = instance
        return instance
    
    def get_agents_by_domain(self, domain: AgentDomain) -> List[Type[BaseAgent]]:
        """Get all agent classes for a domain."""
        return [
            cls for cls in self._agents.values()
            if cls.domain == domain
        ]
    
    def list_agents(self) -> List[str]:
        """List all registered agent names."""
        return list(self._agents.keys())
    
    def clear_instances(self, tenant_id: Optional[str] = None):
        """
        Clear cached agent instances.
        
        Args:
            tenant_id: If provided, only clear instances for this tenant
        """
        if tenant_id:
            self._instances = {
                k: v for k, v in self._instances.items()
                if not k.startswith(f"{tenant_id}:")
            }
        else:
            self._instances.clear()


# Global registry instance
agent_registry = AgentRegistry()
