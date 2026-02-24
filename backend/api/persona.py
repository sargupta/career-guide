"""
SARGVISION AI — Persona API
Endpoints for onboarding survey submission and persona profile management.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from api.auth import get_current_user
from services.persona_engine import (
    OnboardingSignals,
    classify_archetype,
    save_profile,
    get_profile,
    update_profile,
)
from db.supabase_client import get_supabase
from services.gamification import add_xp_and_update_streak

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/persona", tags=["persona"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class OnboardingRequest(BaseModel):
    primary_goal: str = Field(
        ...,
        description="maang | research | govt | creative | stable_job | explore"
    )
    learning_style: str = Field(
        ...,
        description="visual | text | audio | bullets"
    )
    biggest_worry: str = Field(
        ...,
        description="placement | financial | lost | exam_prep | competition"
    )
    device_quality: str = Field(
        ...,
        description="basic_android | mid_range | high_end"
    )
    language_pref: str = Field(
        default="en",
        description="en | hi | hinglish"
    )


class PersonaUpdateRequest(BaseModel):
    tone_preference: Optional[str] = None
    language_preference: Optional[str] = None
    nudge_channel: Optional[str] = None
    nudge_hour_ist: Optional[int] = Field(default=None, ge=0, le=23)
    info_density: Optional[str] = None
    learning_style: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/onboard", summary="Submit onboarding survey and classify persona")
async def onboard_persona(
    req: OnboardingRequest,
    user=Depends(get_current_user),
):
    """
    Accepts the 5-question onboarding survey, classifies the user into an
    archetype, and saves the persona profile to Supabase.
    """
    user_id = user["id"]

    # Pull enrichment data from academic_enrollments for richer classification
    supabase = get_supabase()
    enroll = None
    try:
        enroll_resp = supabase.table("academic_enrollments") \
            .select("degree_type, current_year").eq("user_id", user_id).single().execute()
        enroll = enroll_resp.data
    except Exception:
        pass  # Enrichment is optional

    signals = OnboardingSignals(
        primary_goal=req.primary_goal,
        learning_style=req.learning_style,
        biggest_worry=req.biggest_worry,
        device_quality=req.device_quality,
        language_pref=req.language_pref,
        degree_type=enroll.get("degree_type") if enroll else None,
        current_year=enroll.get("current_year") if enroll else None,
    )

    profile = classify_archetype(signals)
    saved = await save_profile(user_id, profile, trigger="onboarding")

    if not saved:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save persona profile. Retry later."
        )

    # Award Gamification XP for onboarding
    try:
        xp_res = add_xp_and_update_streak(supabase, user_id, "onboarding_complete")
    except Exception as e:
        logger.exception("Failed to award XP for onboarding")
        xp_res = {}

    logger.info(f"[PersonaAPI] User {user_id} classified as {profile.archetype}")
    return {
        "archetype": profile.archetype,
        "segment": profile.segment,
        "tone_preference": profile.tone_preference,
        "confidence_score": profile.confidence_score,
        "message": f"Welcome! Your learning profile has been personalised for {profile.archetype.replace('_', ' ').title()} mode.",
        "gamification": xp_res,
    }


@router.get("/me", summary="Get current user's persona profile")
async def get_my_persona(user=Depends(get_current_user)):
    """Returns the full persona profile for the authenticated user."""
    user_id = user["id"]
    profile = await get_profile(user_id)
    if not profile:
        # Return a default profile if not yet onboarded
        return {
            "archetype": "EXPLORER",
            "onboarded": False,
            "message": "Complete onboarding to unlock personalised guidance.",
        }
    profile["onboarded"] = True
    return profile


@router.patch("/me", summary="Update user's persona preferences")
async def update_my_persona(
    req: PersonaUpdateRequest,
    user=Depends(get_current_user),
):
    """
    Allows users to override specific persona fields (e.g., change nudge channel
    or preferred language) without triggering a full re-classification.
    """
    user_id = user["id"]
    delta = {k: v for k, v in req.model_dump().items() if v is not None}
    if not delta:
        raise HTTPException(status_code=400, detail="No fields to update.")

    success = await update_profile(user_id, delta, trigger="user_preference_override")
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update persona profile.")

    return {"message": "Persona preferences updated.", "updated_fields": list(delta.keys())}


@router.post("/reclassify", summary="Force a persona reclassification (used after major profile changes)")
async def reclassify_persona(user=Depends(get_current_user)):
    """
    Triggers a re-run of the classifier using the most recent raw signals.
    Useful when the user significantly changes their career path or domain.
    """
    user_id = user["id"]
    existing = await get_profile(user_id)
    if not existing or not existing.get("signals_raw"):
        raise HTTPException(status_code=404, detail="No existing signals found. Complete onboarding first.")

    raw = existing["signals_raw"]
    signals = OnboardingSignals(**raw)
    profile = classify_archetype(signals)
    await save_profile(user_id, profile, trigger="reclassify")

    return {
        "archetype": profile.archetype,
        "message": f"Profile reclassified to {profile.archetype.replace('_', ' ').title()}.",
    }
