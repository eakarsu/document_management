"""
FastAPI application for AI-powered document processing services.
Provides OCR, classification, content extraction, and analysis capabilities.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import structlog

from app.config import settings
from app.database import init_db, close_db
from app.models import (
    OCRRequest, OCRResponse,
    ClassificationRequest, ClassificationResponse,
    ExtractionRequest, ExtractionResponse,
    AnalysisRequest, AnalysisResponse,
    HealthResponse
)
from app.services.ocr_service import OCRService
from app.services.classification_service import ClassificationService
from app.services.extraction_service import ExtractionService
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService
from app.utils.auth import verify_token
from app.utils.rate_limiter import RateLimiter

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Global service instances
ocr_service = None
classification_service = None
extraction_service = None
analysis_service = None
document_service = None
rate_limiter = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    global ocr_service, classification_service, extraction_service, analysis_service, document_service, rate_limiter
    
    try:
        # Startup
        logger.info("Starting AI services application")
        
        # Initialize database connections
        await init_db()
        
        # Initialize services
        ocr_service = OCRService()
        classification_service = ClassificationService()
        extraction_service = ExtractionService()
        analysis_service = AnalysisService()
        document_service = DocumentService()
        rate_limiter = RateLimiter()
        
        # Load ML models
        await asyncio.gather(
            ocr_service.initialize(),
            classification_service.initialize(),
            extraction_service.initialize(),
            analysis_service.initialize()
        )
        
        logger.info("AI services initialized successfully")
        yield
        
    except Exception as e:
        logger.error("Failed to start AI services", error=str(e))
        raise
    finally:
        # Shutdown
        logger.info("Shutting down AI services")
        await close_db()

# Create FastAPI application
app = FastAPI(
    title="Document Management System - AI Services",
    description="AI-powered document processing services including OCR, classification, and analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Dependency for getting services
async def get_ocr_service() -> OCRService:
    return ocr_service

async def get_classification_service() -> ClassificationService:
    return classification_service

async def get_extraction_service() -> ExtractionService:
    return extraction_service

async def get_analysis_service() -> AnalysisService:
    return analysis_service

async def get_document_service() -> DocumentService:
    return document_service

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "ocr": "ready" if ocr_service else "not_ready",
            "classification": "ready" if classification_service else "not_ready",
            "extraction": "ready" if extraction_service else "not_ready",
            "analysis": "ready" if analysis_service else "not_ready",
        }
    )

# OCR Endpoints
@app.post("/ocr/process", response_model=OCRResponse)
async def process_ocr(
    file: UploadFile = File(...),
    language: str = "eng",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    ocr_svc: OCRService = Depends(get_ocr_service),
    current_user=Depends(verify_token),
    _rate_limit=Depends(lambda: rate_limiter.check_rate_limit)
):
    """
    Process document with OCR to extract text content.
    Supports multiple languages and formats.
    """
    try:
        logger.info("Processing OCR request", filename=file.filename, language=language)
        
        # Validate file
        if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp')):
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        # Read file content
        file_content = await file.read()
        
        # Process OCR
        result = await ocr_svc.process_document(
            file_content=file_content,
            filename=file.filename,
            language=language
        )
        
        # Log processing in background
        background_tasks.add_task(
            document_service.log_processing,
            user_id=current_user["user_id"],
            filename=file.filename,
            processing_type="OCR",
            result=result
        )
        
        return result
        
    except Exception as e:
        logger.error("OCR processing failed", error=str(e), filename=file.filename)
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/ocr/batch", response_model=List[OCRResponse])
async def process_ocr_batch(
    files: List[UploadFile] = File(...),
    language: str = "eng",
    background_tasks: BackgroundTasks = BackgroundTasks(),
    ocr_svc: OCRService = Depends(get_ocr_service),
    current_user=Depends(verify_token),
    _rate_limit=Depends(lambda: rate_limiter.check_rate_limit)
):
    """Process multiple documents with OCR in parallel."""
    try:
        logger.info("Processing batch OCR request", file_count=len(files), language=language)
        
        # Validate file count
        if len(files) > settings.MAX_BATCH_SIZE:
            raise HTTPException(status_code=400, detail=f"Too many files. Maximum {settings.MAX_BATCH_SIZE} allowed")
        
        # Process files in parallel
        tasks = []
        for file in files:
            file_content = await file.read()
            task = ocr_svc.process_document(
                file_content=file_content,
                filename=file.filename,
                language=language
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions and create response
        responses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error("Batch OCR item failed", error=str(result), filename=files[i].filename)
                responses.append(OCRResponse(
                    success=False,
                    error=str(result),
                    filename=files[i].filename
                ))
            else:
                responses.append(result)
        
        # Log batch processing in background
        background_tasks.add_task(
            document_service.log_batch_processing,
            user_id=current_user["user_id"],
            filenames=[f.filename for f in files],
            processing_type="OCR_BATCH",
            results=responses
        )
        
        return responses
        
    except Exception as e:
        logger.error("Batch OCR processing failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Batch OCR processing failed: {str(e)}")

# Classification Endpoints
@app.post("/classify/document", response_model=ClassificationResponse)
async def classify_document(
    request: ClassificationRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    classification_svc: ClassificationService = Depends(get_classification_service),
    current_user=Depends(verify_token),
    _rate_limit=Depends(lambda: rate_limiter.check_rate_limit)
):
    """Classify document content using AI models."""
    try:
        logger.info("Processing classification request", document_id=request.document_id)
        
        result = await classification_svc.classify_content(
            content=request.content,
            metadata=request.metadata
        )
        
        # Log processing in background
        background_tasks.add_task(
            document_service.log_processing,
            user_id=current_user["user_id"],
            document_id=request.document_id,
            processing_type="CLASSIFICATION",
            result=result
        )
        
        return result
        
    except Exception as e:
        logger.error("Classification failed", error=str(e), document_id=request.document_id)
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

# Content Extraction Endpoints
@app.post("/extract/content", response_model=ExtractionResponse)
async def extract_content(
    request: ExtractionRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    extraction_svc: ExtractionService = Depends(get_extraction_service),
    current_user=Depends(verify_token),
    _rate_limit=Depends(lambda: rate_limiter.check_rate_limit)
):
    """Extract structured information from document content."""
    try:
        logger.info("Processing content extraction", document_id=request.document_id)
        
        result = await extraction_svc.extract_information(
            content=request.content,
            extraction_types=request.extraction_types,
            metadata=request.metadata
        )
        
        # Log processing in background
        background_tasks.add_task(
            document_service.log_processing,
            user_id=current_user["user_id"],
            document_id=request.document_id,
            processing_type="EXTRACTION",
            result=result
        )
        
        return result
        
    except Exception as e:
        logger.error("Content extraction failed", error=str(e), document_id=request.document_id)
        raise HTTPException(status_code=500, detail=f"Content extraction failed: {str(e)}")

# Analysis Endpoints
@app.post("/analyze/document", response_model=AnalysisResponse)
async def analyze_document(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    analysis_svc: AnalysisService = Depends(get_analysis_service),
    current_user=Depends(verify_token),
    _rate_limit=Depends(lambda: rate_limiter.check_rate_limit)
):
    """Perform comprehensive analysis of document content."""
    try:
        logger.info("Processing document analysis", document_id=request.document_id)
        
        result = await analysis_svc.analyze_content(
            content=request.content,
            analysis_types=request.analysis_types,
            metadata=request.metadata
        )
        
        # Log processing in background
        background_tasks.add_task(
            document_service.log_processing,
            user_id=current_user["user_id"],
            document_id=request.document_id,
            processing_type="ANALYSIS",
            result=result
        )
        
        return result
        
    except Exception as e:
        logger.error("Document analysis failed", error=str(e), document_id=request.document_id)
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error("HTTP exception", status_code=exc.status_code, detail=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unexpected error", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4,
        log_level="info"
    )