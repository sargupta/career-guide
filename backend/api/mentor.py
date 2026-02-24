"""
SARGVISION AI — Mentor Chat Endpoint (v2)
/mentor/*

6-step memory-augmented pipeline. All memory ops are now native async
(AsyncMemory, no asyncio.to_thread wrappers).

  1. Input guardrail (sync fast-lane)
  2. Memory search (async, 3s timeout, degrades gracefully)
  3. Profile fetch (sync Supabase REST)
  4. ADK LeadMentor orchestration (with memory context injected)
  5. Output guardrail (sync fast-lane PII redaction)
  6. Background memory storage (asyncio.create_task, fire-and-forget)
"""
import asyncio
import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from agents.lead_mentor import get_orchestratorResponse
from api.auth import get_current_user
from db.supabase_client import get_supabase_anon
from guardrails import check_input_fast, filter_output_fast
from memory import add_turn, delete_memories, delete_memory, get_all_memories, search_memories
from services.gamification import add_xp_and_update_streak
from services.persona_engine import get_profile
from services.semantic_cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str


# ── Stub routes (Phase 9) ─────────────────────────────────────────────────────

@router.post("/sessions")
async def create_session():
    raise NotImplementedError


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, body: dict):
    raise NotImplementedError


# ── Main chat endpoint ─────────────────────────────────────────────────────────

@router.post("/chat")
async def mentor_chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    """
    Guardrailed, memory-augmented mentor chat.

    Pipeline:
      1. Input guardrail (sync)     — jailbreak / SQL / PII
      2. Memory search (async)      — top-8 career facts, 3s timeout
      3. Profile fetch (sync)       — Supabase REST
      4. ADK LeadMentor (thread)    — sub-agents + MCP toolsets
      5. Output guardrail (sync)    — PII redaction
      6. Memory store (background)  — AsyncMemory.add() fire-and-forget
    """
    user_id: str = user["user_id"]
    token: str = user["token"]

    # ── 1. INPUT GUARDRAIL ────────────────────────────────────────────────────
    blocked = check_input_fast(req.message)
    if blocked:
        logger.info("[Guardrail] Input blocked for user %s…", user_id[:8])
        return {
            "reply": blocked,
            "guardrail": {"action": "blocked", "stage": "input"},
            "memory": None,
        }

    # ── 1.5 SEMANTIC CACHE CHECK ──────────────────────────────────────────────
    cached_reply = await asyncio.to_thread(cache.get_cached_response, req.message)
    if cached_reply:
        return {
            "reply": cached_reply,
            "guardrail": {"action": "passed", "stage": "cache"},
            "memory": {"cache_hit": True},
            "gamification": {"message": "Quick response from memory!"},
        }

    # ── 2. MEMORY SEARCH (native async, 3s timeout built-in) ─────────────────
    memory_context: str = await search_memories(user_id=user_id, query=req.message)
    memory_retrieved = bool(memory_context)

    # ── 3. PROFILE FETCH ──────────────────────────────────────────────────────
    supabase = get_supabase_anon(token)
    profile_response = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    user_profile: dict = profile_response.data or {}

    # ── 3a. PERSONA PRE-FETCH ────────────────────────────────────────────────
    # Fetch the user's persona profile and inject into user_profile dict
    # so lead_mentor.py can build the personalised system prompt.
    persona_profile = await get_profile(user_id)
    if persona_profile:
        user_profile["_persona_profile"] = persona_profile
        logger.info(
            "[Persona] Injected '%s' persona for user %s…",
            persona_profile.get("archetype", "UNKNOWN"), user_id[:8],
        )
    else:
        # Graceful degradation: EXPLORER defaults used if no persona is saved yet
        logger.info("[Persona] No persona found for %s — using EXPLORER defaults", user_id[:8])
    
    # ── 3b. FETCH PARENT NUDGES ──────────────────────────────────────────────
    # Look for active nudges from linked parents
    nudge_res = supabase.table("parent_nudges").select("content").eq("student_id", user_id).eq("is_active", True).execute()
    if nudge_res.data:
        nudges_text = "\n".join([f"- {n['content']}" for n in nudge_res.data])
        user_profile["_parent_nudges"] = nudges_text
        logger.info("[Nudge] Injected %d active parent nudges.", len(nudge_res.data))

    # Inject memory context into user_profile
    if memory_context:
        user_profile["_memory_context"] = memory_context
        logger.info(
            "[Memory] Injected %d-char context for user %s…",
            len(memory_context), user_id[:8],
        )
    elif user_profile.get("memory_summary"):
        # Fallback: use the weekly compressed summary if vector search found nothing
        user_profile["_memory_context"] = (
            "\n\n═══ STUDENT LONG-TERM SUMMARY (from last weekly enrichment) ═══\n"
            + user_profile["memory_summary"]
            + "\n═══════════════════════════════════════════════════════════════\n"
        )

    # ── 4. ADK LEAD MENTOR ───────────────────────────────────────────────────
    # ADK runner is sync — wrap in thread so we don't block the event loop
    reply: str = await asyncio.to_thread(
        get_orchestratorResponse, user_profile, req.message
    )

    # ── 5. OUTPUT GUARDRAIL ──────────────────────────────────────────────────
    reply = filter_output_fast(reply)

    # ── 6. BACKGROUND MEMORY STORAGE (fire-and-forget) ───────────────────────
    # Student gets reply immediately; memory indexing happens in the background.
    # AsyncMemory.add() is awaitable — schedule it as a task.
    async def _store():
        await add_turn(
            user_id=user_id,
            user_message=req.message,
            assistant_message=reply,
        )
        # ── 6.5 UPDATE SEMANTIC CACHE (background) ──────────────────────────
        await asyncio.to_thread(cache.update_cache, req.message, reply)

    asyncio.create_task(_store())

    # ── 7. GAMIFICATION XP ───────────────────────────────────────────────────
    try:
        xp_res = await asyncio.to_thread(add_xp_and_update_streak, get_supabase_anon(token), user_id, "mentor_chat_turn")
    except Exception as e:
        logger.exception("Failed to award XP for mentor chat")
        xp_res = {}

    return {
        "reply": reply,
        "guardrail": {"action": "passed", "stage": "output"},
        "memory": {
            "retrieved": memory_retrieved,
            "context_chars": len(memory_context),
            "summary_fallback": not memory_retrieved and bool(user_profile.get("memory_summary")),
        },
        "gamification": xp_res,
    }


# ── Memory management endpoints ───────────────────────────────────────────────

@router.get("/memories")
async def get_my_memories(user: dict = Depends(get_current_user)):
    """
    Returns all stored career facts for this student.
    Powers the Memory Dashboard page (Phase 9).
    """
    user_id: str = user["user_id"]
    memories = await get_all_memories(user_id=user_id)
    return {"memories": memories, "count": len(memories)}


@router.delete("/memories")
async def delete_my_memories(user: dict = Depends(get_current_user)):
    """
    GDPR right-to-erasure: deletes ALL stored memories for this user.
    Also called in the account deletion flow.
    """
    user_id: str = user["user_id"]
    await delete_memories(user_id=user_id)
    return {"message": "All career memories deleted.", "user_id": user_id}
@router.delete("/memories/{memory_id}")
async def delete_single_memory(memory_id: str, user: dict = Depends(get_current_user)):
    """
    Granular deletion of a single career fact.
    """
    # Note: Single deletion doesn't strictly verify ownership yet as Mem0 
    # v1 abstraction is lean, but the ID is a global UUID from the student_memories table.
    await delete_memory(memory_id=memory_id)
    return {"message": "Memory fact deleted.", "memory_id": memory_id}
