from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from pydantic import BaseModel
import json
import logging

from api.auth import get_current_user
from agents.lead_mentor import get_orchestratorResponse
from core.config import settings

from core.metrics import record_gemini_usage, AGENT_LATENCY
import time

logger = logging.getLogger(__name__)
router = APIRouter()

class SimplifyRequest(BaseModel):
    text: str
    level: str = "basic"  # basic, intermediate, advanced
    language: str = "English"  # English, Hinglish

@router.post("/text")
async def simplify_text(req: SimplifyRequest, user: dict = Depends(get_current_user)):
    """
    Simplify a block of text using the SimplificationExpert sub-agent via LeadMentor.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    from services.semantic_cache import cache
    cached = cache.get_cached_response(req.text, req.level, req.language)
    if cached:
        return {"original": req.text, "simplified": cached, "cached": True}

    prompt = (
        f"I need you to simplify the following text at a '{req.level}' level "
        f"and provide the output primarily in {req.language}. "
        f"Please extract key concepts and give an intuitive analogy.\n\n"
        f"TEXT TO SIMPLIFY:\n{req.text}"
    )
    
    start_time = time.time()
    try:
        response = get_orchestratorResponse(user, prompt)
        duration = time.time() - start_time
        AGENT_LATENCY.labels(agent_name="SimplificationExpert").observe(duration)
        
        cache.update_cache(req.text, response, req.level, req.language)
        return {"original": req.text, "simplified": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def simplify_upload(
    file: UploadFile = File(...),
    level: str = "basic",
    language: str = "English",
    user: dict = Depends(get_current_user)
):
    """
    Accepts an uploaded textbook photo or PDF, uses Gemini to perform OCR 
    and simplify the content in one go.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="AI simplification is currently disabled.")

    try:
        contents = await file.read()
        mime_type = file.content_type
        
        if not mime_type.startswith("image/") and mime_type != "application/pdf" :
            raise HTTPException(status_code=400, detail="Only image and PDF files are supported.")

        # Try cache using content hash
        from services.semantic_cache import cache
        import hashlib
        content_hash = hashlib.md5(contents).hexdigest()
        cache_key = f"document:{content_hash}"
        cached = cache.get_cached_response(cache_key, level, language)
        if cached:
            return {"status": "success", "simplified": cached, "cached": True}

        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # System prompt for the OCR + Simplification task
        prompt = (
            f"You are the Sargvision Simplification Expert. I am attaching an image or PDF of a textbook page. "
            f"1. Extract all text from this document accurately (OCR).\n"
            f"2. Simplify the core concepts at a '{level}' level in {language}.\n"
            f"3. Provide: A summary, Key Concepts list, and an intuitive analogy (ELIF style).\n\n"
            "Format the output clearly using markdown."
        )

        start_time = time.time()
        response = model.generate_content(
            contents=[
                {"mime_type": mime_type, "data": contents}, 
                prompt
            ]
        )
        duration = time.time() - start_time
        
        # Record Metrics
        usage = response.usage_metadata
        record_gemini_usage("gemini-2.0-flash", usage.prompt_token_count, usage.candidates_token_count)
        AGENT_LATENCY.labels(agent_name="OCR_Simplifier").observe(duration)
        
        simplified_text = response.text.strip()
        cache.update_cache(cache_key, simplified_text, level, language)
        
        return {
            "status": "success",
            "simplified": simplified_text
        }

    except Exception as e:
        logger.exception("Failed to simplify document")
        raise HTTPException(status_code=500, detail=f"Could not process the document: {str(e)}")

@router.post("/notes")
async def simplify_notes(req: SimplifyRequest, user: dict = Depends(get_current_user)):
    """
    Generate structured study notes from a block of text.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    from services.semantic_cache import cache
    cached = cache.get_cached_response(f"notes:{req.text}", req.level, req.language)
    if cached:
        return {"original": req.text, "notes": cached, "cached": True}

    prompt = (
        f"Please generate structured study notes for the following text. "
        f"I need the output in {req.language} at a '{req.level}' level. "
        f"Follow the 'Structured Notes Generation' format from your skill definition.\n\n"
        f"TEXT FOR NOTES:\n{req.text}"
    )
    
    try:
        response = get_orchestratorResponse(user, prompt)
        cache.update_cache(f"notes:{req.text}", response, req.level, req.language)
        return {"original": req.text, "notes": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notes/upload")
async def simplify_notes_upload(
    file: UploadFile = File(...),
    level: str = "basic",
    language: str = "English",
    user: dict = Depends(get_current_user)
):
    """
    Generate study notes from an uploaded textbook scan or PDF.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="AI functionality is disabled.")

    try:
        contents = await file.read()
        mime_type = file.content_type
        
        if not mime_type.startswith("image/") and mime_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only image and PDF files are supported.")

        # Try cache
        from services.semantic_cache import cache
        import hashlib
        content_hash = hashlib.md5(contents).hexdigest()
        cache_key = f"notes:document:{content_hash}"
        cached = cache.get_cached_response(cache_key, level, language)
        if cached:
            return {"status": "success", "notes": cached, "cached": True}

        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = (
            f"You are the Sargvision Simplification Expert. I am attaching an image or PDF of a textbook page. "
            f"1. Extract all text accurately (OCR).\n"
            f"2. Generate structured study notes at a '{level}' level in {language}.\n"
            f"3. Format the notes with Summary, Key Definitions, Core Concepts, Practice Questions, and an Analogy."
        )

        response = model.generate_content(
            contents=[
                {"mime_type": mime_type, "data": contents}, 
                prompt
            ]
        )
        
        notes_text = response.text.strip()
        cache.update_cache(cache_key, notes_text, level, language)
        
        return {
            "status": "success",
            "notes": notes_text
        }

    except Exception as e:
        logger.exception("Failed to generate notes from document")
        raise HTTPException(status_code=500, detail=f"Could not process the document: {str(e)}")

@router.post("/roadmap")
async def simplify_roadmap(req: SimplifyRequest, user: dict = Depends(get_current_user)):
    """
    Generate a career roadmap mapping an academic concept to industry trajectories.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    from services.semantic_cache import cache
    cached = cache.get_cached_response(f"roadmap:{req.text}", req.level, req.language)
    if cached:
        return {"original": req.text, "roadmap": cached, "cached": True}

    prompt = (
        f"Please generate a Career Roadmap for the following topic: '{req.text}'. "
        f"Show how this academic concept connects to real-world roles in {req.language}. "
        f"Incorporate industry-specific skills and growth trajectories."
    )
    
    try:
        # We'll use the orchestrator to trigger the CareerPathExpert
        response = get_orchestratorResponse(user, prompt)
        cache.update_cache(f"roadmap:{req.text}", response, req.level, req.language)
        return {"original": req.text, "roadmap": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roadmap/upload")
async def simplify_roadmap_upload(
    file: UploadFile = File(...),
    level: str = "basic",
    language: str = "English",
    user: dict = Depends(get_current_user)
):
    """
    Generate a career roadmap from an uploaded document or image.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="AI functionality is disabled.")

    try:
        contents = await file.read()
        mime_type = file.content_type
        
        # Try cache
        from services.semantic_cache import cache
        import hashlib
        content_hash = hashlib.md5(contents).hexdigest()
        cache_key = f"roadmap:document:{content_hash}"
        cached = cache.get_cached_response(cache_key, level, language)
        if cached:
            return {"status": "success", "roadmap": cached, "cached": True}

        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = (
            f"You are the Sargvision Career Path Expert. I am attaching an image or PDF of a textbook page. "
            f"1. Identify the core academic concepts from this document.\n"
            f"2. Generate a Career Roadmap showing how these concepts lead to industry skills and job roles in {language}.\n"
            f"3. Include Growth Trajectory and Market Value notes."
        )

        response = model.generate_content(
            contents=[
                {"mime_type": mime_type, "data": contents}, 
                prompt
            ]
        )
        
        roadmap_text = response.text.strip()
        cache.update_cache(cache_key, roadmap_text, level, language)
        
        return {
            "status": "success",
            "roadmap": roadmap_text
        }

    except Exception as e:
        logger.exception("Failed to generate career roadmap")
        raise HTTPException(status_code=500, detail=f"Could not process the document: {str(e)}")

@router.get("/status")
async def get_status():
    return {"status": "Simplification Agent Online"}
