# AI Coding Assistant Context — SARGVISION AI

> This document provides context for AI coding assistants (Gemini CLI, GitHub Copilot, Cursor, Claude, etc.)
> to understand the SARGVISION AI project and assist with development effectively.
>
> Inspired by [google/adk-python AGENTS.md](https://github.com/google/adk-python/blob/main/AGENTS.md)
>
> **Note:** `gemini.md` at the repo root is a legacy context file from the planning phase. `AGENTS.md` (this file) is the current, authoritative source. `gemini.md` contains the original product brief, design system, and monetisation model — useful background reading but not the operational guide.

---

## Project Overview

**SARGVISION AI** is a Voice-First, AI-powered career co-pilot for Indian students.
It acts as a "Digital Twin" — tracking academic history, skills, and aspirations, then matching
students with live opportunities, personalized learning paths, and mentor-quality advice.

### Core Philosophy
- **Multi-Agent Orchestration** via Google ADK (A2A protocol)
- **Voice-First UX** — Mentor chat is designed for spoken input
- **Guardrail-First Safety** — Every LLM call passes through NeMo Guardrails
- **Digital Twin** — Student data persisted in Supabase, mirrored locally in SQLite for agents
- **Planning is MUST** - Before writing any code,think in depth, create a plan and divide the task into smaller steps. Make sure to follow that strictly. 
### Key User Flows
1. Student logs in → `/dashboard` shows Readiness Score + recommended actions
2. Student chats with Lead Mentor → routes to specialist sub-agents (Opportunity Scout, Skilling Coach, etc.)
3. Lead Mentor browser-navigates real job sites via Playwright MCP → returns live results
4. Student logs activities/achievements → feeds back into the Digital Twin score

---

## Repository Structure

```
career-guide/
├── AGENTS.md                  ← You are here
├── README.md
├── PLAN.md                    ← Full product roadmap (all phases)
├── .env.example               ← Required environment variables
│
├── backend/                   ← FastAPI + Google ADK Python backend
│   ├── main.py                ← FastAPI app entry point; all router mounts
│   ├── CODING_STANDARDS.md    ← Python style guide (read before writing code)
│   │
│   ├── api/                   ← FastAPI route handlers (one file per domain)
│   │   ├── auth.py            ← Supabase JWT validation, get_current_user dep
│   │   ├── users.py           ← /users/me, /users/me/academic, /users/me/aspirations
│   │   ├── domains.py         ← /domains — career path catalogue
│   │   ├── activities.py      ← /activities CRUD (projects, competitions, etc.)
│   │   ├── achievements.py    ← /achievements portfolio CRUD
│   │   ├── learning.py        ← /learning/paths, /learning/enrollments, /learning/enroll
│   │   ├── readiness.py       ← /readiness, /readiness/refresh (readiness score engine)
│   │   ├── opportunities.py   ← /opportunities (curated seed; Phase 9 → LiveWebScout)
│   │   ├── mentor.py          ← /mentor/chat — guardrailed gateway to LeadMentor agent
│   │   └── whatsapp.py        ← /whatsapp webhook (Phase 9)
│   │
│   ├── agents/                ← Google ADK agent implementations
│   │   ├── lead_mentor.py     ← Orchestrator Agent (LlmAgent); holds all sub-agents as AgentTools
│   │   └── sub_agents.py      ← All 5 specialist sub-agents
│   │
│   ├── skills/                ← SKILL.md files loaded by sub-agents as instructions
│   │   ├── opportunity_scout/ ← Web search for internships/scholarships
│   │   ├── skilling_coach/    ← 4-week learning plan generator
│   │   ├── hackathon_scout/   ← Live hackathon finder
│   │   ├── news_scout/        ← Industry news + hiring trends
│   │   ├── project_copilot/   ← GitHub repo reviewer
│   │   └── live_web_scout/    ← Playwright-powered live job site navigator
│   │
│   ├── guardrails/            ← NeMo Guardrails safety layer
│   │   ├── __init__.py        ← Fast-lane sync checks + async NeMo custom actions
│   │   ├── config.yml         ← NeMo YAML config (model, enabled rails)
│   │   ├── rails_input.co     ← Colang: jailbreak, off-topic, PII, career intent
│   │   └── rails_output.co    ← Colang: hallucination, PII, career relevance
│   │
│   ├── core/
│   │   └── config.py          ← Settings (Pydantic BaseSettings, reads .env)
│   │
│   ├── db/
│   │   ├── supabase_client.py ← Supabase client factory (anon + service)
│   │   ├── migrations/        ← SQL schema files
│   │   └── seed.py            ← Seeds demo user + career path data
│   │
│   ├── tests/
│   │   ├── test_api.py        ← Full API test suite (19 endpoints, httpx-based)
│   │   ├── test_agents.py     ← Agent + MCP diagnostic (15 checks)
│   │   └── test_guardrails.py ← Guardrail layer test (31 checks)
│   │
│   ├── services/
│   │   └── whatsapp_service.py ← Twilio WhatsApp send helpers (weekly snapshot, deadline alert)
│   │
│   ├── scheduler.py           ← APScheduler background jobs (weekly snapshots, deadline alerts)
│   ├── seed_sqlite.py         ← Seeds test.db (local SQLite Digital Twin for agent MCP use)
│   ├── test.db                ← Local SQLite DB — used by mcp-server-sqlite in agent tests
│   ├── requirements.txt       ← Python dependencies (pip install -r requirements.txt)
│   │
│   └── [stray test files]     ← test_adk.py, test_adk_2.py, test_adk_factory.py, test_api.py
│                                 (root-level scratch files from dev; canonical tests are in tests/)
│
└── frontend/                  ← Next.js 14 App Router (TypeScript + Tailwind CSS)
    └── src/
        ├── app/               ← App Router pages (file-based routing)
        │   ├── (auth)/        ← Login/signup (Supabase Auth UI)
        │   ├── dashboard/     ← Main student dashboard
        │   ├── mentor/        ← Voice-first AI chat interface
        │   ├── opportunities/ ← Live opportunity cards
        │   ├── learning/      ← Course progress + enrollment
        │   ├── achievements/  ← Portfolio CRUD
        │   └── timeline/      ← Activity log
        ├── components/        ← Reusable React components (shared across pages)
        └── lib/               ← API client helpers, Supabase browser client, utilities
```

---

## Agent Architecture

### Orchestration Model

```
User Message
    │
    ▼
[NeMo Guardrails]          ← Input: jailbreak / SQL / PII / off-topic
    │
    ▼
LeadMentor (LlmAgent)      ← gemini-2.5-flash, orchestrator
    │
    ├── AgentTool(OpportunityScout)    ← google_search, finds live internships
    ├── AgentTool(SkillingCoach)       ← google_search, builds 4-week plans
    ├── AgentTool(AcademicRadar)       ← ParallelAgent: HackathonScout + NewsScout
    ├── AgentTool(DeveloperCoPilot)    ← GitHub MCP, reviews repos
    ├── AgentTool(LiveWebScout)        ← Playwright MCP, browses Internshala/Unstop
    └── McpToolset(mcp-server-sqlite)  ← Direct SQL access to Digital Twin DB
    │
    ▼
[NeMo Guardrails]          ← Output: PII redaction / hallucination / relevance
    │
    ▼
API Response → Frontend
```

### Agent Structure Convention (Required)

All sub-agents are **factory functions** in `backend/agents/sub_agents.py`.
Every factory must follow this pattern:

```python
def create_<agent_name>() -> Agent | ParallelAgent:
    """One-sentence docstring."""
    return Agent(
        model="gemini-2.5-flash",
        name="<PascalCaseName>",
        description="<Used by LeadMentor to decide when to delegate>",
        instruction=load_skill_instructions("<skill_dir_name>"),
        tools=[...],
    )
```

Every agent needs a matching `SKILL.md` in `backend/skills/<skill_dir_name>/SKILL.md`.

### MCP Toolsets in Use

| MCP Server | Command | Purpose |
|---|---|---|
| `mcp-server-sqlite` | `mcp-server-sqlite --db-path test.db` | Digital Twin DB queries |
| `@playwright/mcp` | `npx @playwright/mcp@latest --headless` | Live web browsing |
| `@modelcontextprotocol/server-github` | `npx @modelcontextprotocol/server-github` | GitHub repo analysis |

**Note:** All MCP toolsets use `StdioConnectionParams` + `StdioServerParameters`.
Brave Search MCP was replaced by `google_search` built-in tool (no API key needed).

---

## Memory Layer (Mem0 + Supabase pgvector)

### Architecture

Every mentor chat turn passes through a memory-augmented pipeline:

```
Student message
      │
      ▼ search_memories(user_id, query)
 ┌────────────────────────────────┐
 │  Supabase pgvector             │  ← YOUR data, YOUR server
 │  (student_memories table)      │
 │  HNSW index, cosine distance   │
 └────────────────────────────────┘
      │  top-8 relevant career facts
      ▼
LeadMentor instruction
  ━━━ WHAT I KNOW ABOUT THIS STUDENT ━━━
  • ACADEMIC: 3rd year CSE at NITT, CGPA 7.8
  • GOALS: Crack GATE 2026
  • BLOCKERS: Zero internship callbacks for 3 months
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      │
      ▼
 ADK LeadMentor (context-aware response)
      │
      ▼ add_turn(user_id, user_msg, reply)  [background, non-blocking]
 ┌────────────────────────────────┐
 │  Gemini 2.0 Flash reads turn   │
 │  Extracts career facts via     │
 │  custom extraction prompt      │
 │  (7 categories, few-shot)      │
 └────────────────────────────────┘
      │  deduplicated facts → embeddings
      ▼
 Supabase pgvector (updated)
```

### Fact Categories & Lifecycle (TTL)

Facts are automatically pruned to maintain relevance (Phase 9.1).

| Category | What gets extracted | TTL (Days) |
|---|---|---|
| `ACADEMIC` | College, degree, year, CGPA, board scores | 180 (semesterly) |
| `CAREER_PREF` | Domains, companies, roles, work mode | 90 (quarterly) |
| `SKILLS` | Current + aspired: languages, frameworks, tools | 365 (annually) |
| `GOALS` | MS/MBA/job, target companies, timelines | 730 (bi-annually) |
| `EXPERIENCE` | Internships, hackathons, competitions | 730 (bi-annually) |
| `BLOCKERS` | Rejections, skill gaps, anxiety, failures | 60 (bi-monthly) |
| `PERSONA` | Learning style, motivation, language pref | 365 (annually) |

### Key Design Decisions (v2)

- **100% your infrastructure**: Vector data stored in your Supabase — zero data goes to Mem0 cloud.
- **Native Async**: Switched to `AsyncMemory` — zero threadpool overhead.
- **Google Embeddings**: `text-embedding-004` (768-dim) — zero OpenAI dependency.
- **Search Timeout**: 3s hard timeout on vector search to prevent mentor latency; falls back to `profiles.memory_summary` if available.
- **Automatic Pruning**: Weekly job enforces a **150-fact cap** per user (oldest first by category priority).
- **Hybrid Defense**: (Phase 10) Kong handles infrastructure safety (Cache, Rate Limit); NeMo handles dialogue safety.

### New API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /mentor/memories` | List all career facts with category filters |
| `DELETE /mentor/memories` | Full GDPR wipe for a student |
| `DELETE /mentor/memories/{id}` | Granular deletion of a single incorrect/outdated fact |
| `GET /readiness/memory-gaps` | Surfaces blockers/gaps for Digital Twin cards |

### Setup (one-time)

1. Apply the DB migration in Supabase dashboard (SQL editor):
   `backend/db/migrations/002_student_memories.sql`
2. Add `SUPABASE_DB_URL` and `OPENAI_API_KEY` to `backend/.env`
3. Memory activates automatically on next `/mentor/chat` call

---

## Background Services

Three background jobs run inside the FastAPI process via `apscheduler`. All times in IST.

| Job | Schedule | What it does |
|---|---|---|
| `job_memory_insights` | **Sun 19:00** | Uses Gemini to find "Gaps" between Career Goals (Memory) and Activities (DB). Generates per-user nudges. |
| `job_weekly_snapshots` | **Sun 20:00** | Sends career digest + memory insights via WhatsApp to `whatsapp_enabled` users. |
| `job_deadline_alerts` | **Daily 00:05** | Checks `opportunities.deadline = today+3days`, sends alert via WhatsApp. |
| `job_enrich_twin` | **Mon 01:00** | Gemini-compresses full memory store into `profiles.memory_summary` for fast LLM context injection. |
| `job_prune_memory` | **Mon 02:00** | Deletes TTL-expired facts and enforces per-category capping. |

Started in `main.py` lifespan (`start_scheduler()`) and stopped on shutdown (`stop_scheduler()`).
Logs all outcomes (and outgoing WhatsApp SIDs) to `whatsapp_messages` table.

### WhatsApp Service (`backend/services/whatsapp_service.py`)

Wrapper around the Twilio WhatsApp API. Two public functions:
- `send_weekly_snapshot(user_data: dict)` — formats and sends the Sunday digest message
- `send_deadline_alert(user: dict, opportunity: dict)` — sends a 3-days-to-deadline alert

Required env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.

### SQLite Digital Twin (`backend/test.db`)

Local SQLite database used by `mcp-server-sqlite` during agent development and testing.
Seeded by `backend/seed_sqlite.py` — run once to populate student profile, activities, and readiness scores for the demo user.

```bash
cd backend && source venv/bin/activate
python seed_sqlite.py   # idempotent — safe to re-run
```

---

## Development Setup

### Requirements
- Python 3.13 (backend)
- Node.js 18+ (frontend)
- Supabase project (credentials in `.env.local`)

### Environment Variables

Copy `.env.example` to `backend/.env` and `frontend/.env.local`. Required keys:

| Variable | Where | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | backend | Gemini API — all ADK agents + guardrails LLM |
| `NEXT_PUBLIC_SUPABASE_URL` | both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both | Supabase anon key (client-side) |
| `SUPABASE_SERVICE_KEY` | backend | Service role key (DB seeding) |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | backend | GitHub MCP (optional, public repos work without) |

### Start Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt   # see requirements.txt for full dependency list
uvicorn main:app --reload         # http://localhost:8000
# Interactive docs: http://localhost:8000/docs
```

### Key Backend Dependencies (`requirements.txt`)

| Package | Purpose |
|---|---|
| `fastapi` + `uvicorn` | Web framework + ASGI server |
| `pydantic` + `pydantic-settings` | Data validation + settings from env |
| `supabase` | Supabase Python client |
| `google-adk` | Google Agent Development Kit |
| `nemoguardrails` | NVIDIA NeMo safety rails |
| `apscheduler` | Background scheduler (weekly jobs) |
| `httpx` | Async HTTP client (used in tests) |
| `python-jose` | JWT decoding for auth |
| `python-dotenv` | `.env` file loading |

### Start Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:3000
```

### Seed Database

```bash
cd backend && source venv/bin/activate
python db/seed.py
# Creates demo user: demo@sargvision.ai / DemoPassword123!
```

---

## Testing

### Run All Tests (Required Before Committing)

```bash
cd backend && source venv/bin/activate

# 1. Full API test suite (19 endpoints) — needs backend running on :8000
python tests/test_api.py

# 2. Agent + MCP diagnostic (15 checks) — needs GOOGLE_API_KEY
python tests/test_agents.py

# 3. Guardrails test suite (31 checks) — fully offline
python tests/test_guardrails.py
```

All three test runners exit with code `0` on full pass, `1` on any failure.
All print colored `✓`/`✗` output with a final `N passed / M total` summary.

### Test Conventions

- Use **pytest** `assert` statements with informative messages for new tests
- Use `@pytest.mark.parametrize` instead of loops ([see CODING_STANDARDS.md §15](backend/CODING_STANDARDS.md#15-testing-pytest-standard))
- Use `mock.create_autospec(spec_set=True)` for Supabase client mocks
- Use `pytest`'s `tmp_path` fixture for SKILL.md file loading tests
- **No randomness** in test inputs — use named deterministic constants

### Demo User Credentials (Auto-Login)

Test scripts auto-login using:
- Email: `demo@sargvision.ai`
- Password: `DemoPassword123!`

Override with env vars: `TEST_EMAIL`, `TEST_PASSWORD`, or provide a pre-fetched `TEST_JWT`.

---

## Style Guide

Full rules are in [`backend/CODING_STANDARDS.md`](backend/CODING_STANDARDS.md).
Key conventions enforced in this project:

### Backend (Python)

| Area | Rule |
|---|---|
| **Indentation** | 4 spaces |
| **Line length** | 100 chars max |
| **Naming** | `snake_case` functions/vars, `PascalCase` classes, `UPPER_SNAKE` constants |
| **Type hints** | Required on all public functions (`collections.abc` for container args) |
| **Docstrings** | Required on all public modules, classes, and functions |
| **Logging** | `%`-style lazy templates, never f-strings in logger calls |
| **Errors** | `raise X from e` to chain; `repr(e)` in logs; never bare `except:` |
| **Constants** | `frozenset` / `tuple` — never bare string/int literals in conditionals |
| **Async** | All FastAPI handlers and NeMo actions are `async def` |
| **Dict naming** | `value_by_key` convention (e.g. `score_by_path_id`) |

### Frontend (TypeScript / Next.js)

| Area | Rule |
|---|---|
| **Language** | TypeScript strict mode — no `any`, no implicit returns |
| **Indentation** | 2 spaces |
| **Component naming** | `PascalCase` files and exports: `MentorChat.tsx`, `OpportunityCard.tsx` |
| **Page files** | Always `page.tsx` + optional `layout.tsx` — Next.js App Router convention |
| **API calls** | All backend calls go through `src/lib/api.ts` — never fetch directly from components |
| **Auth** | Use `@supabase/ssr` with the browser client from `src/lib/supabase.ts` |
| **Styling** | Tailwind CSS utility classes only — no inline `style={{}}` unless unavoidable |
| **State** | React `useState` / `useReducer` for local state; no global state library yet |
| **Env vars** | Only `NEXT_PUBLIC_*` vars are safe to use client-side; secret vars stay in backend |
| **No `console.log` in production** | Use `if (process.env.NODE_ENV === 'development')` guards |

### Before Committing

```bash
# Backend
cd backend && source venv/bin/activate
ruff check . --fix          # lint + auto-fix
ruff format .               # format

# Frontend
cd frontend
npm run lint
npm run build               # must pass with 0 errors
```

---

## Key Invariants (Never Violate)

These are architectural decisions that must be preserved:

1. **Every API route is JWT-protected** via `Depends(get_current_user)` — no unauthenticated data access except `/health`, `/auth/*`, and `/domains`.

2. **All user input to LLMs passes through guardrails** — the `check_input_fast()` + `filter_output_fast()` pipeline in `guardrails/__init__.py` wraps every call in `api/mentor.py`. Do not bypass it.

3. **Sub-agents are factory functions, not singletons** — `get_orchestratorResponse()` creates agents fresh per request so user context can be injected into the instruction at runtime.

4. **SKILL.md is the single source of truth for agent behavior** — agent instructions are loaded at runtime from `skills/<name>/SKILL.md`, not hardcoded in Python. Changes to agent behavior go in the SKILL.md file, not in `sub_agents.py`.

5. **Integer types for DB integer columns** — `academic_year` and `semester` are `INTEGER` in Supabase. Always send/accept `int`, never strings like `"Year 2"`.

6. **Activity type enum values** — valid DB values are: `project`, `competition`, `event`, `internship`, `certification`, `extracurricular`. The `normalised_type()` method on `LogActivityRequest` handles legacy aliases.

7. **google_search is the web search tool** — never re-add Brave MCP. Google Search grounding works without a separate API key via `from google.adk.tools import google_search`.

---

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| 422 on `POST /activities` | Sent `"Year 2"` string for `academic_year` | Send integer `2` |
| 422 on `POST /achievements` | Same issue with `semester` | Send integer `1` or `2` |
| 500 on `/mentor/chat` | `GOOGLE_API_KEY` not set | Add to backend `.env` |
| Agent tools show `tools=0` | Brave MCP was removed | Correct — using `google_search` now |
| NeMo config error | `dialog.user_messages` as list | Fixed — list was removed from config.yml |
| `AttributeError: load_skill_from_directory` | Old import in sub_agents | Use `load_skill_instructions()` instead |
| Frontend 401 on API calls | JWT expired or wrong Supabase env | Re-login or check `.env.local` |

---

## Phase Status

| Phase | Feature | Status |
|---|---|---|
| 1–5 | Auth, profiles, Digital Twin, domains, readiness | ✅ Complete |
| 6 | ADK Lead Mentor + sub-agents + MCP | ✅ Complete |
| 7 | Frontend pages (mentor, timeline, opportunities, learning, achievements) | ✅ Complete |
| 8 | NeMo Guardrails (input/output safety, PII, jailbreak) | ✅ Complete |
| 8.5 | Playwright MCP Live Web Scout + Google Search grounding | ✅ Complete |
| 9 | Observability (Langfuse, Sentry, Prometheus) | 🔲 Planned |
| 9.5 | pytest migration for test suite | 🔲 Planned |
| 10 | WhatsApp bot integration | 🔲 Planned |
| 11 | Production deployment (Cloud Run / Railway) | 🔲 Planned |

---

## Testing Philosophy

Tests in this project serve three distinct purposes — each has a different scope and runner:

| Type | What it tests | File | Needs server? |
|---|---|---|---|
| **API tests** | HTTP contract (status codes, response shapes) | `tests/test_api.py` | ✅ Yes (:8000) |
| **Agent diagnostics** | ADK imports, sub-agent init, live Gemini call, delegation | `tests/test_agents.py` | ❌ No |
| **Guardrail tests** | Jailbreak/PII/output logic — fully offline | `tests/test_guardrails.py` | ❌ No |

### Principles

- **Test the public contract, not internals.** API tests assert HTTP status + response keys, not Supabase query internals. Guardrail tests assert `check_input_fast()` return values, not regex implementation.
- **One failure should not hide others.** Use `@pytest.mark.parametrize` so each case is independently reported.
- **Tests must be deterministic.** No `random`, no `time.time()` in assertions, no network dependency in guardrail tests.
- **Tests must be self-cleaning.** `POST /activities` tests that create records must also `DELETE` them. `tmp_path` for file tests.
- **Agent tests are diagnostic, not regression.** They verify the stack is connected and the LLM responds — not specific response content. Never assert exact LLM text.
- **Guardrail false-positive prevention is as important as detection.** Always test that valid career queries are NOT blocked alongside the block cases.

---

## Docstrings and Comments

### Docstring Format (Required on All Public Symbols)

Use Google-style docstrings. Required on: all public modules, classes, `async def` route handlers, agent factories, guardrail actions, and Pydantic model methods.

```python
def create_live_web_scout() -> Agent:
    """
    Live Web Scout: navigates real Indian career sites via Playwright MCP.

    Uses a headless Chromium browser to extract live opportunities from
    Internshala, Unstop, Naukri, and AngelList with actual deadlines and stipends.

    Returns:
        Agent: Configured ADK LlmAgent with Playwright MCP toolset attached.
    """
```

For FastAPI route handlers, the docstring becomes the OpenAPI operation description:

```python
@router.post("/chat")
async def mentor_chat(req: ChatRequest, user: dict = Depends(get_current_user)):
    """
    Passes user input through guardrails, then to the ADK Lead Mentor.

    Safety pipeline: input rail → LeadMentor + sub-agents → output PII redaction.
    Returns a guardrail metadata field alongside the reply.
    """
```

### Comment Rules

- **Explain WHY, not WHAT.** The code shows what happens; comments explain non-obvious decisions.
- **TODO format:** `# TODO(phase-9): replace seed data with LiveWebScout agent call`
- **FIXME format:** `# FIXME: Supabase SDK is sync — wrap with asyncio.to_thread`
- **HACK format:** `# HACK: ADK Runner requires GEMINI_API_KEY even when GOOGLE_API_KEY is set`
- **Never commit commented-out code.** Delete it; git history preserves it.

---

## Breaking Changes

### Public API Surface Definition

The **public API** of SARGVISION AI is any interface consumed by the frontend or external clients:

| Surface | Definition |
|---|---|
| **REST API** | All routes in `backend/api/` mounted in `main.py` — URL paths, HTTP methods, request body shapes, response shapes, status codes |
| **Auth contract** | JWT format, Supabase token exchange, `get_current_user` dependency signature |
| **Agent response format** | `{"reply": str, "guardrail": {"action": str, "stage": str}}` from `/mentor/chat` |
| **DB schema** | Column names, types, and enum constraints in `db/migrations/` |
| **Guardrail module** | `check_input_fast(message: str) -> Optional[str]` and `filter_output_fast(response: str) -> str` — called by `api/mentor.py` |

**Internal** (not part of public API — may change freely):
- Sub-agent factory implementations
- SKILL.md content
- Guardrail regex patterns
- MCP server choice (e.g. Brave → google_search was internal)

### What Constitutes a Breaking Change

- Removing or renaming an API route
- Changing a required request field name or type (e.g. `"academic_year"` → `"year"`)
- Changing a response field that the frontend reads
- Changing a DB column name or type without a migration
- Changing the `get_current_user` return shape
- Removing a route's authentication requirement

### Checklist for Breaking Changes

Before introducing a breaking change:

- [ ] Is this change necessary, or can it be backwards-compatible (add new field, keep old)?
- [ ] Update `db/migrations/` with a new `.sql` migration file
- [ ] Update all callers in `frontend/src/` that consume the changed contract
- [ ] Update `backend/tests/test_api.py` — both payload and expected response assertions
- [ ] Update `AGENTS.md` → Common Pitfalls table with the old vs new field name
- [ ] Bump the API `version` field in `main.py` (`FastAPI(version=...)`)
- [ ] Document in the commit message body: what changed, why, and what callers must update

---

## Commit Message Format (Required)

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body — explain WHY, not WHAT]

[optional footer — breaking changes, issue refs]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or new endpoint |
| `fix` | Bug fix |
| `refactor` | Code change with no feature/fix |
| `test` | Adding or fixing tests |
| `docs` | AGENTS.md, CODING_STANDARDS.md, SKILL.md updates |
| `chore` | Dependency updates, config changes |
| `perf` | Performance improvement |
| `security` | Security fix (guardrails, auth, PII) |

### Scope (use our module names)

`api`, `agents`, `guardrails`, `db`, `frontend`, `skills`, `tests`, `mcp`

### Examples

```
feat(agents): add LiveWebScout sub-agent with Playwright MCP

Adds a headless Chromium browser agent that navigates Internshala,
Unstop, and Naukri to return live opportunities with real deadlines.
Replaces the static seed data approach for opportunity discovery.

feat(guardrails): replace Brave MCP with google_search grounding

No API key required. OpportunityScout and SkillingCoach now have
tools=1 attached instead of 0.

fix(api): send integer academic_year to Supabase, not string

BREAKING CHANGE: /users/me/academic now requires academic_year as int.
Frontend updated in frontend/src/app/dashboard to send 2, not "Year 2".

security(guardrails): add PII redaction to output rail

Redacts Aadhaar, PAN, mobile, and email patterns from LLM responses
before returning to the user.

docs: add AGENTS.md at repo root

test(guardrails): add 31 offline guardrail tests covering all rail types
```

---

## Key Files and Locations

Quick reference when you need to find or change something specific:

| What | Where |
|---|---|
| Add a new API endpoint | `backend/api/<domain>.py` → mount in `backend/main.py` |
| Change agent behavior | `backend/skills/<skill_name>/SKILL.md` — not the Python factory |
| Add a new sub-agent | `backend/agents/sub_agents.py` → wire in `backend/agents/lead_mentor.py` |
| Change guardrail rules | `backend/guardrails/rails_input.co` or `rails_output.co` |
| Add a fast-lane block pattern | `backend/guardrails/__init__.py` → `_JAILBREAK_PHRASES` or `_PII_COMPILED` |
| Add a new DB table | `backend/db/migrations/00N_<name>.sql` → apply in Supabase dashboard |
| Change career path data | `backend/db/seed.py` |
| Add a new frontend page | `frontend/src/app/<route>/page.tsx` (Next.js App Router) |
| Change auth logic | `backend/api/auth.py` → `get_current_user()` |
| Settings / env vars | `backend/core/config.py` (reads from `.env`) |
| CORS origins | `backend/core/config.py` → `CORS_ORIGINS` |
| API test suite | `backend/tests/test_api.py` |
| Agent diagnostic | `backend/tests/test_agents.py` |
| Guardrail tests | `backend/tests/test_guardrails.py` |
| Python style rules | `backend/CODING_STANDARDS.md` |

---

## Additional Resources

| Resource | URL |
|---|---|
| Google ADK Python docs | https://google.github.io/adk-python/ |
| Google ADK AGENTS.md (inspiration) | https://github.com/google/adk-python/blob/main/AGENTS.md |
| NeMo Guardrails docs | https://docs.nvidia.com/nemo/guardrails/ |
| Playwright MCP | https://github.com/microsoft/playwright-mcp |
| Supabase Python client | https://supabase.com/docs/reference/python/introduction |
| FastAPI docs | https://fastapi.tiangolo.com/ |
| Pydantic v2 | https://docs.pydantic.dev/latest/ |
| Conventional Commits | https://www.conventionalcommits.org/ |
| Google Python Style Guide | https://google.github.io/styleguide/pyguide.html |
| Langfuse (LLM observability) | https://langfuse.com/docs |

---

## Python Tips

> Full examples with our actual code patterns are in [`backend/CODING_STANDARDS.md`](backend/CODING_STANDARDS.md).
> This section is a compact quick-reference for AI assistants.

### General Python Best Practices

- **Constants:** `frozenset` / `tuple` for immutable collections. `UPPER_SNAKE_CASE`. Never bare string literals in conditionals — use a named constant.
- **Naming:** Map names as `value_by_key` (e.g. `score_by_path_id`, `career_path_by_id`).
- **Readability:** f-strings for application code; `%`-style lazy templates for all `logging` calls.
- **Comprehensions:** Prefer list/dict/set comprehensions over `append` loops.
- **Iteration:** Direct `for item in collection:`. `enumerate()` when index needed. `dict.items()` for key+value. `zip()` for parallel.
- **Built-ins:** `any()`, `all()`, `sum()`, `max()`, `sorted()` over manual loops.
- **Default arguments:** `None` sentinel always — never mutable defaults (`list`, `dict`).
- **Type hints:** Required on all public functions. `collections.abc` (`Sequence`, `Mapping`, `Iterable`) for container arguments; concrete types for return values.
- **`NewType`:** Use for domain IDs to prevent transposition (`UserId`, `JwtToken`).
- **Properties:** Only when attribute access syntax genuinely improves clarity. Not for expensive or failure-prone operations.
- **Keyword-only args (`*`):** Enforce for functions with multiple same-type parameters (e.g. `user_id`, `session_id`).
- **`is` / `==`:** `is None`, `is not None` for singleton checks. `==` for value comparison.
- **Numeric literals:** Use `_` separator: `1_000_000`, `30_000`.
- **Context managers:** `with` for all file I/O, HTTP clients (`httpx.Client`), and DB sessions.
- **`try/except/else`:** `else` clause runs only if no exception — use it for the success path.
- **Decorators with `functools.wraps`:** Always apply when writing wrapper decorators to preserve metadata.

### Libraries and Tools

- **`collections.Counter`:** Counting hashable items (e.g. activity types per user).
- **`collections.defaultdict`:** Avoid repeated `setdefault` calls when building grouped dicts.
- **`functools.lru_cache`:** Pure, expensive functions only (e.g. `_load_rails_config`). Never for DB clients or ADK Runners.
- **`functools.cached_property`:** Per-instance lazy computed attributes.
- **`re.compile()`:** Always compile at module level. Use `re.VERBOSE` for complex patterns. Prefer `startswith(tuple)` over regex for simple prefix checks.
- **`pydantic`:** All API request/response bodies. Use `field_validator` + `Field(ge=1, le=6)` for DB-aligned validation.
- **`httpx.Client`:** Used in test suites. Always as a context manager (`with httpx.Client() as c:`).
- **`dataclasses` / `attrs`:** For domain value objects. `frozen=True` for immutable, hashable types.
- **`argparse` / `click`:** For any CLI scripts (e.g. `db/seed.py`).
- **`itertools.chain.from_iterable()`:** Flatten lists of lists without copying.
- **`asyncio.to_thread()`:** Wrap synchronous Supabase SDK calls inside `async def` route handlers.
- Avoid **`pickle`** — use JSON or Pydantic serialization.

### Testing

- **pytest native `assert`** with informative messages: `assert x == 200, f"got {x}"`.
- **`@pytest.mark.parametrize`** for any test with multiple input cases — never a `for` loop in a single test.
- **`@pytest.fixture`** for shared setup (demo user profile, mock Supabase client).
- **`mock.create_autospec(spec_set=True)`** — prevents calling non-existent mock methods.
- **`with mock.patch("module.name")`** — context manager guarantees patch cleanup.
- **`tmp_path`** fixture for SKILL.md file loading tests — auto-cleaned.
- **No randomness.** Use named deterministic constants for all test inputs.
- **Custom assertion helpers** (top-level functions, not class methods): `def assert_guardrail_blocked(result, *, label): ...`
- **Test invariants of the public API** — not internal implementation details.
- Run `pytest tests/` for unit tests. The three `test_*.py` scripts are integration/diagnostic runners.

### Error Handling

- **`raise X from e`** — always chain when converting one exception type to another.
- **`raise X from None`** — suppress original context when it adds noise (e.g. `KeyError` → `ValueError`).
- **Bare `raise`** — re-raise unchanged inside a logging block to preserve the original traceback.
- **`logger.exception()`** inside `except` — automatically captures and logs the traceback.
- **`repr(e)` over `str(e)`** in log messages — shows type and message together.
- **`traceback.format_exc()`** — full chained traceback as a string for forwarding to monitoring.
- **`sys.exit(1)`** for expected error termination in CLI/test scripts. Never `os.abort()` or `os._exit()`.
- **Explicit `return None`** in value-returning functions (`-> Optional[str]`). Bare `return` only in `-> None` functions.
- **Always include context** in exception messages: `raise ValueError(f"academic_year must be 1-6, got {v!r}")`.

