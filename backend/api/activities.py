from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from services.gamification import add_xp_and_update_streak
import logging
import json
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class LogActivityRequest(BaseModel):
    type: str  # project | competition | event | internship | certification | extracurricular
    title: str
    detail: str
    academic_year: int  # e.g. 1, 2, 3, 4
    semester: Optional[int] = None  # 1 or 2
    date: Optional[str] = None
    relevance_path_ids: Optional[List[str]] = []

    model_config = {"populate_by_name": True}

    def normalised_type(self) -> str:
        """Map legacy label names to the DB check constraint values."""
        mapping = {
            "achievement": "competition",
            "course": "certification",
            "award": "competition",
        }
        return mapping.get(self.type, self.type)




@router.get("")
async def list_activities(user: dict = Depends(get_current_user)):
    """List all activities for the current user, ordered by date descending."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    res = (
        db.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"activities": res.data or []}


@router.post("")
async def log_activity(body: LogActivityRequest, user: dict = Depends(get_current_user)):
    """Log a new activity for the current user."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    data = {
        "user_id": user_id,
        "type": body.normalised_type(),
        "title": body.title,
        "details_json": {"detail": body.detail},
        "academic_year": body.academic_year,
        "semester": body.semester,
        "date": body.date,
        "relevance_path_ids": body.relevance_path_ids or [],
    }

    res = db.table("activities").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log activity")
        
    # Award XP for logging an activity
    try:
        xp_res = add_xp_and_update_streak(db, user_id, "activity_logged")
    except Exception as e:
        logger.exception("Failed to award XP for activity log")
        xp_res = {}

    return {"activity": res.data[0], "gamification": xp_res}


@router.post("/extract-certificate")
async def extract_certificate(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Accepts an uploaded certificate image or PDF, uses Gemini 2.0 Flash to 
    extract the details, and returns JSON matching the LogActivityRequest schema.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="AI extraction is currently disabled.")

    try:
        contents = await file.read()
        mime_type = file.content_type
        
        # We only support basic image formats and PDFs for now
        if not mime_type.startswith("image/") and mime_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only image and PDF files are supported.")

        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Give Gemini the binary file data
        prompt = (
            "You are an AI assistant that extracts data from academic and professional certificates.\n"
            "Analyze the attached document and return a JSON object with the following fields:\n\n"
            "1. `title`: The name of the course, competition, or achievement.\n"
            "2. `type`: Categorize it strictly as one of: [\"certification\", \"competition\", \"internship\", \"project\", \"event\", \"extracurricular\"]\n"
            "3. `detail`: A 2-sentence summary including the issuing organization, date of issue (if visible), and what the award/certificate was for.\n\n"
            "Return ONLY the JSON object."
        )

        response = model.generate_content(
            contents=[
                {"mime_type": mime_type, "data": contents}, 
                prompt
            ]
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]
            
        extracted_data = json.loads(raw_text.strip())
        
        # Clean up the output to match our exact required schema
        return {
            "status": "success",
            "extracted": {
                "title": extracted_data.get("title", "Unknown Certificate"),
                "type": extracted_data.get("type", "certification"),
                "detail": extracted_data.get("detail", "Certificate details successfully extracted."),
                # We default these to sensible safe values so the frontend form loads cleanly
                "academic_year": 1,
                "semester": 1,
                "relevance_path_ids": []
            }
        }

    except Exception as e:
        logger.exception("Failed to extract certificate details")
        raise HTTPException(status_code=500, detail="Could not process the certificate using AI.")
