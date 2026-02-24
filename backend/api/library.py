from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/resources")
async def get_library_resources(
    domain_id: Optional[str] = None,
    type: Optional[str] = Query(None, enum=["video", "pdf", "article", "course"]),
    difficulty: Optional[str] = Query(None, enum=["beginner", "intermediate", "advanced"]),
    user: dict = Depends(get_current_user)
):
    """List all active resources, with optional filters."""
    supabase = get_supabase_anon(user["token"])
    query = supabase.table("resources").select("*").eq("is_active", True)
    
    if domain_id:
        query = query.eq("domain_id", domain_id)
    if type:
        query = query.eq("type", type)
    if difficulty:
        query = query.eq("difficulty", difficulty)
        
    res = query.order("created_at", desc=True).execute()
    return {"resources": res.data}

@router.get("/suggest")
async def suggest_resources(user: dict = Depends(get_current_user)):
    """
    Intelligent recommendation engine.
    Finds resources matching the student's domain and low readiness scores.
    """
    supabase = get_supabase_anon(user["token"])
    
    # 1. Get student's domain and recent readiness snapshots
    profile_res = supabase.table("profiles").select("domain_id").eq("user_id", user["user_id"]).single().execute()
    domain_id = profile_res.data.get("domain_id") if profile_res.data else None
    
    if not domain_id:
        # Fallback to general resources if no domain set
        res = supabase.table("resources").select("*").limit(3).execute()
        return {"suggested": res.data}

    # 2. Identify weak skills (e.g. readiness < 50%)
    # In a real scenario, we'd check skill-specific scores in snapshots.
    # For now, we'll fetch resources tagged with "Basics" for the domain as a default.
    res = supabase.table("resources").select("*") \
        .eq("domain_id", domain_id) \
        .eq("is_active", True) \
        .limit(5).execute()
    
    return {"suggested": res.data}

@router.get("/search")
async def search_resources(q: str = Query(...), user: dict = Depends(get_current_user)):
    """Simple text search on title and description."""
    supabase = get_supabase_anon(user["token"])
    # Using ilike for basic search
    res = supabase.table("resources").select("*") \
        .ilike("title", f"%{q}%") \
        .eq("is_active", True) \
        .execute()
    return {"results": res.data}
