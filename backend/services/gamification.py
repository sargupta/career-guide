import logging
from datetime import date, timedelta
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# XP Rewards Configuration
XP_REWARDS = {
    "onboarding_complete": 500,
    "activity_logged": 100,
    "skill_added": 50,
    "mentor_chat_turn": 10,
    "daily_login": 20,
    "readiness_check": 50,
}

# Badges Configuration
BADGES = {
    "first_login": {"name": "First Login", "desc": "Started your career journey", "icon": "🌅"},
    "3_day_streak": {"name": "3 Day Streak", "desc": "Logged in for 3 consecutive days", "icon": "🔥"},
    "7_day_streak": {"name": "7 Day Streak", "desc": "Consistency is key", "icon": "📅"},
    "30_day_streak": {"name": "30 Day Streak", "desc": "Unstoppable momentum", "icon": "🚀"},
    "activity_logger": {"name": "Action Taker", "desc": "Logged your first activity", "icon": "📝"},
    "skill_hunter": {"name": "Skill Hunter", "desc": "Added 5 skills to your profile", "icon": "🎯"},
    "level_5": {"name": "Level 5", "desc": "Reached Level 5 (5000 XP)", "icon": "⭐"},
}

def calculate_level(xp: int) -> int:
    """Calculate user level based on total XP (1000 XP per level)."""
    return (xp // 1000) + 1

def level_progress(xp: int) -> dict:
    """Returns % progress to next level."""
    current_level = calculate_level(xp)
    xp_for_next = current_level * 1000
    xp_in_current_level = xp % 1000
    progress_pct = (xp_in_current_level / 1000) * 100
    return {
        "level": current_level,
        "current_xp": xp,
        "next_level_xp": xp_for_next,
        "progress_pct": progress_pct
    }

def add_xp_and_update_streak(supabase_client, user_id: str, action_key: str) -> dict:
    """
    Rewards XP for an action, updates the daily streak if applicable,
    and returns a summary of changes (new XP, streaks, unlocked badges).
    """
    if action_key not in XP_REWARDS:
        logger.warning(f"Unknown XP action: {action_key}")
        return {}

    xp_to_add = XP_REWARDS[action_key]
    today = date.today()

    # 1. Fetch current profile stats
    res = supabase_client.table("profiles").select(
        "xp_points, streak_count, max_streak, last_active_date"
    ).eq("user_id", user_id).execute()

    if not res.data:
        return {}

    profile = res.data[0]
    current_xp = profile.get("xp_points") or 0
    streak_count = profile.get("streak_count") or 0
    max_streak = profile.get("max_streak") or 0
    
    # Parse last_active_date safely
    last_active_str = profile.get("last_active_date")
    last_active = date.fromisoformat(last_active_str) if last_active_str else None

    # 2. Daily Streak Logic
    streak_updated = False
    new_streak = streak_count
    
    if last_active != today:
        if last_active == today - timedelta(days=1):
            # Consecutive day
            new_streak += 1
        elif not last_active:
            # First time logging something
            new_streak = 1
        else:
            # Streak broken
            new_streak = 1
            
        streak_updated = True
        
    new_max = max(max_streak, new_streak)
    new_total_xp = current_xp + xp_to_add

    # 3. Save updates to DB
    updates = {
        "xp_points": new_total_xp,
    }
    
    if streak_updated:
        updates["streak_count"] = new_streak
        updates["max_streak"] = new_max
        updates["last_active_date"] = today.isoformat()
        # Add daily login bonus
        new_total_xp += XP_REWARDS["daily_login"]
        updates["xp_points"] = new_total_xp

    supabase_client.table("profiles").update(updates).eq("user_id", user_id).execute()

    # 4. Check for newly unlocked badges
    unlocked_badges = _evaluate_badges(
        supabase_client, user_id, new_total_xp, new_streak, action_key
    )

    return {
        "xp_added": new_total_xp - current_xp,
        "new_total_xp": new_total_xp,
        "new_streak": new_streak,
        "streak_maintained": streak_updated and new_streak > 1,
        "level_info": level_progress(new_total_xp),
        "unlocked_badges": unlocked_badges
    }

def _evaluate_badges(supabase_client, user_id: str, xp: int, streak: int, recent_action: str) -> List[dict]:
    """Check if any criteria are met for new badges and award them."""
    new_badges = []
    
    # Existing badges
    existing_res = supabase_client.table("user_badges").select("badge_key").eq("user_id", user_id).execute()
    existing_keys = {b["badge_key"] for b in (existing_res.data or [])}

    # Criteria Checks
    badges_to_award = []

    if "first_login" not in existing_keys and recent_action == "onboarding_complete":
        badges_to_award.append("first_login")
        
    if "activity_logger" not in existing_keys and recent_action == "activity_logged":
        badges_to_award.append("activity_logger")

    if streak >= 3 and "3_day_streak" not in existing_keys:
        badges_to_award.append("3_day_streak")
    if streak >= 7 and "7_day_streak" not in existing_keys:
        badges_to_award.append("7_day_streak")
    if streak >= 30 and "30_day_streak" not in existing_keys:
        badges_to_award.append("30_day_streak")

    if calculate_level(xp) >= 5 and "level_5" not in existing_keys:
        badges_to_award.append("level_5")

    # Insert new badges
    for key in badges_to_award:
        badge_info = BADGES[key]
        try:
            supabase_client.table("user_badges").insert({
                "user_id": user_id,
                "badge_key": key,
                "badge_name": badge_info["name"],
                "badge_description": badge_info["desc"],
                "icon_url": badge_info["icon"]
            }).execute()
            new_badges.append(badge_info)
        except Exception as e:
            logger.warning(f"Failed to award badge {key} to {user_id}: {e}")

    return new_badges

def get_gamification_profile(supabase_client, user_id: str) -> dict:
    """Fetch the full gamification profile for the Digital Twin UI."""
    profile_res = supabase_client.table("profiles").select(
        "xp_points, streak_count, max_streak"
    ).eq("user_id", user_id).execute()
    
    badges_res = supabase_client.table("user_badges").select(
        "badge_key, badge_name, badge_description, icon_url, earned_at"
    ).eq("user_id", user_id).order("earned_at", desc=True).execute()

    prof = profile_res.data[0] if profile_res.data else {}
    xp = prof.get("xp_points") or 0
    
    return {
        "xp": xp,
        "streak": prof.get("streak_count") or 0,
        "max_streak": prof.get("max_streak") or 0,
        "level_info": level_progress(xp),
        "badges": badges_res.data or []
    }
