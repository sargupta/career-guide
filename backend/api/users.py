from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from api.auth import get_current_user
from api.models import ProfileUpdate, AcademicEnrollmentUpdate, AspirationsUpdate
from db.supabase_client import get_supabase_anon

router = APIRouter()


class ProfileResponse(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    domain_id: Optional[str] = None
    career_path_id: Optional[str] = None
    onboarding_completed: bool = False
    academic_enrollment: Optional[dict] = None
    aspirations: Optional[list] = None


@router.get("/me", response_model=ProfileResponse)
async def get_me(user_info: dict = Depends(get_current_user)):
    """Get current user profile + academic enrollment + aspirations."""
    user_id = user_info["user_id"]
    db = get_supabase_anon(user_info["token"])
    # Fetch profile
    profile_res = db.table("profiles").select("*").eq("user_id", user_id).execute()
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_res.data[0]
    
    # Fetch academic enrollment
    academic_res = db.table("academic_enrollments").select("*").eq("user_id", user_id).execute()
    academic = academic_res.data[0] if academic_res.data else None
    
    # Fetch aspirations
    aspirations_res = db.table("user_aspirations").select("*").eq("user_id", user_id).execute()
    aspirations = [a["career_path_id"] for a in aspirations_res.data] if aspirations_res.data else None
    
    profile["onboarding_completed"] = bool(profile.get("domain_id") and academic)
    return ProfileResponse(
        **profile,
        academic_enrollment=academic,
        aspirations=aspirations
    )


@router.put("/me")
async def update_me(body: ProfileUpdate, user_info: dict = Depends(get_current_user)):
    """Update current user profile (e.g. domain_id)."""
    user_id = user_info["user_id"]
    db = get_supabase_anon(user_info["token"])
    res = db.table("profiles").update(body.model_dump()).eq("user_id", user_id).execute()
    return res.data[0] if res.data else {"status": "ok"}


@router.put("/me/academic")
async def update_academic_enrollment(body: AcademicEnrollmentUpdate, user_info: dict = Depends(get_current_user)):
    """Update academic enrollment for current user."""
    user_id = user_info["user_id"]
    db = get_supabase_anon(user_info["token"])
    data = body.model_dump()
    data["user_id"] = user_id
    res = db.table("academic_enrollments").upsert(data, on_conflict="user_id").execute()
    return res.data[0] if res.data else {"status": "ok"}


@router.put("/me/aspirations")
async def set_aspirations(body: AspirationsUpdate, user_info: dict = Depends(get_current_user)):
    """Set aspirational career paths (up to 3)."""
    user_id = user_info["user_id"]
    db = get_supabase_anon(user_info["token"])
    
    # First, clear existing for this user (simple overwrite approach)
    db.table("user_aspirations").delete().eq("user_id", user_id).execute()
    
    # Insert new
    if body.career_paths:
        insert_data = []
        for index, path_id in enumerate(body.career_paths[:3]):  # limit to 3
            insert_data.append({
                "user_id": user_id,
                "career_path_id": path_id,
                "rank": index + 1
            })
        db.table("user_aspirations").insert(insert_data).execute()
        
    return {"message": "Aspirations updated"}
