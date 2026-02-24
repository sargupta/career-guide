"""
SARGVISION AI — Persona Engine
Classifies users into behavioural archetypes based on onboarding signals.
Saves to Supabase and provides a persona context block for all AI agents.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from db.supabase_client import get_supabase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Archetype Constants
# ---------------------------------------------------------------------------
class Archetype:
    MAANG_ASPIRANT    = "MAANG_ASPIRANT"
    GOVT_ASPIRANT     = "GOVT_ASPIRANT"
    RESEARCHER        = "RESEARCHER"
    ACADEMIC_TOPPER   = "ACADEMIC_TOPPER"
    CREATIVE_HUSTLER  = "CREATIVE_HUSTLER"
    BREADWINNER       = "BREADWINNER"
    CAREER_SWITCHER   = "CAREER_SWITCHER"
    NATURAL_LEADER    = "NATURAL_LEADER"
    DISTRACTED_LEARNER = "DISTRACTED_LEARNER"
    RURAL_HOPEFUL     = "RURAL_HOPEFUL"
    EXPLORER          = "EXPLORER"          # Safe fallback


class Tone:
    STRICT_COACH   = "strict_coach"
    PEER           = "peer"
    EXECUTIVE      = "executive"
    COMPANION      = "companion"
    RESEARCHER     = "researcher"
    ELDER_SIBLING  = "elder_sibling"


# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------
@dataclass
class OnboardingSignals:
    """Raw answers from the 5-question onboarding survey."""
    primary_goal: str          # 'maang', 'research', 'govt', 'creative', 'explore', 'stable_job'
    learning_style: str        # 'visual', 'text', 'audio', 'bullets'
    biggest_worry: str         # 'placement', 'financial', 'lost', 'exam_prep', 'competition'
    device_quality: str        # 'basic_android', 'mid_range', 'high_end'
    language_pref: str         # 'en', 'hi', 'hinglish'
    # optional enrichment (auto-derived from profile)
    degree_type: Optional[str] = None   # 'BTech', 'BSc', 'BA', 'BBA', etc.
    institution_tier: Optional[str] = None  # 'tier1', 'tier2', 'tier3'
    current_year: Optional[int] = None


@dataclass
class PersonaProfile:
    """Fully classified persona, ready for DB storage and LLM injection."""
    user_id: str
    archetype: str
    segment: str
    confidence_score: float
    learning_style: str
    motivation_type: str
    info_density: str
    confidence_level: int
    primary_anxiety: str
    social_context: str
    tone_preference: str
    language_preference: str
    nudge_channel: str
    nudge_hour_ist: int
    device_tier: str
    connectivity: str
    memory_hint_1: str = ""
    memory_hint_2: str = ""
    memory_hint_3: str = ""
    primary_mcp_tool: str = ""
    secondary_mcp_tool: str = ""
    signals_raw: dict = field(default_factory=dict)
    classifier_version: str = "v1.0"


# ---------------------------------------------------------------------------
# Archetype Rules Engine
# ---------------------------------------------------------------------------
_GOAL_TO_ARCHETYPE = {
    "maang":      Archetype.MAANG_ASPIRANT,
    "research":   Archetype.RESEARCHER,
    "govt":       Archetype.GOVT_ASPIRANT,
    "creative":   Archetype.CREATIVE_HUSTLER,
    "stable_job": Archetype.BREADWINNER,
    "explore":    Archetype.EXPLORER,
}

_ARCHETYPE_DEFAULTS: dict[str, dict] = {
    Archetype.MAANG_ASPIRANT: {
        "segment": "IT", "motivation_type": "intrinsic", "info_density": "high",
        "tone_preference": Tone.EXECUTIVE, "nudge_hour_ist": 8,
        "nudge_channel": "dashboard", "social_context": "hustle_culture",
        "primary_mcp_tool": "live_web_scout", "secondary_mcp_tool": "github",
        "memory_hint_1": "Student is targeting MAANG-level companies. Focus on elite roles only.",
        "memory_hint_2": "High technical bar; skip entry-level or generic advice.",
        "memory_hint_3": "Prefers data-backed, citation-heavy responses.",
    },
    Archetype.RESEARCHER: {
        "segment": "RESEARCH", "motivation_type": "intrinsic", "info_density": "high",
        "tone_preference": Tone.RESEARCHER, "nudge_hour_ist": 22,
        "nudge_channel": "dashboard", "social_context": "academic_peer",
        "primary_mcp_tool": "academic_radar", "secondary_mcp_tool": "rss_arxiv",
        "memory_hint_1": "Student is on a PhD/Research track. Keep advice domain-specific.",
        "memory_hint_2": "Dislikes generic career advice; prefers lab/fellowship-level opportunities.",
        "memory_hint_3": "Needs citation-level evidence; no oversimplification.",
    },
    Archetype.GOVT_ASPIRANT: {
        "segment": "GOVT", "motivation_type": "extrinsic", "info_density": "medium",
        "tone_preference": Tone.STRICT_COACH, "nudge_hour_ist": 5,
        "nudge_channel": "whatsapp", "social_context": "family_expectation",
        "primary_mcp_tool": "simplification_agent", "secondary_mcp_tool": "news_scout",
        "memory_hint_1": "Student is preparing for govt exams (SSC/UPSC/Bank). Stay on-topic.",
        "memory_hint_2": "Extremely disciplined but needs micro-steps, not big-picture strategy.",
        "memory_hint_3": "Zero tolerance for non-exam content; suggest Plan B only when asked.",
    },
    Archetype.ACADEMIC_TOPPER: {
        "segment": "ACADEMIA", "motivation_type": "mixed", "info_density": "high",
        "tone_preference": Tone.RESEARCHER, "nudge_hour_ist": 21,
        "nudge_channel": "dashboard", "social_context": "academic_peer",
        "primary_mcp_tool": "academic_radar", "secondary_mcp_tool": "simplification_agent",
        "memory_hint_1": "Student is a university topper. Existing academic identity is strong.",
        "memory_hint_2": "Needs GPA-to-industry bridging; avoid undermining academic credentials.",
        "memory_hint_3": "Targeting elite Masters/PhD programs or research fellowships.",
    },
    Archetype.CREATIVE_HUSTLER: {
        "segment": "CREATIVE", "motivation_type": "intrinsic", "info_density": "low",
        "tone_preference": Tone.COMPANION, "nudge_hour_ist": 12,
        "nudge_channel": "whatsapp", "social_context": "hustle_culture",
        "primary_mcp_tool": "academic_radar", "secondary_mcp_tool": "live_web_scout",
        "memory_hint_1": "Student is portfolio-first. Avoid asking for CV or formal resume.",
        "memory_hint_2": "Hates corporate jargon; prefers freelance/gig opportunities.",
        "memory_hint_3": "Responds to 'Creative Challenges' and 'Hackathons', not 'Job Portals'.",
    },
    Archetype.BREADWINNER: {
        "segment": "SALES", "motivation_type": "extrinsic", "info_density": "medium",
        "tone_preference": Tone.PEER, "nudge_hour_ist": 20,
        "nudge_channel": "whatsapp", "social_context": "family_expectation",
        "primary_mcp_tool": "opportunity_scout", "secondary_mcp_tool": "simplification_agent",
        "memory_hint_1": "Student has financial urgency. Prioritise immediate hiring/salary data.",
        "memory_hint_2": "Maximum 15-minute tasks; working part-time already.",
        "memory_hint_3": "Focus on local/regional job market first.",
    },
    Archetype.CAREER_SWITCHER: {
        "segment": "IT", "motivation_type": "mixed", "info_density": "medium",
        "tone_preference": Tone.COMPANION, "nudge_hour_ist": 21,
        "nudge_channel": "whatsapp", "social_context": "academic_peer",
        "primary_mcp_tool": "skilling_coach", "secondary_mcp_tool": "github",
        "memory_hint_1": "Student is pivoting careers. Bridge transferable skills explicitly.",
        "memory_hint_2": "High anxiety about 'lost time'; frame prior experience as an asset.",
        "memory_hint_3": "Needs very short, weekly learning paths — long-term plans cause paralysis.",
    },
    Archetype.NATURAL_LEADER: {
        "segment": "MANAGEMENT", "motivation_type": "extrinsic", "info_density": "medium",
        "tone_preference": Tone.EXECUTIVE, "nudge_hour_ist": 8,
        "nudge_channel": "whatsapp", "social_context": "hustle_culture",
        "primary_mcp_tool": "news_scout", "secondary_mcp_tool": "opportunity_scout",
        "memory_hint_1": "Student has zero interest in coding. Never suggest technical courses.",
        "memory_hint_2": "High social leverage; map all activities to leadership competencies.",
        "memory_hint_3": "Motivation = Power and Impact. Frame all advice around prestige/scale.",
    },
    Archetype.DISTRACTED_LEARNER: {
        "segment": "GENERAL", "motivation_type": "extrinsic", "info_density": "low",
        "tone_preference": Tone.PEER, "nudge_hour_ist": 11,
        "nudge_channel": "whatsapp", "social_context": "community_cohort",
        "primary_mcp_tool": "opportunity_scout", "secondary_mcp_tool": "news_scout",
        "memory_hint_1": "Student has low focus. Keep every task under 5 minutes.",
        "memory_hint_2": "Use gaming/RPG analogies. XP, Quests, Streaks work well.",
        "memory_hint_3": "Language barrier possible; use simple English or Hinglish.",
    },
    Archetype.RURAL_HOPEFUL: {
        "segment": "GOVT", "motivation_type": "extrinsic", "info_density": "low",
        "tone_preference": Tone.ELDER_SIBLING, "nudge_hour_ist": 19,
        "nudge_channel": "whatsapp", "social_context": "family_expectation",
        "primary_mcp_tool": "news_scout", "secondary_mcp_tool": "simplification_agent",
        "memory_hint_1": "Student on low-bandwidth connection. Avoid suggesting heavy content.",
        "memory_hint_2": "Prefers Hinglish/Hindi. Always translate complex terms.",
        "memory_hint_3": "First-generation learner. Provide extra context on corporate norms.",
    },
    Archetype.EXPLORER: {
        "segment": "GENERAL", "motivation_type": "intrinsic", "info_density": "medium",
        "tone_preference": Tone.COMPANION, "nudge_hour_ist": 22,
        "nudge_channel": "dashboard", "social_context": "academic_peer",
        "primary_mcp_tool": "opportunity_scout", "secondary_mcp_tool": "academic_radar",
        "memory_hint_1": "Student is undecided. Never lock them into a single career path.",
        "memory_hint_2": "Frame advice as 'Exploration' not 'Decision'.",
        "memory_hint_3": "Highlight intersection points between multiple interests.",
    },
}

_DEVICE_MAP = {
    "basic_android": ("low", "poor"),
    "mid_range": ("mid", "average"),
    "high_end": ("high", "fiber"),
}

_WORRY_TO_ANXIETY = {
    "placement":   "placement_stress",
    "financial":   "financial_urgency",
    "lost":        "lost_unsure",
    "exam_prep":   "exam_prep",
    "competition": "peer_competition",
}

_STYLE_MAP = {
    "visual": ("visual", 4),   # (learning_style, confidence_level_boost)
    "text":   ("text", 6),
    "audio":  ("audio", 4),
    "bullets": ("bullets", 5),
}


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------
def classify_archetype(signals: OnboardingSignals) -> PersonaProfile:
    """
    Rule-based archetype classifier using the 5-question onboarding signals.
    For ambiguous cases, defaults to EXPLORER (safe fallback).
    """
    # Step 1: Map primary goal to base archetype
    archetype = _GOAL_TO_ARCHETYPE.get(signals.primary_goal, Archetype.EXPLORER)
    confidence = 0.80

    # Step 2: Refinements using secondary signals
    if archetype == Archetype.BREADWINNER and signals.biggest_worry == "financial":
        confidence = 0.92

    if signals.primary_goal == "stable_job" and signals.language_pref in ("hi", "hinglish"):
        # Likely rural/low-income context → upgrade to Rural Hopeful
        if signals.institution_tier == "tier3" or signals.degree_type in ("BA", "BCom", "BSc"):
            archetype = Archetype.RURAL_HOPEFUL
            confidence = 0.75

    if signals.primary_goal == "explore" and signals.biggest_worry == "lost":
        # Genuinely unsure → could be Distracted Learner or Explorer
        if signals.device_quality == "basic_android":
            archetype = Archetype.DISTRACTED_LEARNER
            confidence = 0.65

    # Step 3: Pull defaults for this archetype
    defaults = _ARCHETYPE_DEFAULTS.get(archetype, _ARCHETYPE_DEFAULTS[Archetype.EXPLORER])
    device_tier, connectivity = _DEVICE_MAP.get(signals.device_quality, ("mid", "average"))
    learning_style, confidence_level = _STYLE_MAP.get(signals.learning_style, ("text", 5))
    primary_anxiety = _WORRY_TO_ANXIETY.get(signals.biggest_worry, "lost_unsure")

    # Step 4: Build profile
    return PersonaProfile(
        user_id="",  # Filled in by save_profile()
        archetype=archetype,
        segment=defaults["segment"],
        confidence_score=round(confidence, 2),
        learning_style=learning_style,
        motivation_type=defaults["motivation_type"],
        info_density=defaults["info_density"],
        confidence_level=confidence_level,
        primary_anxiety=primary_anxiety,
        social_context=defaults["social_context"],
        tone_preference=defaults["tone_preference"],
        language_preference=signals.language_pref,
        nudge_channel=defaults["nudge_channel"],
        nudge_hour_ist=defaults["nudge_hour_ist"],
        device_tier=device_tier,
        connectivity=connectivity,
        memory_hint_1=defaults.get("memory_hint_1", ""),
        memory_hint_2=defaults.get("memory_hint_2", ""),
        memory_hint_3=defaults.get("memory_hint_3", ""),
        primary_mcp_tool=defaults.get("primary_mcp_tool", ""),
        secondary_mcp_tool=defaults.get("secondary_mcp_tool", ""),
        signals_raw=signals.__dict__,
    )


# ---------------------------------------------------------------------------
# Supabase CRUD
# ---------------------------------------------------------------------------
async def save_profile(user_id: str, profile: PersonaProfile, trigger: str = "onboarding") -> bool:
    """Upsert the persona profile into Supabase."""
    profile.user_id = user_id
    supabase = get_supabase()
    try:
        payload = {
            "user_id": user_id,
            "archetype": profile.archetype,
            "segment": profile.segment,
            "confidence_score": profile.confidence_score,
            "learning_style": profile.learning_style,
            "motivation_type": profile.motivation_type,
            "info_density": profile.info_density,
            "confidence_level": profile.confidence_level,
            "primary_anxiety": profile.primary_anxiety,
            "social_context": profile.social_context,
            "tone_preference": profile.tone_preference,
            "language_preference": profile.language_preference,
            "nudge_channel": profile.nudge_channel,
            "nudge_hour_ist": profile.nudge_hour_ist,
            "device_tier": profile.device_tier,
            "connectivity": profile.connectivity,
            "memory_hint_1": profile.memory_hint_1,
            "memory_hint_2": profile.memory_hint_2,
            "memory_hint_3": profile.memory_hint_3,
            "primary_mcp_tool": profile.primary_mcp_tool,
            "secondary_mcp_tool": profile.secondary_mcp_tool,
            "signals_raw": profile.signals_raw,
            "classifier_version": profile.classifier_version,
            "updated_at": datetime.utcnow().isoformat(),
        }
        supabase.table("user_persona_profiles").upsert(payload, on_conflict="user_id").execute()

        # Log the signal event
        supabase.table("persona_signal_log").insert({
            "user_id": user_id,
            "trigger": trigger,
            "signals_delta": profile.signals_raw,
            "archetype_after": profile.archetype,
        }).execute()

        logger.info(f"[PersonaEngine] Saved profile for {user_id}: {profile.archetype}")
        return True
    except Exception as e:
        logger.error(f"[PersonaEngine] Failed to save profile: {e}")
        return False


async def get_profile(user_id: str) -> Optional[dict]:
    """Fetch a user's persona profile from Supabase."""
    supabase = get_supabase()
    try:
        result = supabase.table("user_persona_profiles") \
            .select("*").eq("user_id", user_id).single().execute()
        return result.data
    except Exception as e:
        logger.warning(f"[PersonaEngine] Profile not found for {user_id}: {e}")
        return None


async def update_profile(user_id: str, delta: dict, trigger: str = "manual_override") -> bool:
    """Partial update to the persona profile."""
    supabase = get_supabase()
    try:
        delta["updated_at"] = datetime.utcnow().isoformat()
        delta["is_manually_updated"] = True
        supabase.table("user_persona_profiles").update(delta).eq("user_id", user_id).execute()

        supabase.table("persona_signal_log").insert({
            "user_id": user_id,
            "trigger": trigger,
            "signals_delta": delta,
        }).execute()
        return True
    except Exception as e:
        logger.error(f"[PersonaEngine] Failed to update profile: {e}")
        return False


# ---------------------------------------------------------------------------
# Persona Context Block (for LLM injection)
# ---------------------------------------------------------------------------
def build_persona_context(profile: dict) -> str:
    """
    Builds the persona context block injected into the Lead Mentor system prompt.
    Call this at the start of every mentor session.
    """
    if not profile:
        return ""

    tone_labels = {
        "strict_coach":   "a strict, structured coach",
        "peer":           "a supportive peer or older friend",
        "executive":      "a high-performance executive partner",
        "companion":      "a curious intellectual companion",
        "researcher":     "a senior research lead or professor",
        "elder_sibling":  "a protective, warm elder sibling",
    }
    tone_desc = tone_labels.get(profile.get("tone_preference", "peer"), "a supportive peer")

    lang_map = {"en": "English", "hi": "Hindi", "hinglish": "Hinglish (mix of Hindi and English)"}
    language = lang_map.get(profile.get("language_preference", "en"), "English")

    density_map = {
        "high":   "detailed, high-density responses with all relevant data",
        "medium": "balanced, concise summaries with key highlights",
        "low":    "ultra-short, bullet-point-first, no fluff",
    }
    density = density_map.get(profile.get("info_density", "medium"), "balanced responses")

    hints = "\n".join(filter(None, [
        profile.get("memory_hint_1"),
        profile.get("memory_hint_2"),
        profile.get("memory_hint_3"),
    ]))

    return f"""
=== STUDENT PERSONA PROFILE ===
Archetype: {profile.get('archetype', 'EXPLORER')} | Segment: {profile.get('segment', 'GENERAL')}
Primary Anxiety: {profile.get('primary_anxiety', 'unknown')}
Confidence Level: {profile.get('confidence_level', 5)}/10

COMMUNICATION RULES:
- Act as {tone_desc}.
- Respond in {language}.
- Provide {density}.
- Archetype-Specific Tool Priority: Use {profile.get('primary_mcp_tool', 'opportunity_scout')} first.

KEY MEMORY FACTS (ALWAYS CONSIDER):
{hints}
================================
"""
