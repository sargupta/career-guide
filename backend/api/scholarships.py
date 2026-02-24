from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from agents.lead_mentor import get_orchestratorResponse

router = APIRouter()

class TrackScholarshipRequest(BaseModel):
    scholarship_name: str
    provider: str
    financial_benefit: Optional[str] = None
    deadline: Optional[str] = None

@router.get("/matches")
async def get_scholarship_matches(user: dict = Depends(get_current_user)):
    """Finds personalized scholarship aid using the ScholarshipRadar agent."""
    user_id = user["user_id"]
    token = user["token"]
    
    # 1. Fetch user profile for context (income, academic status)
    db = get_supabase_anon(token)
    profile_res = db.table("profiles").select("*, academic_enrollments(*)").eq("user_id", user_id).single().execute()
    profile = profile_res.data or {}
    
    # 2. Ask LeadMentor/ScholarshipRadar for matches
    prompt = "Find 3-5 currently active scholarships or CSR grants for an Indian student with this profile. Format results as JSON list: [{'name': '...', 'provider': '...', 'benefit': '...', 'deadline': '...', 'eligibility': '...'}]"
    
    system_hint = "CRITICAL: Return ONLY a raw JSON array of scholarship objects. No conversational text."
    
    reply = await get_orchestratorResponse(profile, prompt, system_hint=system_hint)
    
    try:
        clean_reply = reply.replace("```json", "").replace("```", "").strip()
        matches = __import__("json").loads(clean_reply)
        return {"matches": matches}
    except Exception as e:
        return {"error": "Failed to parse matches", "raw_reply": reply}

@router.get("/tracked")
async def get_tracked_scholarships(user: dict = Depends(get_current_user)):
    """Returns scholarships currently tracked by the user."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    res = db.table("user_scholarships").select("*").eq("user_id", user_id).execute()
    return {"scholarships": res.data or []}

@router.post("/track")
async def track_scholarship(req: TrackScholarshipRequest, user: dict = Depends(get_current_user)):
    """Tracks a new scholarship opportunity."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    data = {
        "user_id": user_id,
        "scholarship_name": req.scholarship_name,
        "provider": req.provider,
        "financial_benefit": req.financial_benefit,
        "deadline": req.deadline,
        "eligibility_status": "pending"
    }
    
    res = db.table("user_scholarships").upsert(data, on_conflict="user_id,scholarship_name,deadline").execute()
    return res.data[0]

@router.post("/{sid}/audit")
async def audit_eligibility(sid: str, user: dict = Depends(get_current_user)):
    """Runs an AI audit of the student's profile against the scholarship requirements."""
    user_id = user["user_id"]
    token = user["token"]
    db = get_supabase_anon(token)
    
    # 1. Fetch scholarship and profile
    s_res = db.table("user_scholarships").select("*").eq("id", sid).eq("user_id", user_id).single().execute()
    p_res = db.table("profiles").select("*, academic_enrollments(*)").eq("user_id", user_id).single().execute()
    
    if not s_res.data:
        raise HTTPException(status_code=404, detail="Tracked scholarship not found")
        
    scholarship = s_res.data
    profile = p_res.data
    
    # 2. AI Audit
    prompt = f"Perform a detailed eligibility audit for the scholarship '{scholarship['scholarship_name']}' against this student profile. Format as JSON list: [{'criteria': '...', 'status': 'eligible/ineligible/unknown', 'notes': '...'}]"
    system_hint = "CRITICAL: Return ONLY a raw JSON array of audit criteria. No extra text."
    
    reply = await get_orchestratorResponse(profile, prompt, system_hint=system_hint)
    
    try:
        clean_reply = reply.replace("```json", "").replace("```", "").strip()
        audit_json = __import__("json").loads(clean_reply)
        
        # Determine overall status
        status = "eligible"
        if any(a["status"] == "ineligible" for a in audit_json):
            status = "ineligible"
        elif any(a["status"] == "unknown" for a in audit_json):
            status = "pending"
            
        # 3. Update DB
        db.table("user_scholarships").update({
            "eligibility_status": status,
            "audit_notes_json": audit_json
        }).eq("id", sid).execute()
        
        return {"status": status, "audit": audit_json}
    except Exception as e:
        return {"error": "Audit failed", "raw_reply": reply}
