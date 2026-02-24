import logging
from datetime import datetime, timedelta, timezone
from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

async def calculate_engagement_score(user_id: str) -> int:
    """
    Calculates an engagement score (0-100) based on:
    - Activity recency (40%)
    - Mentor interaction recency (30%)
    - Streak/Frequency (30%) - Simplified for now based on last 7 days.
    """
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    
    # 1. Activity Recency
    act_res = (
        supabase.table("activities")
        .select("created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    last_act = act_res.data[0]["created_at"] if act_res.data else None
    
    act_score = 0
    if last_act:
        delta = now - datetime.fromisoformat(last_act.replace("Z", "+00:00"))
        if delta.days <= 1: act_score = 100
        elif delta.days <= 3: act_score = 70
        elif delta.days <= 7: act_score = 40
        else: act_score = 10

    # 2. Mentor Interaction Recency
    # We need to find the session first, then messages
    # Or just query mentor_messages through session join
    msg_res = (
        supabase.table("mentor_messages")
        .select("created_at")
        .eq("role", "user")
        .filter("session_id", "in", 
            supabase.table("mentor_sessions")
            .select("id")
            .eq("user_id", user_id)
        )
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    # Wait, Supabase client might not handle nested subqueries like this easily in .filter()
    # Let's do it in two steps for clarity and reliability
    session_res = supabase.table("mentor_sessions").select("id").eq("user_id", user_id).execute()
    session_ids = [s["id"] for s in (session_res.data or [])]
    
    last_msg = None
    if session_ids:
        msg_res = (
            supabase.table("mentor_messages")
            .select("created_at")
            .eq("role", "user")
            .in_("session_id", session_ids)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        last_msg = msg_res.data[0]["created_at"] if msg_res.data else None
    
    msg_score = 0
    if last_msg:
        delta = now - datetime.fromisoformat(last_msg.replace("Z", "+00:00"))
        if delta.days <= 2: msg_score = 100
        elif delta.days <= 7: msg_score = 60
        else: msg_score = 20

    # 3. Frequency (Activity count in last 7 days)
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    freq_res = (
        supabase.table("activities")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", seven_days_ago)
        .execute()
    )
    count = freq_res.count or 0
    freq_score = min(count * 20, 100) # 5 activities = 100 points

    total_score = (act_score * 0.4) + (msg_score * 0.3) + (freq_score * 0.3)
    return int(total_score)

async def trigger_retention_nudge(user_id: str):
    """
    Uses the Mentor Agent to generate a personalized re-engagement nudge.
    """
    logger.info(f"[Retention] Triggering nudge for user {user_id}")
    from agents.lead_mentor import run_lead_mentor
    
    # Custom message and hint to trigger retention persona
    message = "I haven't logged any progress recently. Can you give me a quick, motivating nudge based on my goals?"
    system_hint = (
        "This is an automated RETENTION NUDGE. The student has not logged activity recently. "
        "Keep the response short, high-energy, and specifically mention their primary domain or career goals "
        "to remind them why they started this journey. Do NOT sound like a bot; sound like a concerned friend."
    )
    
    try:
        reply = await run_lead_mentor(user_id=user_id, message=message, system_hint=system_hint)
        
        # Store nudge if we have a table for it, or just log it
        # For this version, let's assume we store it in a 'pending_nudges' field or similar
        # Based on scheduler.py, there is a 'pending_nudges' in 'profiles'
        supabase = get_supabase()
        supabase.table("profiles").update({"pending_nudges": reply}).eq("user_id", user_id).execute()
        
        return reply
    except Exception:
        logger.exception(f"[Retention] Failed to generate nudge for {user_id}")
        return None

async def check_user_retention():
    """
    Daily job to identify at-risk users and trigger nudges.
    Threshold: score < 40
    """
    supabase = get_supabase()
    res = supabase.table("profiles").select("user_id").execute()
    users = res.data or []
    
    logger.info(f"[Retention] Checking retention for {len(users)} users")
    
    for user in users:
        user_id = user["user_id"]
        score = await calculate_engagement_score(user_id)
        logger.info(f"[Retention] User {user_id[:8]} score: {score}")
        
        if score < 40:
            await trigger_retention_nudge(user_id)
