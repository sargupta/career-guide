"""
SARGVISION AI — NeMo Guardrails Wrapper
Sits between the FastAPI /mentor/chat endpoint and the ADK LeadMentor.

Architecture:
  User Input
      ↓
  [INPUT RAILS]     ← jailbreak, off-topic, PII exfiltration check
      ↓
  ADK LeadMentor    ← orchestrates sub-agents
      ↓
  [OUTPUT RAILS]    ← hallucination flag, PII in response, career relevance
      ↓
  User Response

Custom Actions (called from .co files):
  - check_output_for_hallucination
  - check_output_for_pii
  - check_output_career_relevance
"""

import os
import re
import logging
from pathlib import Path
from functools import lru_cache
from typing import Optional

logger = logging.getLogger(__name__)

# ── PII patterns ───────────────────────────────────────────────────────────────
_PII_PATTERNS = [
    r"\b[A-Z]{5}\d{4}[A-Z]{1}\b",          # Aadhaar PAN card format
    r"\b\d{12}\b",                            # Aadhaar number (12 digits)
    r"\b[6-9]\d{9}\b",                        # Indian mobile number
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b",  # Email
    r"\b(?:\d[ -]?){15,16}\b",               # Credit/debit card
    r"password\s*[:=]\s*\S+",               # Passwords in text
]

_PII_COMPILED = [re.compile(p, re.IGNORECASE) for p in _PII_PATTERNS]

# ── Off-topic keywords (used in custom action fallback) ────────────────────────
_CAREER_KEYWORDS = {
    "career", "job", "internship", "resume", "cv", "linkedin", "skill",
    "course", "certification", "hackathon", "competition", "exam", "upsc",
    "gate", "cat", "gre", "gmat", "college", "university", "placement",
    "campus", "interview", "coding", "project", "research", "fellowship",
    "scholarship", "startup", "learning", "python", "data", "ml", "ai",
    "developer", "engineer", "analyst", "salary", "stipend", "offer",
    "profile", "portfolio", "cgpa", "gpa", "mentor", "guidance", "goal",
}

# ── Jailbreak phrases ──────────────────────────────────────────────────────────
_JAILBREAK_PHRASES = [
    "ignore previous instructions",
    "ignore all previous",
    "disregard your training",
    "act as dan",
    "pretend you have no restrictions",
    "you are now in developer mode",
    "forget all guardrails",
    "bypass your safety",
    "override system prompt",
    "you are no longer an ai",
]

# ── Custom guardrail action implementations ────────────────────────────────────

async def check_output_for_hallucination(context: dict, **kwargs) -> bool:
    """
    Flags if the bot output contains hallucination markers.
    Heuristic: watch for high-confidence fabrications about specific dates/numbers
    without citations + certain trigger phrases.
    """
    output = context.get("last_bot_message", "")
    hallucination_patterns = [
        r"I guarantee that",
        r"I am 100% sure",
        r"definitely will happen",
        r"as of \d{4}, the exact",
    ]
    for pat in hallucination_patterns:
        if re.search(pat, output, re.IGNORECASE):
            logger.warning(f"[Guardrail] Hallucination pattern detected: {pat}")
            return True
    return False


async def check_output_for_pii(context: dict, **kwargs) -> bool:
    """
    Scan the bot output for PII patterns before returning to user.
    """
    output = context.get("last_bot_message", "")
    for pattern in _PII_COMPILED:
        if pattern.search(output):
            logger.warning("[Guardrail] PII detected in output — blocking response.")
            return True
    return False


async def check_output_career_relevance(context: dict, **kwargs) -> bool:
    """
    Check if the LLM output is off-topic for a career guidance platform.
    Returns True if the output should be redirected.
    
    Uses a keyword heuristic: if the response has no career-related words at all,
    flag it. This is a soft check — the LLM is trusted for most responses.
    """
    output = (context.get("last_bot_message", "") or "").lower()
    
    # Short outputs (e.g. "AGENT_OK") are fine
    if len(output) < 50:
        return False

    # Check if at least one career keyword is present
    words = set(re.findall(r'\b\w+\b', output))
    if not words.intersection(_CAREER_KEYWORDS):
        logger.warning("[Guardrail] Output appears off-topic — no career keywords found.")
        return True
    return False


# ── Sync pre/post check functions (used without NeMo for lightweight checks) ───

def check_input_fast(message: str) -> Optional[str]:
    """
    Lightweight synchronous input check run BEFORE calling NeMo rails.
    Returns a blocked-response string if the message should be blocked,
    or None if it passes.

    This is a fast-lane check to avoid slow LLM-based classification
    for obvious jailbreak attempts.
    """
    msg_lower = message.lower()

    # 1. Jailbreak
    for phrase in _JAILBREAK_PHRASES:
        if phrase in msg_lower:
            return (
                "🚫 That's a jailbreak attempt — I'm designed to be your Career Mentor "
                "and I can't deviate from that. Let's focus: what career goal can I help you with today?"
            )

    # 2. SQL / Prompt Injection
    sql_patterns = [r"'\s*OR\s*'?1'?\s*=\s*'?1", r"SELECT\s+\*\s+FROM", r"DROP\s+TABLE", r"--\s"]
    for pat in sql_patterns:
        if re.search(pat, message, re.IGNORECASE):
            return (
                "🚫 I spotted something that looks like a SQL injection attempt. "
                "I only help with career guidance — your data is safe with me!"
            )

    # 3. PII exfiltration attempt
    for pattern in _PII_COMPILED:
        if pattern.search(message):
            return (
                "🔒 I noticed you may have shared sensitive personal data (like an Aadhaar, "
                "PAN, or phone number). I don't store sensitive information — please avoid "
                "sharing such details. How can I help your career today?"
            )

    return None  # Passed — proceed


def filter_output_fast(response: str) -> str:
    """
    Lightweight synchronous output scan run AFTER the LLM responds.
    Redacts any PII patterns found in the response text.
    """
    for pattern in _PII_COMPILED:
        response = pattern.sub("[REDACTED]", response)
    return response


# ── NeMo Rails loader ──────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _load_rails_config():
    """
    Lazily loads and caches the NeMo Guardrails config.
    The config is read from the `guardrails/` directory and cached for performance.
    """
    try:
        from nemoguardrails import RailsConfig
        config_path = Path(__file__).parent
        config = RailsConfig.from_path(str(config_path))
        logger.info("[Guardrails] NeMo RailsConfig loaded successfully.")
        return config
    except Exception as e:
        logger.error(f"[Guardrails] Failed to load NeMo config: {e}")
        return None


def get_rails():
    """
    Returns an initialized LLMRails instance.
    Returns None if NeMo is unavailable (graceful degradation).
    """
    try:
        from nemoguardrails import LLMRails
        from nemoguardrails.actions import action

        # Register custom action callbacks
        config = _load_rails_config()
        if config is None:
            return None

        rails = LLMRails(config=config)

        # Register the custom Python actions called from .co flows
        rails.register_action(check_output_for_hallucination, name="check_output_for_hallucination")
        rails.register_action(check_output_for_pii,           name="check_output_for_pii")
        rails.register_action(check_output_career_relevance,  name="check_output_career_relevance")

        return rails
    except Exception as e:
        logger.error(f"[Guardrails] LLMRails init failed: {e}")
        return None
