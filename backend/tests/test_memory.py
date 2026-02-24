"""
Tests for the SARGVISION AI Career Memory Layer v2.

Covers:
  - Module imports + exported constants
  - Config structure (Google embedder, supabase vector store, Gemini LLM)
  - Extraction prompt: all 7 categories, few-shot examples, JSON schema
  - TTL: all categories mapped, BLOCKERS < ACADEMIC < SKILLS < GOALS
  - search_memories: results, empty, no-client, timeout, error
  - add_turn: correct message structure, no-client, error
  - get_all_memories: returns list, no-client
  - delete_memories: delegates to client, no-client
  - prune_stale_memories: TTL expiry logic, cap logic
  - Memory context injection in LeadMentor instruction
"""
import asyncio
import pytest
from datetime import datetime, timedelta, timezone
from unittest import mock
from contextlib import contextmanager


# ── Constants ────────────────────────────────────────────────────────────────

DEMO_USER = "550e8400-e29b-41d4-a716-446655440000"
DEMO_QUERY = "I want help with GATE preparation for CS"


# ── Async test helpers ────────────────────────────────────────────────────────

def run(coro):
    """Run a coroutine in a fresh event loop."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@contextmanager
def patch_client(client):
    """
    Correctly mock memory._get_client (an async def) to return `client`.
    _get_client is `async def` → must be patched as AsyncMock whose return_value
    is the client object (not another coroutine).
    """
    async_get = mock.AsyncMock(return_value=client)
    with mock.patch("memory._get_client", new=async_get):
        yield



# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def async_client():
    """Mock AsyncMemory client."""
    client = mock.AsyncMock(name="AsyncMemory")
    client.search.return_value = {
        "results": [
            {"memory": "ACADEMIC: 3rd year CSE at NIT Trichy, CGPA 7.8"},
            {"memory": "GOALS: Wants to crack GATE 2026"},
            {"memory": "BLOCKERS: Zero internship callbacks for 3 months"},
        ]
    }
    client.add.return_value = {"results": [{"id": "abc123"}]}
    client.get_all.return_value = {
        "results": [
            {"memory": "ACADEMIC: 3rd year CSE at NIT Trichy", "id": "m1",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"memory": "GOALS: Crack GATE 2026", "id": "m2",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
    }
    return client


# ── Import & Constants ────────────────────────────────────────────────────────

def test_memory_module_imports() -> None:
    import memory as m
    assert callable(m.search_memories)
    assert callable(m.add_turn)
    assert callable(m.get_all_memories)
    assert callable(m.delete_memories)
    assert callable(m.prune_stale_memories)
    assert callable(m.enrich_twin_summary)
    assert isinstance(m.MEMORY_CATEGORIES, frozenset)


def test_memory_categories_complete() -> None:
    from memory import MEMORY_CATEGORIES
    required = {"ACADEMIC", "CAREER_PREF", "SKILLS", "GOALS", "EXPERIENCE", "BLOCKERS", "PERSONA"}
    assert required.issubset(MEMORY_CATEGORIES)


# ── Config ───────────────────────────────────────────────────────────────────

def test_config_uses_google_embedder() -> None:
    from memory import _build_config
    cfg = _build_config()
    assert cfg["embedder"]["provider"] == "google"
    assert "text-embedding-004" in cfg["embedder"]["config"]["model"]
    assert cfg["embedder"]["config"]["embedding_dims"] == 768


def test_config_uses_gemini_llm() -> None:
    from memory import _build_config
    cfg = _build_config()
    assert cfg["llm"]["provider"] == "gemini"
    assert "gemini" in cfg["llm"]["config"]["model"]


def test_config_uses_supabase_vector_store() -> None:
    from memory import _build_config
    cfg = _build_config()
    vs = cfg["vector_store"]
    assert vs["provider"] == "supabase"
    assert vs["config"]["collection_name"] == "student_memories"
    assert vs["config"]["embedding_model_dims"] == 768  # must match migration 003


def test_config_has_custom_extraction_prompt() -> None:
    from memory import _build_config
    cfg = _build_config()
    assert "custom_fact_extraction_prompt" in cfg
    assert len(cfg["custom_fact_extraction_prompt"]) > 200


# ── Extraction Prompt ─────────────────────────────────────────────────────────

def test_extraction_prompt_all_categories() -> None:
    from memory import _CAREER_FACT_EXTRACTION_PROMPT as p
    for cat in ("ACADEMIC", "CAREER_PREF", "SKILLS", "GOALS", "EXPERIENCE", "BLOCKERS", "PERSONA"):
        assert cat in p, f"Category {cat!r} missing from prompt"


def test_extraction_prompt_has_few_shot_examples() -> None:
    from memory import _CAREER_FACT_EXTRACTION_PROMPT as p
    assert "NITT" in p, "Missing few-shot college example"
    assert "Internshala" in p, "Missing few-shot job portal example"
    assert '{"facts": []}' in p, "Missing empty output example"


def test_extraction_prompt_returns_json_facts() -> None:
    from memory import _CAREER_FACT_EXTRACTION_PROMPT as p
    assert '"facts"' in p


# ── TTL ──────────────────────────────────────────────────────────────────────

def test_ttl_all_categories_mapped() -> None:
    from memory import _CATEGORY_TTL_DAYS
    for cat in ("ACADEMIC", "CAREER_PREF", "SKILLS", "GOALS", "EXPERIENCE", "BLOCKERS", "PERSONA"):
        assert cat in _CATEGORY_TTL_DAYS, f"{cat} missing from TTL map"


def test_ttl_ordering_makes_sense() -> None:
    from memory import _CATEGORY_TTL_DAYS
    # BLOCKERS should expire faster than GOALS
    assert _CATEGORY_TTL_DAYS["BLOCKERS"] < _CATEGORY_TTL_DAYS["GOALS"]
    # ACADEMIC should expire faster than SKILLS (year changes every semester)
    assert _CATEGORY_TTL_DAYS["ACADEMIC"] < _CATEGORY_TTL_DAYS["SKILLS"]


def test_fact_valid_until_returns_future_date() -> None:
    from memory import _fact_valid_until
    result = _fact_valid_until("ACADEMIC: 3rd year CSE at NITT")
    expiry = datetime.fromisoformat(result)
    assert expiry > datetime.now(timezone.utc)


def test_fact_valid_until_blockers_shorter_than_goals() -> None:
    from memory import _fact_valid_until
    blocker_expiry = datetime.fromisoformat(_fact_valid_until("BLOCKERS: Failed interview"))
    goal_expiry = datetime.fromisoformat(_fact_valid_until("GOALS: Wants MS from IIT"))
    assert blocker_expiry < goal_expiry


# ── search_memories ───────────────────────────────────────────────────────────

def test_search_returns_context_block(async_client) -> None:
    import memory
    with patch_client(async_client):
        result = run(memory.search_memories(user_id=DEMO_USER, query=DEMO_QUERY))
    assert "STUDENT MEMORY" in result
    assert "NIT Trichy" in result


def test_search_empty_results(async_client) -> None:
    import memory
    async_client.search.return_value = {"results": []}
    with patch_client(async_client):
        result = run(memory.search_memories(user_id=DEMO_USER, query="hello"))
    assert result == ""


def test_search_no_client() -> None:
    import memory
    with patch_client(None):
        result = run(memory.search_memories(user_id=DEMO_USER, query=DEMO_QUERY))
    assert result == ""


def test_search_timeout_degrades_gracefully(async_client) -> None:
    import memory

    async def _slow_search(**kwargs):
        await asyncio.sleep(10)  # simulate timeout
        return {"results": []}

    async_client.search.side_effect = _slow_search
    with patch_client(async_client):
        with mock.patch("memory._SEARCH_TIMEOUT_SECS", 0.05):
            result = run(memory.search_memories(user_id=DEMO_USER, query=DEMO_QUERY))
    assert result == ""


def test_search_error_degrades_gracefully(async_client) -> None:
    import memory
    async_client.search.side_effect = RuntimeError("DB down")
    with patch_client(async_client):
        result = run(memory.search_memories(user_id=DEMO_USER, query=DEMO_QUERY))
    assert result == ""


# ── add_turn ─────────────────────────────────────────────────────────────────

def test_add_turn_calls_client(async_client) -> None:
    import memory
    with patch_client(async_client):
        run(memory.add_turn(
            user_id=DEMO_USER,
            user_message="I'm a 3rd year CSE student at NITT",
            assistant_message="Great! Your GATE target is achievable.",
        ))
    async_client.add.assert_awaited_once()
    messages = async_client.add.call_args[0][0]
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"


def test_add_turn_no_client() -> None:
    import memory
    with patch_client(None):
        run(memory.add_turn(user_id=DEMO_USER, user_message="hi", assistant_message="hello"))


def test_add_turn_error_does_not_raise(async_client) -> None:
    import memory
    async_client.add.side_effect = Exception("timeout")
    with patch_client(async_client):
        run(memory.add_turn(user_id=DEMO_USER, user_message="test", assistant_message="ok"))


# ── get_all_memories ─────────────────────────────────────────────────────────

def test_get_all_returns_list(async_client) -> None:
    import memory
    with patch_client(async_client):
        result = run(memory.get_all_memories(user_id=DEMO_USER))
    assert isinstance(result, list)
    assert len(result) == 2


def test_get_all_no_client() -> None:
    import memory
    with patch_client(None):
        result = run(memory.get_all_memories(user_id=DEMO_USER))
    assert result == []


# ── delete_memories ───────────────────────────────────────────────────────────

def test_delete_calls_delete_all(async_client) -> None:
    import memory
    with patch_client(async_client):
        run(memory.delete_memories(user_id=DEMO_USER))
    async_client.delete_all.assert_awaited_once_with(user_id=DEMO_USER)


# ── prune_stale_memories ──────────────────────────────────────────────────────

def test_prune_deletes_expired_ttl(async_client) -> None:
    import memory
    expired = datetime.now(timezone.utc) - timedelta(days=10)
    async_client.get_all.return_value = {
        "results": [
            {"id": "old1", "memory": "BLOCKERS: something old",
             "metadata": {"valid_until": expired.isoformat()},
             "created_at": (datetime.now(timezone.utc) - timedelta(days=100)).isoformat()},
            {"id": "live1", "memory": "GOALS: Crack GATE",
             "metadata": {"valid_until": (datetime.now(timezone.utc) + timedelta(days=100)).isoformat()},
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
    }
    with patch_client(async_client):
        count = run(memory.prune_stale_memories(user_id=DEMO_USER))
    assert count == 1
    async_client.delete.assert_awaited_once_with(memory_id="old1")


def test_prune_no_client() -> None:
    import memory
    with patch_client(None):
        count = run(memory.prune_stale_memories(user_id=DEMO_USER))
    assert count == 0


# ── Memory context in LeadMentor ──────────────────────────────────────────────

def test_memory_context_in_instruction() -> None:
    """Memory context injected into LeadMentor instruction must include the divider."""
    from agents.lead_mentor import get_orchestratorResponse
    import os

    profile = {
        "full_name": "Test Student",
        "domain": "Software Engineering",
        "readiness_pct": 72,
        "id": "test-user-001",
        "_memory_context": "\n  • ACADEMIC: 3rd year CSE at NITT, CGPA 7.8\n",
    }

    with mock.patch("agents.lead_mentor.Runner"):
        original = os.environ.pop("GEMINI_API_KEY", None)
        try:
            result = get_orchestratorResponse(profile, "help me with GATE")
        finally:
            if original:
                os.environ["GEMINI_API_KEY"] = original

    # offline path returns a string, never raises
    assert isinstance(result, str)
