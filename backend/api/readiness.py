from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
import logging
import json
from datetime import date
from services.gamification import add_xp_and_update_streak

logger = logging.getLogger(__name__)
router = APIRouter()


def _compute_readiness(
    user_skills: list,
    activities: list,
    enrollments: list,
    career_path: dict,
    academic_year: str,
    archetype: str = "EXPLORER",
) -> dict:
    """
    Compute readiness score (0-100) for a single career path.
    
    Formula from PLAN.md Section 1.7:
    Readiness = 0.35 × SkillsScore + 0.35 × ActivityScore + 0.20 × LearningScore + 0.10 × RecencyBonus
    """
    required_skills = career_path.get("required_skills_json") or []
    expected_activities = career_path.get("expected_activities_json") or {}
    recommended_path_ids = career_path.get("recommended_learning_path_ids") or []

    # ─── Skills Score (35%) ───────────────────────────────────────────────────
    user_skill_ids = {s["skill_id"] for s in user_skills}
    matched = sum(1 for r in required_skills if r in user_skill_ids)
    skills_score = (matched / max(len(required_skills), 1)) * 100

    # ─── Activity Score (35%) ─────────────────────────────────────────────────
    path_id = career_path.get("id", "")
    relevant_activities = [
        a for a in activities
        if path_id in (a.get("relevance_path_ids") or [])
    ]
    expected_total = sum(expected_activities.values()) if expected_activities else 3
    activity_score = min(100, (len(relevant_activities) / max(expected_total, 1)) * 100)

    # ─── Learning Score (20%) ─────────────────────────────────────────────────
    enrolled_path_ids = {e["path_id"] for e in enrollments if e.get("completed_at")}
    completed_relevant = sum(1 for pid in recommended_path_ids if pid in enrolled_path_ids)
    learning_score = (completed_relevant / max(len(recommended_path_ids), 1)) * 100

    # ─── Recency Bonus (10%) ──────────────────────────────────────────────────
    current_year_label = academic_year or f"Year {date.today().year}"
    recent = [a for a in activities if current_year_label in (a.get("academic_year") or "")]
    recency_bonus = min(10, (len(recent) / max(len(activities), 1)) * 10)

    # ─── Dynamic Weights (Archetype-Specific) ────────────────────────────────
    w_skills = 0.35
    w_activities = 0.35
    w_learning = 0.20
    w_recency = 0.10

    if archetype == "MAANG_ASPIRANT":
        w_skills, w_learning, w_activities = 0.45, 0.30, 0.15
    elif archetype in ("RESEARCHER", "ACADEMIC_TOPPER"):
        w_learning, w_activities, w_skills = 0.40, 0.30, 0.20
    elif archetype == "GOVT_ASPIRANT":
        w_learning, w_activities, w_skills = 0.50, 0.10, 0.30
    elif archetype in ("CREATIVE_HUSTLER", "FOUNDER_BUILDER"):
        w_activities, w_skills, w_learning = 0.50, 0.30, 0.10

    # ─── Final Score ─────────────────────────────────────────────────────────
    total = (
        w_skills * skills_score
        + w_activities * activity_score
        + w_learning * learning_score
        + w_recency * recency_bonus * 10  # normalise to 100 scale
    )
    score = round(min(100, max(0, total)))

    # ─── Gaps ─────────────────────────────────────────────────────────────────
    missing_skills = [sid for sid in required_skills if sid not in user_skill_ids]
    gaps = []
    if missing_skills:
        gaps.append(f"Add {len(missing_skills)} missing skill(s) required for this path")
    if activity_score < 60:
        gaps.append("Log more relevant activities (internships, competitions, projects)")
    if learning_score < 50 and recommended_path_ids:
        gaps.append("Complete more recommended courses for this path")
    if recency_bonus < 5:
        gaps.append("No recent activity this academic year — log something this semester")

    # ─── Next Actions ─────────────────────────────────────────────────────────
    next_actions = []
    if missing_skills:
        next_actions.append(f"Add skill: {missing_skills[0]}")
    if activity_score < 100:
        next_actions.append("Log an internship or project relevant to this path")
    if recommended_path_ids and not enrolled_path_ids:
        next_actions.append("Enroll in a recommended learning path")
    if not next_actions:
        next_actions.append("You're on track! Keep adding activities each semester.")

    return {
        "score": score,
        "skills_score": round(skills_score),
        "activity_score": round(activity_score),
        "learning_score": round(learning_score),
        "recency_bonus": round(recency_bonus * 10),
        "gaps": gaps,
        "next_actions": next_actions,
    }


@router.get("")
async def get_readiness(user: dict = Depends(get_current_user)):
    """
    Compute and return readiness scores for all of the user's aspirational career paths.
    """
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    # Fetch user data in parallel-ish using separate queries
    aspirations_res = db.table("user_aspirations").select("career_path_id, rank").eq("user_id", user_id).order("rank").execute()
    if not aspirations_res.data:
        return {"readiness": [], "message": "Add career paths in onboarding to see readiness scores."}

    career_path_ids = [a["career_path_id"] for a in aspirations_res.data]

    career_paths_res = db.table("career_paths").select("*").in_("id", career_path_ids).execute()
    user_skills_res = db.table("user_skills").select("skill_id, level").eq("user_id", user_id).execute()
    activities_res = db.table("activities").select("*").eq("user_id", user_id).execute()
    enrollments_res = db.table("enrollments").select("path_id, progress_pct, completed_at").eq("user_id", user_id).execute()
    academic_res = db.table("academic_enrollments").select("current_year").eq("user_id", user_id).execute()

    user_skills = user_skills_res.data or []
    activities = activities_res.data or []
    enrollments = enrollments_res.data or []
    academic = academic_res.data[0] if academic_res.data else {}
    academic_year = f"Year {academic.get('current_year', 1)}"

    # Fetch persona to get the archetype
    persona_res = db.table("user_persona_profiles").select("archetype").eq("user_id", user_id).execute()
    archetype = persona_res.data[0]["archetype"] if persona_res.data else "EXPLORER"

    career_paths_map = {cp["id"]: cp for cp in (career_paths_res.data or [])}

    results = []
    for aspiration in aspirations_res.data:
        cp_id = aspiration["career_path_id"]
        cp = career_paths_map.get(cp_id, {"id": cp_id, "name": "Unknown Path"})

        readiness = _compute_readiness(user_skills, activities, enrollments, cp, academic_year, archetype)
        results.append({
            "career_path_id": cp_id,
            "career_path_name": cp.get("name", "Unknown"),
            "rank": aspiration["rank"],
        })

    # Award Gamification XP for checking readiness
    try:
        xp_res = add_xp_and_update_streak(db, user_id, "readiness_check")
    except Exception as e:
        logger.exception("Failed to award XP for readiness check")
        xp_res = {}

    return {"readiness": results, "gamification": xp_res}


@router.post("/refresh")
async def refresh_readiness(user: dict = Depends(get_current_user)):
    """Re-compute and persist a readiness snapshot."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    # Call the GET handler logic
    data = await get_readiness(user)
    readiness_list = data.get("readiness", [])

    snapshots = []
    for r in readiness_list:
        snapshots.append({
            "user_id": user_id,
            "career_path_id": r["career_path_id"],
            "score": r["score"],
            "gaps_json": r.get("gaps", []),
            "recommendations_json": r.get("next_actions", []),
            "snapshot_date": date.today().isoformat(),
        })

    if snapshots:
        db.table("readiness_snapshots").upsert(
            snapshots, on_conflict="user_id,career_path_id,snapshot_date"
        ).execute()

    return {"message": "Readiness refreshed", "results": readiness_list}


@router.get("/memory-gaps")
async def get_memory_gaps(user: dict = Depends(get_current_user)):
    """
    Returns personalised gap cards derived from the student's career memory.

    Queries Mem0 for blockers, skill gaps, and unmet goals — facts the memory
    layer knows about but the structured DB doesn't. Complements the numeric
    readiness score with qualitative, experience-based insights.

    Response shape:
      {
        "gaps": [
          {
            "category": "BLOCKERS",
            "fact": "Applied to 20+ companies on Internshala, zero callbacks in 3 months",
            "action": "Update your profile with a clear project-based resume"
          },
          ...
        ],
        "count": N
      }
    """
    import google.generativeai as genai
    from memory import search_memories

    user_id: str = user["user_id"]

    # Pull memory facts related to gaps, blockers, weak areas, and unmet goals
    gap_context = await search_memories(
        user_id=user_id,
        query="skill gaps blockers weaknesses failed interviews rejection unmet goals",
        top_k=12,
    )

    if not gap_context:
        return {"gaps": [], "count": 0, "source": "memory"}

    # Ask Gemini to format these as structured gap cards with actions
    prompt = (
        "You are analysing an Indian student's career blockers and skill gaps.\n"
        "Based on the following memory facts, generate up to 5 gap cards.\n"
        "Each card: a one-sentence 'gap' description and a one-sentence 'action'.\n"
        "Return JSON array: [{\"category\": \"BLOCKERS|SKILLS|GOALS\", "
        "\"fact\": \"...\", \"action\": \"...\"}]\n\n"
        f"Memory facts:\n{gap_context}\n\nJSON:"
    )
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-001")
        response = model.generate_content(prompt)
        import json
        raw = response.text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        gaps = json.loads(raw.strip())
    except Exception:
        logger.exception("[Readiness] memory-gaps Gemini parsing failed")
        # Fallback: return raw memory context as a single gap card
        gaps = [{
            "category": "GENERAL",
            "fact": gap_context.strip(),
            "action": "Discuss with your AI Mentor for a personalised plan.",
        }]

    return {"gaps": gaps, "count": len(gaps), "source": "memory"}

