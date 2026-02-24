import logging
from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from services.gamification import get_gamification_profile

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/profile")
async def get_my_gamification_profile(user: dict = Depends(get_current_user)):
    """
    Retrieves the current user's Gamification Profile including:
    - Total XP & current Level progress
    - Current and max Daily Streaks
    - List of unlocked Badges
    """
    user_id = user["user_id"]
    try:
        # Use anon client so RLS applies if configured, though server-side we have auth context
        db = get_supabase_anon(user["token"])
        gamification_data = get_gamification_profile(db, user_id)
        
        return {
            "status": "success",
            "data": gamification_data
        }
    except Exception as e:
        logger.exception(f"Failed to fetch gamification profile for {user_id}")
        raise HTTPException(status_code=500, detail="Failed to fetch gamification profile")
