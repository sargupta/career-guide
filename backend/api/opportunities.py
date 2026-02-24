from fastapi import APIRouter, Depends
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def list_opportunities(
    user: dict = Depends(get_current_user),
    type: Optional[str] = None
):
    """
    Return a list of recommended opportunities, ranked by persona archetype.
    """
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    # Fetch persona to get the archetype
    persona_res = db.table("user_persona_profiles").select("archetype").eq("user_id", user_id).execute()
    archetype = persona_res.data[0]["archetype"] if persona_res.data else "EXPLORER"

    # Curated seed data

    opportunities = [
        {
            "id": "opp-1",
            "type": "internship",
            "title": "Google Summer of Code 2026",
            "org": "Google",
            "match": 84,
            "deadline": "Mar 18, 2026",
            "stipend": "₹1.8L/mo",
            "tags": ["Open Source", "Remote", "Stipend"],
            "apply_url": "https://summerofcode.withgoogle.com",
        },
        {
            "id": "opp-2",
            "type": "scholarship",
            "title": "NASSCOM Foundation Scholarship",
            "org": "NASSCOM",
            "match": 71,
            "deadline": "Apr 2, 2026",
            "tags": ["Merit-based", "₹50,000"],
            "apply_url": None,
        },
        {
            "id": "opp-3",
            "type": "fellowship",
            "title": "Teach For India Fellowship",
            "org": "Teach For India",
            "match": 63,
            "deadline": "May 10, 2026",
            "tags": ["Social Impact", "2-year"],
            "apply_url": "https://teachforindia.org",
        },
        {
            "id": "opp-4",
            "type": "competition",
            "title": "Smart India Hackathon 2026",
            "org": "MoE, GoI",
            "match": 91,
            "deadline": "Mar 5, 2026",
            "tags": ["Team", "National Level", "₹1L Prize"],
            "apply_url": "https://sih.gov.in",
        },
        {
            "id": "opp-5",
            "type": "internship",
            "title": "Microsoft Explore Program",
            "org": "Microsoft",
            "match": 68,
            "deadline": "Apr 15, 2026",
            "stipend": "₹2.1L/mo",
            "tags": ["Software", "Hybrid"],
            "apply_url": None,
        },
        {
            "id": "opp-6",
            "type": "fellowship",
            "title": "Reliance Foundation UG Scholarship",
            "org": "Reliance Foundation",
            "match": 57,
            "deadline": "Feb 28, 2026",
            "tags": ["UG", "STEM", "Full Scholarship"],
            "apply_url": "https://reliancefoundation.org",
        },
    ]

    # Archetype-aware scoring adjustments
    for opp in opportunities:
        base_match = opp["match"]
        bump = 0

        # Tags and org names for matching
        tags = [t.lower() for t in opp.get("tags", [])]
        org = opp.get("org", "").lower()
        title = opp.get("title", "").lower()

        is_maang = "google" in org or "microsoft" in org
        is_govt = "goi" in org or "niti aayog" in org or "moe" in org
        is_research = "fellowship" in title or "academia" in tags or "iisc" in org
        is_social = "social impact" in tags or "foundation" in org

        if archetype == "MAANG_ASPIRANT":
            if is_maang: bump += 25
            if is_govt: bump -= 15
        elif archetype == "GOVT_ASPIRANT":
            if is_govt: bump += 25
            if is_maang: bump -= 10
        elif archetype in ("RESEARCHER", "ACADEMIC_TOPPER"):
            if is_research: bump += 20
        elif archetype == "CREATIVE_HUSTLER":
            if is_social: bump += 15
        elif archetype == "DISTRACTED_LEARNER":
            if "stipend" in tags or opp.get("stipend"): bump += 10  # Monetary incentive
            if is_maang: bump -= 15 # Too intimidating initially

        opp["match"] = min(99, max(10, base_match + bump))

    # Sort descending by adjusted match score
    ranked_opportunities = sorted(opportunities, key=lambda x: x["match"], reverse=True)

    if type:
        ranked_opportunities = [o for o in ranked_opportunities if o["type"] == type]

    return {"opportunities": ranked_opportunities}


@router.post("/{opportunity_id}/apply")
async def apply_opportunity(
    opportunity_id: str,
    user: dict = Depends(get_current_user),
):
    """Mark an opportunity as applied (logs to activities)."""
    user_id = user["user_id"]
    db = get_supabase_anon(user["token"])

    data = {
        "user_id": user_id,
        "type": "achievement",
        "title": f"Applied to opportunity {opportunity_id}",
        "details_json": {"opportunity_id": opportunity_id},
        "academic_year": "Year 2",
        "verified": False,
    }
    db.table("activities").insert(data).execute()
    return {"message": "Application logged", "opportunity_id": opportunity_id}
