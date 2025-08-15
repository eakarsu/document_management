"""
Configuration settings for AI services using OpenRouter API.
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings with OpenRouter AI integration."""
    
    # Application settings
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # OpenRouter API settings
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Model configurations for different tasks
    OCR_MODEL: str = os.getenv("OCR_MODEL", "anthropic/claude-3-haiku")
    CLASSIFICATION_MODEL: str = os.getenv("CLASSIFICATION_MODEL", "anthropic/claude-3-haiku")
    EXTRACTION_MODEL: str = os.getenv("EXTRACTION_MODEL", "anthropic/claude-3-sonnet")
    ANALYSIS_MODEL: str = os.getenv("ANALYSIS_MODEL", "anthropic/claude-3-sonnet")
    SUMMARY_MODEL: str = os.getenv("SUMMARY_MODEL", "openai/gpt-3.5-turbo")
    
    # Alternative models for different use cases
    FAST_MODEL: str = "openai/gpt-3.5-turbo"  # For quick tasks
    ACCURATE_MODEL: str = "anthropic/claude-3-opus"  # For complex analysis
    MULTIMODAL_MODEL: str = "openai/gpt-4-vision-preview"  # For image analysis
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://dms_user:dms_password@localhost:5432/dms_metadata")
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://dms_user:dms_password@localhost:27017/dms_documents")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Storage settings
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "dms_user")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "dms_password")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"
    
    # Processing limits
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_BATCH_SIZE: int = 10
    MAX_TEXT_LENGTH: int = 50000
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:4000",
        "https://your-domain.com"
    ]
    
    # OCR settings
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")
    SUPPORTED_LANGUAGES: List[str] = ["eng", "fra", "deu", "spa", "ita", "por", "rus", "chi_sim", "jpn", "ara"]
    
    # AI prompt templates
    CLASSIFICATION_PROMPT: str = """
    Analyze the following document content and classify it into appropriate categories.
    Consider the content type, subject matter, document purpose, and format.
    
    Content: {content}
    
    Please provide:
    1. Primary category (e.g., Legal, Financial, Technical, Medical, etc.)
    2. Secondary categories (subcategories)
    3. Document type (e.g., Contract, Invoice, Report, etc.)
    4. Confidence score (0-1)
    5. Suggested tags
    
    Respond in JSON format.
    """
    
    EXTRACTION_PROMPT: str = """
    Extract structured information from the following document content.
    Focus on key entities, dates, amounts, names, and other relevant data.
    
    Content: {content}
    Extraction Types: {extraction_types}
    
    Please extract:
    1. Named entities (persons, organizations, locations)
    2. Dates and times
    3. Monetary amounts
    4. Key phrases and terms
    5. Structured data (tables, lists)
    
    Respond in JSON format with confidence scores.
    """
    
    ANALYSIS_PROMPT: str = """
    Perform comprehensive analysis of the following document content.
    Provide insights, summaries, and actionable information.
    
    Content: {content}
    Analysis Types: {analysis_types}
    
    Please provide:
    1. Executive summary
    2. Key insights and findings
    3. Sentiment analysis
    4. Readability score
    5. Topic modeling
    6. Action items or recommendations
    
    Respond in JSON format.
    """
    
    SUMMARY_PROMPT: str = """
    Create a concise and comprehensive summary of the following document.
    Focus on the main points, key decisions, and important information.
    
    Content: {content}
    
    Please provide:
    1. Executive summary (2-3 sentences)
    2. Key points (bullet points)
    3. Important details
    4. Conclusions or outcomes
    
    Keep the summary clear and actionable.
    """
    
    @validator("OPENROUTER_API_KEY")
    def validate_api_key(cls, v):
        if not v and os.getenv("ENVIRONMENT") == "production":
            raise ValueError("OpenRouter API key is required in production")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()