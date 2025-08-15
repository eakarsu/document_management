"""
Document classification service using OpenRouter AI models.
Provides intelligent document categorization and tagging.
"""

from typing import Dict, List, Optional, Any
import structlog

from .openrouter_client import OpenRouterClient
from ..config import settings

logger = structlog.get_logger(__name__)


class ClassificationService:
    """Service for AI-powered document classification."""
    
    def __init__(self):
        self.openrouter_client = None
        self.model = settings.CLASSIFICATION_MODEL
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize the classification service."""
        try:
            self.openrouter_client = OpenRouterClient()
            
            # Test the connection
            await self.openrouter_client.get_models()
            
            self.is_initialized = True
            logger.info("Classification service initialized", model=self.model)
            
        except Exception as e:
            logger.error("Failed to initialize classification service", error=str(e))
            raise
    
    async def classify_content(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Classify document content into categories and tags.
        
        Args:
            content: Document content to classify
            metadata: Additional document metadata
            
        Returns:
            Classification results including categories, tags, and confidence scores
        """
        try:
            if not self.is_initialized:
                raise ValueError("Classification service not initialized")
            
            logger.info("Starting document classification", content_length=len(content))
            
            # Prepare classification prompt
            classification_prompt = self._build_classification_prompt(content, metadata)
            
            # Use OpenRouter client for classification
            result = await self.openrouter_client.classify_content(
                content=classification_prompt,
                model=self.model
            )
            
            # Enhance results with additional processing
            enhanced_result = await self._enhance_classification_result(result, content, metadata)
            
            logger.info("Document classification completed", 
                       primary_category=enhanced_result.get("primary_category"),
                       confidence=enhanced_result.get("confidence"))
            
            return enhanced_result
            
        except Exception as e:
            logger.error("Document classification failed", error=str(e))
            raise
    
    async def batch_classify(
        self,
        documents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Classify multiple documents in batch.
        
        Args:
            documents: List of document dictionaries with 'content' and optional 'metadata'
            
        Returns:
            List of classification results
        """
        try:
            logger.info("Starting batch classification", document_count=len(documents))
            
            results = []
            for i, doc in enumerate(documents):
                try:
                    result = await self.classify_content(
                        content=doc.get("content", ""),
                        metadata=doc.get("metadata")
                    )
                    result["document_index"] = i
                    results.append(result)
                    
                except Exception as e:
                    logger.error("Failed to classify document in batch", 
                               document_index=i, error=str(e))
                    results.append({
                        "document_index": i,
                        "error": str(e),
                        "success": False
                    })
            
            logger.info("Batch classification completed", 
                       total_documents=len(documents),
                       successful_classifications=len([r for r in results if r.get("success", True)]))
            
            return results
            
        except Exception as e:
            logger.error("Batch classification failed", error=str(e))
            raise
    
    def _build_classification_prompt(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a comprehensive classification prompt."""
        
        prompt_parts = [
            "Analyze and classify the following document content:",
            f"\nCONTENT:\n{content[:5000]}{'...' if len(content) > 5000 else ''}"
        ]
        
        if metadata:
            prompt_parts.append(f"\nMETADATA:\n{metadata}")
        
        prompt_parts.extend([
            "\nPlease provide a comprehensive classification analysis in JSON format with:",
            "1. primary_category: Main document category (Legal, Financial, Technical, Medical, HR, Marketing, etc.)",
            "2. secondary_categories: List of subcategories",
            "3. document_type: Specific document type (Contract, Invoice, Report, Manual, etc.)",
            "4. confidence: Confidence score (0.0 to 1.0)",
            "5. tags: Relevant tags and keywords (list of strings)",
            "6. subject_area: Subject matter or domain",
            "7. language: Primary language detected",
            "8. formality_level: Formal, Semi-formal, or Informal",
            "9. target_audience: Intended audience (Internal, External, Public, etc.)",
            "10. urgency_level: Low, Medium, High, or Critical",
            "11. sensitivity_level: Public, Internal, Confidential, or Restricted",
            "12. action_required: Whether the document requires action (boolean)",
            "13. key_topics: Main topics covered (list)",
            "14. industry_vertical: Relevant industry sector if applicable",
            "15. compliance_indicators: Regulatory or compliance relevance"
        ])
        
        return "\n".join(prompt_parts)
    
    async def _enhance_classification_result(
        self,
        base_result: Dict[str, Any],
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Enhance classification results with additional analysis."""
        
        enhanced_result = base_result.copy()
        
        # Ensure required fields exist with defaults
        enhanced_result.setdefault("primary_category", "Unknown")
        enhanced_result.setdefault("secondary_categories", [])
        enhanced_result.setdefault("document_type", "Document")
        enhanced_result.setdefault("confidence", 0.5)
        enhanced_result.setdefault("tags", [])
        enhanced_result.setdefault("subject_area", "General")
        enhanced_result.setdefault("language", "en")
        enhanced_result.setdefault("formality_level", "Formal")
        enhanced_result.setdefault("target_audience", "Internal")
        enhanced_result.setdefault("urgency_level", "Medium")
        enhanced_result.setdefault("sensitivity_level", "Internal")
        enhanced_result.setdefault("action_required", False)
        enhanced_result.setdefault("key_topics", [])
        enhanced_result.setdefault("industry_vertical", None)
        enhanced_result.setdefault("compliance_indicators", [])
        
        # Add processing metadata
        enhanced_result.update({
            "processing_info": {
                "model_used": self.model,
                "content_length": len(content),
                "processing_timestamp": None,  # Will be set by caller
                "version": "1.0"
            },
            "success": True
        })
        
        # Basic content analysis
        enhanced_result["content_analysis"] = {
            "word_count": len(content.split()),
            "character_count": len(content),
            "has_tables": "table" in content.lower() or "|" in content,
            "has_lists": any(marker in content for marker in ["•", "-", "1.", "2.", "3."]),
            "has_headers": any(char in content for char in ["#", "="]),
            "paragraph_count": len([p for p in content.split('\n\n') if p.strip()])
        }
        
        return enhanced_result
    
    async def get_supported_categories(self) -> Dict[str, List[str]]:
        """Get supported document categories and subcategories."""
        return {
            "Legal": [
                "Contracts", "Agreements", "Terms of Service", "Privacy Policy",
                "Legal Notices", "Court Documents", "Compliance Documents"
            ],
            "Financial": [
                "Invoices", "Receipts", "Financial Reports", "Budget Documents",
                "Tax Documents", "Audit Reports", "Banking Documents"
            ],
            "Technical": [
                "User Manuals", "Technical Specifications", "API Documentation",
                "System Requirements", "Installation Guides", "Troubleshooting"
            ],
            "Medical": [
                "Patient Records", "Medical Reports", "Treatment Plans",
                "Pharmaceutical Documents", "Medical Research", "Health Policies"
            ],
            "HR": [
                "Employee Handbooks", "Job Descriptions", "Performance Reviews",
                "Training Materials", "Policies", "Benefits Information"
            ],
            "Marketing": [
                "Marketing Plans", "Campaign Materials", "Product Brochures",
                "Press Releases", "Social Media Content", "Brand Guidelines"
            ],
            "Administrative": [
                "Memos", "Meeting Minutes", "Policies", "Procedures",
                "Administrative Forms", "Internal Communications"
            ],
            "Academic": [
                "Research Papers", "Thesis", "Course Materials", "Academic Reports",
                "Educational Content", "Scientific Publications"
            ],
            "Personal": [
                "Personal Documents", "Letters", "Notes", "Journals",
                "Personal Records", "Correspondence"
            ]
        }
    
    async def suggest_tags(self, content: str, category: Optional[str] = None) -> List[str]:
        """Suggest relevant tags for document content."""
        try:
            # Use a simpler prompt for tag suggestion
            tag_prompt = f"""
            Suggest 5-10 relevant tags for the following document content:
            
            Content: {content[:2000]}{'...' if len(content) > 2000 else ''}
            Category: {category or 'Unknown'}
            
            Provide only a JSON array of tag strings, focusing on:
            - Key topics and themes
            - Document purpose
            - Subject matter
            - Relevant keywords
            
            Example: ["contract", "legal", "agreement", "terms", "commercial"]
            """
            
            async with OpenRouterClient() as client:
                messages = client.format_messages(
                    system_prompt="You are a document tagging expert. Generate relevant tags as JSON arrays.",
                    user_content=tag_prompt
                )
                
                response = await client.chat_completion(
                    model=settings.FAST_MODEL,  # Use faster model for tag suggestions
                    messages=messages,
                    temperature=0.3,
                    max_tokens=200
                )
                
                content_result = response["choices"][0]["message"]["content"]
                
                # Try to parse as JSON array
                try:
                    import json
                    tags = json.loads(content_result)
                    if isinstance(tags, list):
                        return [str(tag) for tag in tags[:10]]  # Limit to 10 tags
                except:
                    pass
                
                # Fallback: extract tags from text
                return self._extract_tags_from_text(content_result)
                
        except Exception as e:
            logger.error("Tag suggestion failed", error=str(e))
            return []
    
    def _extract_tags_from_text(self, text: str) -> List[str]:
        """Extract tags from text when JSON parsing fails."""
        import re
        
        # Look for quoted strings or comma-separated values
        patterns = [
            r'"([^"]+)"',  # Quoted strings
            r"'([^']+)'",  # Single quoted strings
            r'(\w+(?:\s+\w+)?)'  # Words and two-word phrases
        ]
        
        tags = set()
        for pattern in patterns:
            matches = re.findall(pattern, text)
            tags.update([match.lower().strip() for match in matches if len(match) > 2])
        
        return list(tags)[:10]  # Return up to 10 tags