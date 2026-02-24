from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon, get_supabase
from core.portfolio import synthesize_portfolio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/summary")
async def get_portfolio_summary(user: dict = Depends(get_current_user)):
    """Fetches the AI-synthesized portfolio summary for the current user."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    res = db.table("user_portfolios").select("*").eq("user_id", user_id).execute()
    if not res.data:
        # If no portfolio exists, try to synthesize one on the fly
        summary = await synthesize_portfolio(user_id)
        if not summary:
            return {"bio": "", "highlights": [], "is_public": False}
        return summary
        
    return res.data[0]

@router.post("/synthesize")
async def trigger_synthesis(user: dict = Depends(get_current_user)):
    """Manually triggers a fresh AI synthesis of the user's portfolio."""
    user_id = user["user_id"]
    summary = await synthesize_portfolio(user_id)
    if not summary:
        raise HTTPException(status_code=500, detail="Failed to synthesize portfolio")
    return summary
@router.post("/toggle-public")
async def toggle_public(is_public: bool, user: dict = Depends(get_current_user)):
    """Toggles the public visibility of the user's portfolio."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    res = db.table("user_portfolios").update({"is_public": is_public}).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update visibility")
    return {"is_public": is_public, "share_slug": res.data[0].get("share_slug")}

@router.post("/theme")
async def update_theme(theme: str, user: dict = Depends(get_current_user)):
    """Updates the selected professional theme for the user's portfolio."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])
    
    res = db.table("user_portfolios").update({"theme": theme}).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update theme")
    return {"theme": theme}

@router.get("/public/{slug}")
async def get_public_portfolio(slug: str):
    """Public endpoint to view a student's portfolio by shareable slug."""
    supabase = get_supabase()
    
    # Fetch portfolio by slug (only if is_public is true)
    res = (
        supabase.table("user_portfolios")
        .select("*, profiles(full_name, avatar_url, domain_id, domains(name))")
        .eq("share_slug", slug)
        .eq("is_public", True)
        .single()
        .execute()
    )
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Portfolio not found or is private")
        
    # Fetch public achievements for this user
    user_id = res.data["user_id"]
    ach_res = (
        supabase.table("achievements")
        .select("*")
        .eq("user_id", user_id)
        .eq("visibility", "public")
        .execute()
    )
    
    return {
        "portfolio": res.data,
        "achievements": ach_res.data or []
    }
