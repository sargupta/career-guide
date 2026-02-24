import logging
import google.generativeai as genai
from db.supabase_client import get_supabase
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

async def synthesize_portfolio(user_id: str):
    """
    Synthesizes a professional portfolio narrative from user achievements and activities.
    """
    supabase = get_supabase()
    
    # 1. Fetch public achievements
    ach_res = (
        supabase.table("achievements")
        .select("*")
        .eq("user_id", user_id)
        .eq("visibility", "public")
        .execute()
    )
    achievements = ach_res.data or []
    
    # 2. Fetch recent activities
    act_res = (
        supabase.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    activities = act_res.data or []
    
    # 3. Fetch Profile Path
    prof_res = (
        supabase.table("profiles")
        .select("full_name, domain_id, domains(name)")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    profile = prof_res.data or {}
    
    if not achievements and not activities:
        return {
            "narrative": "Start logging your achievements to build your professional portfolio!",
            "highlights": [],
            "profile": profile
        }

    # 4. Generate Narrative via Gemini
    ach_block = "\n".join([f"- {a['title']}: {a['description']}" for a in achievements])
    act_block = "\n".join([f"- {a['title']} ({a['type']})" for a in activities])
    
    prompt = (
        f"You are a Professional Career Consultant. Create a 'Recruiter-Ready' portfolio summary for a student.\n"
        f"STUDENT: {profile.get('full_name')}\n"
        f"DOMAIN: {profile.get('domains', {}).get('name', 'General')}\n"
        f"PUBLIC ACHIEVEMENTS:\n{ach_block}\n"
        f"RECENT ACTIVITIES:\n{act_block}\n\n"
        f"TASK:\n"
        f"1. Write a 2-paragraph professional bio. Focus on their 'Impact' and 'Growth'.\n"
        f"2. Identify 3 'Key Highlights' from their achievements and explain why they matter to a recruiter.\n"
        f"3. Do NOT use buzzwords. Be authentic, technical, and professional.\n"
        f"4. Format the output as JSON with fields: 'bio' (string), 'highlights' (list of {{title, reason}} objects)."
    )
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
        response = model.generate_content(prompt)
        content = response.text.strip()
        import json
        data = json.loads(content)
        
        # Store result in a new table or field?
        # Let's assume we have a table 'user_portfolios' or we store it in profiles.portfolio_metadata
        # For simplicity in this phase, we'll upsert into a 'user_portfolios' table.
        
        portfolio_data = {
            "user_id": user_id,
            "bio": data.get("bio", ""),
            "highlights": data.get("highlights", []),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Note: 'user_portfolios' table needs to be created. 
        # For now, we'll use a dynamic update to a 'portfolio_summary' JSONB field in 'profiles' 
        # if the table doesn't exist, but the plan mentioned public endpoints.
        # Let's assume we have the table.
        supabase.table("user_portfolios").upsert(portfolio_data, on_conflict="user_id").execute()
        
        return {
            **data,
            "profile": profile,
            "updated_at": portfolio_data["updated_at"]
        }
    except Exception as e:
        logger.exception(f"Failed to synthesize portfolio for {user_id}: {e}")
        return None
