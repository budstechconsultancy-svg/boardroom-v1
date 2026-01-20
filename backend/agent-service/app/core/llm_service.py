"""
LLM Service.

Handles interactions with LLM providers (OpenAI, Azure, etc.).
"""

import json
import logging
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI
from pydantic import BaseModel

import sys
sys.path.insert(0, "../..")
from shared.config import settings

logger = logging.getLogger(__name__)


class LLMMessage(BaseModel):
    """A message in an LLM conversation."""
    
    role: str  # system, user, assistant
    content: str


class LLMResponse(BaseModel):
    """Response from LLM."""
    
    content: str
    model: str
    usage: Dict[str, int]
    raw_response: Optional[Dict[str, Any]] = None


class LLMService:
    """
    Service for LLM interactions.
    
    Supports OpenAI and Azure OpenAI with prompt logging for audit.
    """
    
    def __init__(self):
        self.provider = settings.llm.provider
        
        if self.provider == "openai":
            self.client = AsyncOpenAI(api_key=settings.llm.openai_api_key)
            self.model = settings.llm.openai_model
        elif self.provider == "azure":
            from openai import AsyncAzureOpenAI
            self.client = AsyncAzureOpenAI(
                api_key=settings.llm.azure_api_key,
                azure_endpoint=settings.llm.azure_endpoint,
            )
            self.model = settings.llm.azure_deployment
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def complete(
        self,
        messages: List[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_mode: bool = False,
        tenant_id: Optional[str] = None,
        audit_context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """
        Generate a completion from the LLM.
        
        Args:
            messages: List of conversation messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            json_mode: Whether to force JSON output
            tenant_id: Tenant ID for audit logging
            audit_context: Additional context for audit
            
        Returns:
            LLMResponse with generated content
        """
        # Prepare messages
        formatted_messages = [
            {"role": m.role, "content": m.content}
            for m in messages
        ]
        
        # Build request kwargs
        kwargs = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        # Log request for audit (will be encrypted)
        logger.debug(f"LLM request: {len(messages)} messages, temp={temperature}")
        
        try:
            response = await self.client.chat.completions.create(**kwargs)
            
            result = LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                raw_response=response.model_dump() if audit_context else None
            )
            
            return result
            
        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            raise
    
    async def generate_structured(
        self,
        messages: List[LLMMessage],
        schema: Dict[str, Any],
        temperature: float = 0.5,
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate structured output matching a schema.
        
        Args:
            messages: Conversation messages
            schema: JSON schema for expected output
            temperature: Sampling temperature
            tenant_id: Tenant ID for audit
            
        Returns:
            Parsed JSON matching schema
        """
        # Add schema to system message
        schema_instruction = f"\nRespond with valid JSON matching this schema:\n{json.dumps(schema, indent=2)}"
        
        if messages and messages[0].role == "system":
            messages[0].content += schema_instruction
        else:
            messages.insert(0, LLMMessage(
                role="system",
                content=f"You are a helpful assistant. {schema_instruction}"
            ))
        
        response = await self.complete(
            messages=messages,
            temperature=temperature,
            json_mode=True,
            tenant_id=tenant_id
        )
        
        try:
            return json.loads(response.content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise ValueError(f"Invalid JSON response from LLM: {e}")


class EmbeddingService:
    """
    Service for generating embeddings.
    """
    
    def __init__(self):
        self.provider = settings.llm.provider
        
        if self.provider in ["openai", "azure"]:
            self.client = AsyncOpenAI(api_key=settings.llm.openai_api_key)
            self.model = settings.llm.openai_embedding_model
    
    async def embed(
        self,
        texts: List[str],
        tenant_id: Optional[str] = None
    ) -> List[List[float]]:
        """
        Generate embeddings for texts.
        
        Args:
            texts: List of texts to embed
            tenant_id: Tenant ID for tracking
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        response = await self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        
        return [item.embedding for item in response.data]
    
    async def embed_single(
        self,
        text: str,
        tenant_id: Optional[str] = None
    ) -> List[float]:
        """Embed a single text."""
        embeddings = await self.embed([text], tenant_id)
        return embeddings[0] if embeddings else []


# Service instances
llm_service = LLMService()
embedding_service = EmbeddingService()
