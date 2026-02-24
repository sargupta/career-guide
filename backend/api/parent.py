from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class LinkRequest(BaseModel):
    student_id: str

class LinkUpdate(BaseModel):
    status: str # active, rejected

class NudgeRequest(BaseModel):
    student_id: str
    content: str

# ── 1. Managing Student Links ────────────────────────────────────────────────

@router.post("/links")
async def create_link(req: LinkRequest, user: dict = Depends(get_current_user)):
    """Parent initiates a link request."""
    supabase = get_supabase_anon(user["token"])
    res = supabase.table("parent_student_links").insert({
        "parent_id": user["user_id"],
        "student_id": req.student_id,
        "status": "pending"
    }).execute()
    return {"message": "Link request sent to student.", "data": res.data}

@router.get("/students")
async def list_students(user: dict = Depends(get_current_user)):
    """List all students linked to this parent."""
    supabase = get_supabase_anon(user["token"])
    res = supabase.table("parent_student_links").select("*, profiles:student_id(*)").eq("parent_id", user["user_id"]).execute()
    return {"students": res.data}

@router.patch("/links/{link_id}")
async def update_link(link_id: str, req: LinkUpdate, user: dict = Depends(get_current_user)):
    """Student accepts/rejects a link (or parent cancels)."""
    supabase = get_supabase_anon(user["token"])
    # Note: RLS handles the permission (only student can update status to active)
    res = supabase.table("parent_student_links").update({
        "status": req.status
    }).eq("id", link_id).execute()
    return {"message": f"Link status updated to {req.status}", "data": res.data}

# ── 2. Reporting ─────────────────────────────────────────────────────────────

@router.get("/students/{student_id}/report")
async def get_student_report(student_id: str, user: dict = Depends(get_current_user)):
    """Fetch student metrics if link is active."""
    supabase = get_supabase_anon(user["token"])
    
    # 1. Verify Active Link
    link = supabase.table("parent_student_links").select("*").eq("parent_id", user["user_id"]).eq("student_id", student_id).eq("status", "active").single().execute()
    if not link.data:
        raise HTTPException(status_code=403, detail="No active link found for this student.")

    # 2. Fetch Aggregates
    profile = supabase.table("profiles").select("*").eq("user_id", student_id).single().execute()
    achievements = supabase.table("achievements").select("*").eq("user_id", student_id).execute()
    readiness = supabase.table("readiness_snapshots").select("*").eq("user_id", student_id).order("created_at", desc=True).limit(10).execute()

    return {
        "profile": profile.data,
        "achievements_count": len(achievements.data),
        "readiness_history": readiness.data
    }

# ── 3. Nudges ────────────────────────────────────────────────────────────────

@router.post("/nudges")
async def create_nudge(req: NudgeRequest, user: dict = Depends(get_current_user)):
    """Parent creates a nudge for the AI Mentor."""
    supabase = get_supabase_anon(user["token"])
    
    # RLS ensures parent has an active link
    res = supabase.table("parent_nudges").insert({
        "parent_id": user["user_id"],
        "student_id": req.student_id,
        "content": req.content
    }).execute()
    
    return {"message": "Nudge sent to AI Mentor.", "data": res.data}

# ── 4. Scholarships ─────────────────────────────────────────────────────────

@router.get("/students/{student_id}/scholarships")
async def get_student_scholarships(student_id: str, user: dict = Depends(get_current_user)):
    """Allows parents to see scholarships being tracked by their child."""
    supabase = get_supabase_anon(user["token"])
    # Link verification (Active link required)
    link = supabase.table("parent_student_links").select("*").eq("parent_id", user["user_id"]).eq("student_id", student_id).eq("status", "active").single().execute()
    if not link.data:
        raise HTTPException(status_code=403, detail="No active link found for this student.")
        
    res = supabase.table("user_scholarships").select("*").eq("user_id", student_id).execute()
    return {"scholarships": res.data or []}

@router.post("/students/{student_id}/recommend")
async def recommend_scholarship(student_id: str, req: dict, user: dict = Depends(get_current_user)):
    """Parent recommends a scholarship to the student."""
    supabase = get_supabase_anon(user["token"])
    # Link verification
    link = supabase.table("parent_student_links").select("*").eq("parent_id", user["user_id"]).eq("student_id", student_id).eq("status", "active").single().execute()
    if not link.data:
        raise HTTPException(status_code=403, detail="No active link found.")
        
    data = {
        "user_id": student_id,
        "scholarship_name": req["scholarship_name"],
        "provider": req["provider"],
        "financial_benefit": req.get("benefit"),
        "deadline": req.get("deadline"),
        "parent_recommended": True
    }
    
    res = supabase.table("user_scholarships").upsert(data, on_conflict="user_id,scholarship_name,deadline").execute()
    return {"message": "Scholarship recommended to student.", "data": res.data}
