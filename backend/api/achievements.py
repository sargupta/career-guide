from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateAchievementRequest(BaseModel):
    title: str
    description: str
    type: str  # project | research | creative | competition | certification | other
    academic_year: int  # e.g. 1, 2, 3, 4
    semester: Optional[int] = None  # 1 or 2
    links_json: Optional[List[str]] = []
    visibility: str = "private"  # "private" | "public"


@router.get("")
async def list_achievements(user: dict = Depends(get_current_user)):
    """List all achievements for the current user, ordered newest first."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    res = (
        db.table("achievements")
        .select("*")
        .eq("user_id", user_id)
        .order("academic_year", desc=True)
        .execute()
    )
    return {"achievements": res.data or []}


@router.post("")
async def create_achievement(body: CreateAchievementRequest, user: dict = Depends(get_current_user)):
    """Create a new achievement / portfolio item."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    data = {
        "user_id": user_id,
        "title": body.title,
        "description": body.description,
        "type": body.type,
        "academic_year": body.academic_year,
        "semester": body.semester,
        "links_json": body.links_json or [],
        "visibility": body.visibility,
    }
    res = db.table("achievements").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create achievement")
    return {"achievement": res.data[0]}


@router.delete("/{achievement_id}")
async def delete_achievement(achievement_id: str, user: dict = Depends(get_current_user)):
    """Delete an achievement by ID (only for the current user)."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    res = (
        db.table("achievements")
        .delete()
        .eq("id", achievement_id)
        .eq("user_id", user_id)
        .execute()
    )
    return {"deleted": len(res.data or []) > 0}
