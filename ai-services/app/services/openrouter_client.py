"""
OpenRouter API client for AI services integration.
Provides a unified interface for accessing multiple AI models through OpenRouter.
"""

import json
import time
from typing import Dict, List, Optional, Any, AsyncGenerator
import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings

logger = structlog.get_logger(__name__)


class OpenRouterClient:
    """Client for interacting with OpenRouter API."""
    
    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://dms.yourdomain.com",
                "X-Title": "Document Management System",
                "Content-Type": "application/json"
            },
            timeout=120.0
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )
    async def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenRouter.
        
        Args:
            model: Model identifier (e.g., "anthropic/claude-3-haiku")
            messages: List of message objects with role and content
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            stream: Whether to stream the response
            **kwargs: Additional parameters
            
        Returns:
            API response dictionary
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": stream,
                **kwargs
            }
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
            
            logger.info("Sending OpenRouter request", model=model, message_count=len(messages))
            
            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()
            
            result = response.json()
            
            # Log usage information
            if "usage" in result:
                usage = result["usage"]
                logger.info("OpenRouter response received", 
                           model=model,
                           prompt_tokens=usage.get("prompt_tokens"),
                           completion_tokens=usage.get("completion_tokens"),
                           total_tokens=usage.get("total_tokens"))
            
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error("OpenRouter API error", status_code=e.response.status_code, error=e.response.text)
            raise
        except Exception as e:
            logger.error("OpenRouter request failed", error=str(e), model=model)
            raise
    
    async def stream_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream a chat completion response from OpenRouter.
        
        Args:
            model: Model identifier
            messages: List of message objects
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            **kwargs: Additional parameters
            
        Yields:
            Streaming response chunks
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
                **kwargs
            }
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
            
            logger.info("Starting OpenRouter stream", model=model)
            
            async with self.client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        
                        if data.strip() == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data)
                            yield chunk
                        except json.JSONDecodeError:
                            continue
                            
        except httpx.HTTPStatusError as e:
            logger.error("OpenRouter stream error", status_code=e.response.status_code, error=e.response.text)
            raise
        except Exception as e:
            logger.error("OpenRouter stream failed", error=str(e), model=model)
            raise
    
    async def get_models(self) -> List[Dict[str, Any]]:
        """Get available models from OpenRouter."""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            
            models_data = response.json()
            return models_data.get("data", [])
            
        except Exception as e:
            logger.error("Failed to get models", error=str(e))
            raise
    
    async def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific model."""
        try:
            models = await self.get_models()
            for model in models:
                if model.get("id") == model_id:
                    return model
            return None
            
        except Exception as e:
            logger.error("Failed to get model info", error=str(e), model=model_id)
            raise
    
    def format_messages(self, system_prompt: str, user_content: str) -> List[Dict[str, str]]:
        """Format messages for OpenRouter API."""
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": user_content
        })
        
        return messages
    
    async def classify_content(
        self,
        content: str,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Classify document content using AI."""
        model = model or settings.CLASSIFICATION_MODEL
        prompt = custom_prompt or settings.CLASSIFICATION_PROMPT.format(content=content)
        
        messages = self.format_messages(
            system_prompt="You are a document classification expert. Analyze documents and provide structured classification results in JSON format.",
            user_content=prompt
        )
        
        response = await self.chat_completion(
            model=model,
            messages=messages,
            temperature=0.3,  # Lower temperature for more consistent classification
            max_tokens=2000
        )
        
        # Extract and parse the response
        content_result = response["choices"][0]["message"]["content"]
        
        try:
            # Try to parse as JSON
            result = json.loads(content_result)
        except json.JSONDecodeError:
            # If not JSON, return as text with basic structure
            result = {
                "primary_category": "Unknown",
                "secondary_categories": [],
                "document_type": "Unknown",
                "confidence": 0.5,
                "tags": [],
                "raw_response": content_result
            }
        
        return result
    
    async def extract_information(
        self,
        content: str,
        extraction_types: List[str],
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Extract structured information from content."""
        model = model or settings.EXTRACTION_MODEL
        prompt = custom_prompt or settings.EXTRACTION_PROMPT.format(
            content=content,
            extraction_types=", ".join(extraction_types)
        )
        
        messages = self.format_messages(
            system_prompt="You are an information extraction expert. Extract structured data from documents and provide results in JSON format.",
            user_content=prompt
        )
        
        response = await self.chat_completion(
            model=model,
            messages=messages,
            temperature=0.2,  # Very low temperature for consistent extraction
            max_tokens=3000
        )
        
        content_result = response["choices"][0]["message"]["content"]
        
        try:
            result = json.loads(content_result)
        except json.JSONDecodeError:
            result = {
                "entities": [],
                "dates": [],
                "amounts": [],
                "key_phrases": [],
                "structured_data": {},
                "raw_response": content_result
            }
        
        return result
    
    async def analyze_content(
        self,
        content: str,
        analysis_types: List[str],
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Perform comprehensive content analysis."""
        model = model or settings.ANALYSIS_MODEL
        prompt = custom_prompt or settings.ANALYSIS_PROMPT.format(
            content=content,
            analysis_types=", ".join(analysis_types)
        )
        
        messages = self.format_messages(
            system_prompt="You are a document analysis expert. Provide comprehensive analysis and insights in JSON format.",
            user_content=prompt
        )
        
        response = await self.chat_completion(
            model=model,
            messages=messages,
            temperature=0.5,  # Moderate temperature for balanced analysis
            max_tokens=4000
        )
        
        content_result = response["choices"][0]["message"]["content"]
        
        try:
            result = json.loads(content_result)
        except json.JSONDecodeError:
            result = {
                "summary": "Analysis unavailable",
                "insights": [],
                "sentiment": "neutral",
                "readability": 0.5,
                "topics": [],
                "recommendations": [],
                "raw_response": content_result
            }
        
        return result
    
    async def summarize_content(
        self,
        content: str,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None,
        max_length: Optional[int] = None
    ) -> str:
        """Generate a summary of the content."""
        model = model or settings.SUMMARY_MODEL
        prompt = custom_prompt or settings.SUMMARY_PROMPT.format(content=content)
        
        messages = self.format_messages(
            system_prompt="You are a professional document summarizer. Create clear, concise, and comprehensive summaries.",
            user_content=prompt
        )
        
        max_tokens = max_length or 1000
        
        response = await self.chat_completion(
            model=model,
            messages=messages,
            temperature=0.4,
            max_tokens=max_tokens
        )
        
        return response["choices"][0]["message"]["content"]