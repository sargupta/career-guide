from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class EnrollRequest(BaseModel):
    path_id: str
    academic_year: Optional[str] = None


class ProgressUpdateRequest(BaseModel):
    path_id: str
    progress_pct: int  # 0-100


@router.get("/paths")
async def list_learning_paths(user: dict = Depends(get_current_user)):
    """List learning paths, optionally filtered by user's domain."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    # Get user's domain to filter relevant paths
    profile_res = db.table("profiles").select("domain_id").eq("user_id", user_id).execute()
    domain_id = profile_res.data[0].get("domain_id") if profile_res.data else None

    query = db.table("learning_paths").select("*")
    if domain_id:
        # Return paths for user's domain plus universal paths (domain_id is null)
        # Supabase: filter by domain_id OR domain_id is null
        query = db.table("learning_paths").select("*").or_(
            f"domain_id.eq.{domain_id},domain_id.is.null"
        )

    res = query.order("is_free", desc=True).execute()
    return {"paths": res.data or []}


@router.get("/enrollments")
async def list_enrollments(user: dict = Depends(get_current_user)):
    """List the current user's course enrollments with learning path details."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    res = (
        db.table("enrollments")
        .select("*, learning_paths(*)")
        .eq("user_id", user_id)
        .execute()
    )
    return {"enrollments": res.data or []}


@router.post("/enroll")
async def enroll(body: EnrollRequest, user: dict = Depends(get_current_user)):
    """Enroll in a learning path."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    data = {
        "user_id": user_id,
        "path_id": body.path_id,
        "progress_pct": 0,
        "academic_year": body.academic_year,
    }
    res = db.table("enrollments").upsert(data, on_conflict="user_id,path_id").execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to enroll")
    return {"enrollment": res.data[0]}


@router.put("/progress")
async def update_progress(body: ProgressUpdateRequest, user: dict = Depends(get_current_user)):
    """Update progress on a learning path."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    data = {"progress_pct": min(100, max(0, body.progress_pct))}
    if body.progress_pct >= 100:
        from datetime import date
        data["completed_at"] = date.today().isoformat()

    res = (
        db.table("enrollments")
        .update(data)
        .eq("user_id", user_id)
        .eq("path_id", body.path_id)
        .execute()
    )
    return {"enrollment": res.data[0] if res.data else {}}
