from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from agents.lead_mentor import get_orchestratorResponse

router = APIRouter()

class ExamTrackRequest(BaseModel):
    exam_type: str
    target_date: date
    attempt_number: Optional[int] = 1

@router.get("/")
async def get_user_exams(user: dict = Depends(get_current_user)):
    """Fetches all government exams being tracked by the user."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    res = db.table("user_exams").select("*").eq("user_id", user_id).order("target_date").execute()
    return {"exams": res.data or []}

@router.post("/track")
async def track_exam(req: ExamTrackRequest, user: dict = Depends(get_current_user)):
    """Adds a new government exam to the user's tracking list."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    data = {
        "user_id": user_id,
        "exam_type": req.exam_type,
        "target_date": str(req.target_date),
        "attempt_number": req.attempt_number,
        "status": "preparing"
    }
    
    res = db.table("user_exams").upsert(data, on_conflict="user_id,exam_type,target_date").execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to track exam")
        
    return res.data[0]

@router.post("/{exam_id}/syllabus")
async def generate_syllabus(exam_id: str, user: dict = Depends(get_current_user)):
    """Triggers the GovExamExpert to generate/update a structured syllabus for the exam."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    # 1. Fetch exam details
    exam_res = db.table("user_exams").select("*").eq("id", exam_id).eq("user_id", user_id).single().execute()
    if not exam_res.data:
        raise HTTPException(status_code=404, detail="Exam tracking not found")
        
    exam = exam_res.data
    exam_type = exam["exam_type"]
    
    # 2. Ask LeadMentor (who will delegate to GovExamExpert) for a structured breakdown
    prompt = f"Generate a detailed, subject-wise syllabus breakdown for {exam_type}. Format it as a JSON list of objects strictly: [{{'subject': '...', 'topics': ['...', '...'], 'weightage': 'high/medium/low'}}]"
    
    # We use a specialized hint to force JSON output from the agent
    system_hint = "CRITICAL: You are acting for the Syllabus Generator. You MUST return ONLY a raw JSON array of syllabus components. No conversational text."
    
    reply = await get_orchestratorResponse({"user_id": user_id, "token": user["token"]}, prompt, system_hint=system_hint)
    
    try:
        # Clean the reply if it has markdown blocks
        clean_reply = reply.replace("```json", "").replace("```", "").strip()
        syllabus_json = __import__("json").loads(clean_reply)
        
        # 3. Update the database
        update_res = db.table("user_exams").update({"syllabus_progress_json": syllabus_json}).eq("id", exam_id).execute()
        return {"syllabus": syllabus_json}
    except Exception as e:
        return {"error": "Failed to parse syllabus", "raw_reply": reply}
