import logging
from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from services.gamification import level_progress
from datetime import date, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/next-action")
async def get_next_best_action(user: dict = Depends(get_current_user)):
    """
    Evaluates the user's gamification profile and recent activity to 
    suggest ONE high-leverage "Next Best Action".
    """
    user_id = user["user_id"]
    try:
        db = get_supabase_anon(user["token"])
        
        # 1. Fetch Profile Data
        profile_res = db.table("profiles").select("xp_points, streak_count, last_active_date").eq("user_id", user_id).single().execute()
        if not profile_res.data:
            raise ValueError("Profile not found")
        
        prof = profile_res.data
        xp = prof.get("xp_points", 0)
        streak = prof.get("streak_count", 0)
        last_active_str = prof.get("last_active_date")
        
        today = date.today()
        last_active = date.fromisoformat(last_active_str) if last_active_str else None
        
        # 2. Logic: Streak Rescue (Highest Priority)
        # If they had a streak yesterday but haven't logged today, urge them to save it.
        if last_active == today - timedelta(days=1) and streak > 0:
            return {
                "nba_type": "streak_rescue",
                "title": f"🔥 Save your {streak}-day streak!",
                "message": "You haven't logged anything today. View your readiness or log an activity to keep your streak alive.",
                "cta_label": "Log Activity",
                "cta_link": "/timeline"
            }
            
        # 3. Logic: Level Up Nudge
        level_info = level_progress(xp)
        if level_info["progress_pct"] > 85:
            xp_needed = level_info["next_level_xp"] - xp
            return {
                "nba_type": "level_up",
                "title": "⭐ So close to leveling up!",
                "message": f"You only need {xp_needed} more XP to reach Level {level_info['level'] + 1}. Chat with your mentor or log a skill to level up now.",
                "cta_label": "Chat with Mentor",
                "cta_link": "/mentor"
            }
            
        # 4. Logic: Activity Check (If they haven't logged anything in 3 days)
        if not last_active or last_active < today - timedelta(days=3):
            return {
                "nba_type": "dormant_user",
                "title": "📅 Quiet week?",
                "message": "Your Digital Twin needs fresh data. Did you complete any tutorials or projects recently? Let's get them on record.",
                "cta_label": "Update Timeline",
                "cta_link": "/timeline"
            }
            
        # 5. Default/Fallback: Check Readiness
        return {
            "nba_type": "readiness_check",
            "title": "🎯 Weekly Readiness Check",
            "message": "A lot can change in a few days. Check your Career Readiness score to earn +20 XP today.",
            "cta_label": "View Readiness",
            "cta_link": "/readiness"
        }

    except Exception as e:
        logger.exception(f"Failed to generate Next Best Action for {user_id}")
        # Fallback response
        return {
            "nba_type": "fallback",
            "title": "✨ Ask your Mentor",
            "message": "Have 5 minutes? Ask your AI mentor for a quick tip on your current learning path.",
            "cta_label": "Chat Now",
            "cta_link": "/mentor"
        }
@router.get("/summary")
async def get_dashboard_summary(user: dict = Depends(get_current_user)):
    """
    Fetches a high-level summary of user engagement:
    - Streak count
    - XP points
    - Recent activities count
    - Pending re-engagement nudges
    """
    user_id = user["user_id"]
    try:
        db = get_supabase_anon(user["token"])
        
        # 1. Fetch Profile Data
        profile_res = db.table("profiles").select("xp_points, streak_count, pending_nudges").eq("user_id", user_id).single().execute()
        prof = profile_res.data or {}
        
        # 2. Fetch Activity Count (this semester)
        # Assuming current semester relative to created_at for simplicity in this MVP
        thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
        act_res = db.table("activities").select("id", count="exact").eq("user_id", user_id).gte("created_at", thirty_days_ago).execute()
        
        return {
            "streak": prof.get("streak_count", 0),
            "xp": prof.get("xp_points", 0),
            "pending_nudge": prof.get("pending_nudges"),
            "activity_count": act_res.count or 0
        }
    except Exception as e:
        logger.exception(f"Failed to fetch summary for {user_id}")
        return {"streak": 0, "xp": 0, "pending_nudge": None, "activity_count": 0}
