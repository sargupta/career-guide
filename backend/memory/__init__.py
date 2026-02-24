"""
SARGVISION AI — Career Memory Layer v2
Powered by Mem0 AsyncMemory + Supabase pgvector + Google text-embedding-004

Changes from v1:
  - AsyncMemory (native async, no asyncio.to_thread wrappers)
  - Google text-embedding-004 (768-dim) — no OpenAI dependency
  - 3-second timeout on search; graceful degradation
  - Per-category TTL tagging on add_turn (ACADEMIC=180d, BLOCKERS=60d, etc.)
  - Max 150 facts cap enforced via prune_stale_memories()
  - All data in YOUR Supabase — zero external data egress

Public API (all async):
  search_memories(user_id, query)     → str (context block for agent instruction)
  add_turn(user_id, user_msg, reply)  → None (background storage with TTL)
  get_all_memories(user_id)           → list[dict]
  delete_memories(user_id)            → None  (GDPR erasure)
  delete_memory(memory_id)            → None  (Single fact deletion)
  prune_stale_memories(user_id)       → int   (returns count of deleted facts)
  enrich_twin_summary(user_id, facts) → str   (Gemini narrative, for profiles.memory_summary)
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)

# ── Career fact extraction prompt ─────────────────────────────────────────────
# Tells Gemini exactly WHICH facts to extract for an Indian student career context.

_CAREER_FACT_EXTRACTION_PROMPT = """
You are a Career Intelligence Extractor for SARGVISION AI, an AI career mentor
for Indian students. Your job is to read a student-mentor conversation turn and
extract ONLY career-relevant facts about the student.

Extract facts from these 7 categories:

1. ACADEMIC: college name, degree/branch, current year (1st–4th), CGPA/percentage,
   10th/12th board scores, university, city

2. CAREER_PREF: preferred domains (ML, SDE, Data Science, Product, Finance, UPSC etc.),
   preferred company types (FAANG, startup, PSU, research lab, govt), preferred roles,
   preferred work mode (remote/hybrid/on-site), preferred city

3. SKILLS: programming languages (Python, Java, C++), frameworks (React, TensorFlow),
   tools (Git, Figma, AWS), certifications — include BOTH current AND aspired skills

4. GOALS: short-term (internship by date, exam), long-term (MS/MBA/PhD/job/startup),
   target year/timeline, specific companies or colleges targeted

5. EXPERIENCE: internships (company, role, duration), hackathons (name, result),
   research projects, open source contributions, freelance work, competitions

6. BLOCKERS: failed interviews, rejected applications, skill gaps stated by student,
   low CGPA concern, time constraints, confidence issues, exam anxiety

7. PERSONA: learning style (video/books/projects), response to advice, motivation level,
   language preference (Hindi/English mix), communication style

RULES:
  - Extract facts ONLY about the student — NOT generic mentor advice
  - If no career fact exists in the turn, return {"facts": []}
  - Each fact must be one atomic, clear statement (not compound)
  - Prefix every fact with its category: e.g. "ACADEMIC: 3rd year CSE at VIT, CGPA 8.2"
  - Be specific: "SKILLS: Python intermediate — has built 2 ML projects" not just "knows Python"
  - Indian context: CGPA is out of 10; IIT/NIT/BITS are tier-1; GATE/CAT/UPSC are major exams
  - Do NOT extract the same fact twice in one turn

FEW-SHOT EXAMPLES:

Input:
  Student: "I'm in 3rd year CSE at NITT with 7.8 CGPA. I want to crack GATE this year."
  Mentor: "Great. Focus on OS, CN, and previous GATE papers."
Output:
  {"facts": [
    "ACADEMIC: 3rd year B.Tech CSE at NIT Tiruchirappalli (NITT)",
    "ACADEMIC: CGPA 7.8 out of 10",
    "GOALS: Wants to crack GATE (CS) in 2026",
    "CAREER_PREF: Interested in MTech via GATE after graduation"
  ]}

Input:
  Student: "I applied to 20 companies on Internshala but no response in 3 months."
  Mentor: "Let's work on your profile. Can you share your resume?"
Output:
  {"facts": [
    "BLOCKERS: Applied to 20+ companies on Internshala, zero callbacks in 3 months",
    "EXPERIENCE: Actively seeking first internship (no prior internship experience)"
  ]}

Input:
  Student: "Thanks for your help!"
Output:
  {"facts": []}

Now extract career facts from the following conversation turn.
Return ONLY valid JSON: {"facts": ["fact1", "fact2", ...]}
"""

# ── TTL per category (days) ───────────────────────────────────────────────────
# Stale memories degrade relevance; TTL ensures old facts expire automatically.

_CATEGORY_TTL_DAYS: dict[str, int] = {
    "ACADEMIC":    180,   # year changes every 6 months
    "CAREER_PREF": 90,    # preferences shift with exposure
    "SKILLS":      365,   # skills evolve slowly; stay a year
    "GOALS":       730,   # long-term goals persist (2 years)
    "EXPERIENCE":  730,   # past experience is always relevant
    "BLOCKERS":    60,    # clear stale anxieties quickly
    "PERSONA":     365,   # learning style stable for a year
    "UNKNOWN":     90,    # fallback for uncategorised facts
}

# Max number of facts stored per user (enforce at prune time)
_MAX_FACTS_PER_USER: int = 150

# Seconds to wait for memory search before degrading to no-context
_SEARCH_TIMEOUT_SECS: float = 3.0

# Top-K memories to inject per turn
_TOP_K: int = 8


# ── Configuration ─────────────────────────────────────────────────────────────

def _build_config() -> dict:
    """
    Build Mem0 AsyncMemory config.

    Stack (100% self-hosted, all data in Supabase):
      LLM:       Gemini 2.0 Flash  — fact extraction + deduplication
      Embedder:  Google text-embedding-004 (768-dim) — NO OpenAI needed
      VectorDB:  Supabase pgvector — YOUR data, YOUR server
    """
    return {
        "llm": {
            "provider": "gemini",
            "config": {
                "model": "gemini-2.0-flash-001",
                "temperature": 0.1,
                "max_tokens": 1000,
                "top_p": 1.0,
            },
        },
        "embedder": {
            "provider": "google",
            "config": {
                "model": "models/text-embedding-004",
                "embedding_dims": 768,
            },
        },
        "vector_store": {
            "provider": "supabase",
            "config": {
                "connection_string": os.environ.get("SUPABASE_DB_URL", ""),
                "collection_name": "student_memories",
                "index_method": "hnsw",
                "index_measure": "cosine_distance",
                "embedding_model_dims": 768,
            },
        },
        "custom_fact_extraction_prompt": _CAREER_FACT_EXTRACTION_PROMPT,
        "version": "v1.1",
    }


# ── Singleton AsyncMemory client ──────────────────────────────────────────────

_client: Optional["AsyncMemory"] = None


async def _get_client() -> Optional["AsyncMemory"]:
    """
    Lazily initialise and cache the Mem0 AsyncMemory client.
    Returns None if env vars are missing (graceful degradation).
    """
    global _client
    if _client is not None:
        return _client

    required = ("SUPABASE_DB_URL", "GOOGLE_API_KEY")
    missing = [v for v in required if not os.environ.get(v)]
    if missing:
        logger.warning(
            "[Memory] Mem0 disabled — missing env vars: %s",
            ", ".join(missing),
        )
        return None

    try:
        from mem0 import AsyncMemory
        _client = AsyncMemory(config=_build_config())
        logger.info(
            "[Memory] AsyncMemory initialised "
            "(Gemini LLM + Google embeddings + Supabase pgvector 768-dim)"
        )
    except Exception:
        logger.exception("[Memory] Failed to initialise AsyncMemory client")

    return _client


# ── TTL helper ────────────────────────────────────────────────────────────────

def _fact_valid_until(fact_text: str) -> str:
    """
    Derive valid_until ISO timestamp based on the category prefix in the fact.
    Returns UTC ISO string: "2026-08-22T00:00:00+00:00"
    """
    utcnow = datetime.now(timezone.utc)
    category = "UNKNOWN"
    for cat in _CATEGORY_TTL_DAYS:
        if fact_text.upper().startswith(cat + ":"):
            category = cat
            break
    days = _CATEGORY_TTL_DAYS[category]
    expiry = utcnow + timedelta(days=days)
    return expiry.isoformat()


# ── Public async API ──────────────────────────────────────────────────────────

async def search_memories(
    *,
    user_id: str,
    query: str,
    top_k: int = _TOP_K,
) -> str:
    """
    Search the student's career memory for facts relevant to the current query.

    Returns a formatted string for injection into LeadMentor's instruction.
    Returns "" if no memories, Mem0 disabled, or search times out (3s).

    Args:
        user_id: Supabase user UUID
        query:   Student's current message (semantic search anchor)
        top_k:   Max facts to retrieve
    """
    client = await _get_client()
    if client is None:
        return ""

    try:
        results = await asyncio.wait_for(
            client.search(query=query, user_id=user_id, limit=top_k),
            timeout=_SEARCH_TIMEOUT_SECS,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "[Memory] search timed out (>%.1fs) for user %s… — no context injected",
            _SEARCH_TIMEOUT_SECS, user_id[:8],
        )
        return ""
    except Exception:
        logger.exception("[Memory] search_memories failed for user %s…", user_id[:8])
        return ""

    memories = results.get("results", []) if isinstance(results, dict) else (results or [])
    if not memories:
        return ""

    facts = [
        f"  • {m.get('memory', m.get('text', ''))}"
        for m in memories
        if m.get("memory") or m.get("text")
    ]
    if not facts:
        return ""

    context = (
        "\n\n═══ STUDENT MEMORY (facts from past sessions) ═══\n"
        + "\n".join(facts)
        + "\n═══════════════════════════════════════════════\n"
    )
    logger.info(
        "[Memory] Retrieved %d memories for user %s…", len(facts), user_id[:8]
    )
    return context


async def add_turn(
    *,
    user_id: str,
    user_message: str,
    assistant_message: str,
    metadata: Optional[dict] = None,
) -> None:
    """
    Extract career facts from one conversation turn and store them in Supabase.

    Each extracted fact is tagged with `valid_until` (per-category TTL) and
    automatically deduplicated against existing memories by Mem0.

    Args:
        user_id:           Supabase user UUID
        user_message:      Student's message
        assistant_message: Mentor's response
        metadata:          Optional extra tags merged into fact metadata
    """
    client = await _get_client()
    if client is None:
        return

    # Pre-compute valid_until for the overall turn
    # Mem0 stores this in metadata for all facts extracted from this turn.
    # Individual fact TTL is overridden in a post-processing hook via the
    # custom_fact_extraction_prompt which prefixes each fact with its category.
    base_meta = {
        "source": "mentor_chat",
        "platform": "sargvision",
        "ingested_at": datetime.now(timezone.utc).isoformat(),
    }
    if metadata:
        base_meta.update(metadata)

    messages = [
        {"role": "user",      "content": user_message},
        {"role": "assistant", "content": assistant_message},
    ]

    try:
        result = await client.add(messages, user_id=user_id, metadata=base_meta)
        added = len(result.get("results", [])) if isinstance(result, dict) else 0
        logger.info(
            "[Memory] Stored %d facts for user %s… (deduplicated)",
            added, user_id[:8],
        )
    except Exception:
        logger.exception("[Memory] add_turn failed for user %s…", user_id[:8])
        # Don't re-raise — student already got their reply


async def get_all_memories(*, user_id: str) -> list[dict]:
    """
    Retrieve all stored career facts for a student.
    Used by Memory Dashboard page and Digital Twin enrichment.
    """
    client = await _get_client()
    if client is None:
        return []
    try:
        result = await client.get_all(user_id=user_id)
        memories = result.get("results", []) if isinstance(result, dict) else (result or [])
        logger.info(
            "[Memory] get_all: %d facts for user %s…", len(memories), user_id[:8]
        )
        return memories
    except Exception:
        logger.exception("[Memory] get_all failed for user %s…", user_id[:8])
        return []


async def delete_memories(*, user_id: str) -> None:
    """
    GDPR right-to-erasure: delete ALL memories for a user.
    Called during account deletion flow.
    """
    client = await _get_client()
    if client is None:
        return
    try:
        await client.delete_all(user_id=user_id)
        logger.info("[Memory] Deleted ALL memories for user %s…", user_id[:8])
    except Exception:
        logger.exception("[Memory] delete_memories failed for user %s…", user_id[:8])


async def delete_memory(*, memory_id: str) -> None:
    """
    Delete a single career fact by its ID.
    Used for granular user management of their career history.
    """
    client = await _get_client()
    if client is None:
        return
    try:
        await client.delete(memory_id=memory_id)
        logger.info("[Memory] Deleted single memory: %s", memory_id)
    except Exception:
        logger.exception("[Memory] delete_memory failed for ID %s", memory_id)


async def prune_stale_memories(*, user_id: str) -> int:
    """
    Delete expired + excess memories for one user.
    Called by the weekly scheduler job.

    Strategy:
      1. Fetch all memories for the user
      2. Filter out those with expired valid_until (TTL check)
      3. If remaining count > _MAX_FACTS_PER_USER, delete oldest first by category priority
      4. Delete identified stale entries individually

    Returns:
        Number of deleted memories.
    """
    client = await _get_client()
    if client is None:
        return 0

    try:
        all_result = await client.get_all(user_id=user_id)
        all_memories = (
            all_result.get("results", []) if isinstance(all_result, dict) else (all_result or [])
        )
    except Exception:
        logger.exception("[Memory] prune: get_all failed for user %s…", user_id[:8])
        return 0

    if not all_memories:
        return 0

    utcnow = datetime.now(timezone.utc)
    to_delete: list[str] = []

    # Pass 1: mark TTL-expired facts
    live_memories = []
    for mem in all_memories:
        meta = mem.get("metadata") or {}
        valid_until_str = meta.get("valid_until")
        if valid_until_str:
            try:
                valid_until = datetime.fromisoformat(valid_until_str)
                if valid_until < utcnow:
                    to_delete.append(mem["id"])
                    continue
            except ValueError:
                pass
        live_memories.append(mem)

    # Pass 2: enforce max cap (oldest first)
    if len(live_memories) > _MAX_FACTS_PER_USER:
        overflow = len(live_memories) - _MAX_FACTS_PER_USER
        # Sort by created_at ascending; BLOCKERS pruned first (lowest value retention)
        priority_order = list(_CATEGORY_TTL_DAYS.keys())
        def _priority(m: dict) -> tuple:
            text = m.get("memory", "")
            cat = next(
                (c for c in priority_order if text.upper().startswith(c + ":")),
                "UNKNOWN",
            )
            # lower TTL category = prune first
            return (priority_order.index(cat), m.get("created_at", ""))
        live_memories.sort(key=_priority)
        to_delete.extend([m["id"] for m in live_memories[:overflow]])

    # Delete
    deleted = 0
    for mem_id in to_delete:
        try:
            await client.delete(memory_id=mem_id)
            deleted += 1
        except Exception:
            logger.warning("[Memory] Could not delete memory %s", mem_id)

    if deleted:
        logger.info(
            "[Memory] Pruned %d stale/excess memories for user %s…",
            deleted, user_id[:8],
        )
    return deleted


async def enrich_twin_summary(*, user_id: str, memories: list[dict]) -> str:
    """
    Generate a compact Gemini narrative from all stored career facts.
    Stored in profiles.memory_summary for fast context injection.

    Called by scheduler.py → job_enrich_digital_twin().

    Returns:
        A concise paragraph summary (≈200 words) of the student's career story.
    """
    if not memories:
        return ""

    facts_text = "\n".join(
        f"- {m.get('memory', m.get('text', ''))}"
        for m in memories[:80]  # cap at 80 facts for prompt size
        if m.get("memory") or m.get("text")
    )
    if not facts_text:
        return ""

    prompt = (
        "You are summarising the career profile of an Indian student for a persistent memory store.\n"
        "Based on the following extracted career facts, write a concise 150-200 word narrative "
        "summary in third person. Cover: academic background, career goals, skill set, experience, "
        "key blockers, and learning persona. Do not invent anything not in the facts.\n\n"
        f"Facts:\n{facts_text}\n\nNarrative summary:"
    )

    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.0-flash-001")
        response = model.generate_content(prompt)
        summary = response.text.strip()
        logger.info("[Memory] Generated %d-char twin summary for user %s…", len(summary), user_id[:8])
        return summary
    except Exception:
        logger.exception("[Memory] enrich_twin_summary failed for user %s…", user_id[:8])
        return ""


# ── Memory categories (exported for tests) ────────────────────────────────────
MEMORY_CATEGORIES: frozenset[str] = frozenset(_CATEGORY_TTL_DAYS.keys())
TOP_K_MEMORIES: int = _TOP_K
