# SARGVISION AI — Gemini Context File

> **Project**: SARGVISION AI  
> **Type**: AI-powered career co-pilot for Indian students  
> **Stack**: Next.js 14 · FastAPI · Google ADK (A2A) · Supabase/Postgres · Tailwind CSS  
> **Repo root**: `/Users/sargupta/career-guide`

---

## What is SARGVISION AI?

SARGVISION AI is a **hyper-personalized, AI-powered career co-pilot** for Indian students across tier-I, tier-II, and tier-III colleges — any stream, any subject, any career path. It sits at the intersection of EdTech and HR Tech, guiding students from their first year of college to graduation and beyond.

**Core idea**: When a student subscribes (e.g., at the start of BTech Year 1), SARGVISION becomes their **lifelong career development record**. It tracks every project, competition, internship, certification, and skill across their academic journey, building a **Digital Twin** — a living model of who they are and where they're headed.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| [`PLAN.md`](./PLAN.md) | **Master implementation plan** — full architecture, DB design, agent topology, API spec, phases (818 lines) |
| [`CRITICAL_REVIEW.md`](./CRITICAL_REVIEW.md) | First-pass critical review of the plan |
| [`CRITICAL_REVIEW_V2.md`](./CRITICAL_REVIEW_V2.md) | Second-pass review — 14 open issues, top 5 flagged for resolution |

---

## Architecture at a Glance

```
Frontend (Next.js 14)
    │ REST
    ▼
FastAPI (Python)
    │
    ├── Orchestrator Agent (Google ADK)
    │       │ A2A Protocol
    │       ├── Mentor Agent
    │       ├── Project Co-Pilot Agent
    │       ├── Opportunity Radar Agent
    │       └── Simplification Agent
    │
    └── MCP Servers (DB, Mentor Context, Opportunities, Learning, etc.)
    
Database: Supabase / Postgres (20+ tables, RLS enabled)
```

---

## Directory Structure (Planned)

```
career-guide/
├── frontend/              # Next.js 14 app (TypeScript + Tailwind)
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   └── lib/               # API clients, utilities
├── backend/               # FastAPI application
│   ├── api/               # Route handlers
│   ├── agents/            # ADK agent definitions
│   ├── mcp_servers/       # MCP server implementations
│   └── db/                # Supabase client, migrations
├── PLAN.md
├── CRITICAL_REVIEW.md
├── CRITICAL_REVIEW_V2.md
└── gemini.md              # ← You are here
```

---

## Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Onboarding** | 5-step guided setup: academic profile → domain → career paths (0–3) → skills → Digital Twin init | P0 |
| **Digital Twin** | Living model: skills radar, competencies, readiness scores per career path | P0 |
| **AI Mentor** | Personalized, empathic AI companion — profile-aware, progress-aware, path-expert | P0 |
| **Activity Timeline** | Log projects, competitions, events, internships by academic year/semester | P0 |
| **Readiness Dashboard** | Preparation score (0–100) per aspirational path; gaps; next best actions | P0 |
| **Opportunity Radar** | Jobs, internships, govt exams, scholarships — matched to user profile | P0 |
| **Achievements Portfolio** | Build portfolio tagged by academic year | P0 |
| **Learning Paths** | Curated NPTEL, SWAYAM, free resources — domain-filtered | P0 |
| **Simplification Agent** | Summarize papers, textbooks — any subject | P1 |
| **Project Co-Pilot** | Domain-appropriate multi-modal asset creation | P1 |

---

## Design System

- **Theme**: Light only. No dark mode.
- **Style**: Glassmorphism — frosted glass cards, backdrop blur, semi-transparent surfaces.
- **Colors**: Off-white/soft grey base; refined teal/soft blue primary; coral/amber CTA accents.
- **Typography**: Plus Jakarta Sans or Outfit (Google Fonts).
- **Spacing**: Generous whitespace. One primary action per view.
- **Animations**: Subtle micro-interactions; purposeful (not decorative).
- **Lite mode**: Reduces blur/animations for low-end devices. Always light.

---

## Agent System

### Orchestrator
- Entry point for all user requests
- Domain-aware + academic-year-aware routing
- Calls specialized agents via A2A (`RemoteA2aAgent`)

### Mentor Agent (Core)
- **Persona**: Empathic companion, not a generic chatbot
- **Context layers**:
  - Core (~800 tokens): profile, 3 paths, readiness scores, last 15 messages
  - Extended (~1200 tokens): Digital Twin summary, last 10 activities, learning progress
  - Full (~3000 tokens): Complete timeline, all skills — for "review my profile" requests
- **MCP tools**: `mentor_get_core_context`, `mentor_get_extended_context`, `mentor_get_full_context`

### Specialist Skill Manifest (A2A Sub-Agents)

These specialized skills are located in `backend/skills/` and can be invoked via the Orchestrator/Lead Mentor.

| Skill | Role & Responsibility |
|-------|-----------------------|
| **OpportunityScout** | Uncovers hyper-relevant internships/jobs for Indian students. |
| **SkillingCoach** | Generates 4-week hyper-personalized learning plans. |
| **NewsScout** | Tracks industry trends, policy changes, and career news. |
| **HackathonScout** | Monitors competitions, hackathons, and case study challenges. |
| **ProjectCopilot** | Technical build assistant for portfolio projects. |
| **LiveWebScout** | Agentic real-time search for transient career info (e.g. current deadlines). |

---

## Database (Supabase/Postgres)

Key tables:
- `users`, `profiles`, `academic_enrollments`
- `user_aspirations` (up to 3 career paths per user)
- `domains`, `career_paths` (with `required_skills_json`, `expected_activities_json`, `recommended_learning_path_ids`)
- `digital_twins` (with `readiness_scores_json`)
- `skills`, `user_skills` (with academic_year)
- `activities` (with `academic_year`, `semester`, `relevance_path_ids`)
- `achievements` (portfolio items, tagged by year/semester)
- `opportunities` (jobs, internships, govt exams, scholarships, fellowships)
- `mentor_sessions`, `mentor_messages`
- `readiness_snapshots` (historical readiness scores)

All tables: **Row Level Security (RLS)** enabled. User data isolated by `auth.uid()`.

---

## Readiness Score Algorithm

```
Readiness (0–100%) = 
  0.35 × SkillsScore    (user skills matched / required skills)
  0.35 × ActivityScore  (relevant activities / expected activities, capped at 100)
  0.20 × LearningScore  (completed relevant courses / recommended courses)
  0.10 × RecencyBonus   (recent activity this/last academic year)
```

Edge cases: All denominators use `max(…, 1)` to avoid division by zero. ActivityScore capped at 100.

---

## Monetisation

| Tier | Key Features | Price |
|------|-------------|-------|
| **Free** | Dashboard, Digital Twin (view), 5 activities/year, **5 Mentor messages/month**, readiness score visible | ₹0 |
| **Pro** | Unlimited Mentor, full Opportunity Radar + apply tracking, readiness gaps + next best actions, Learning Paths, Achievements, Simplification | ₹299–499/month |

---

## Open Issues (from CRITICAL_REVIEW_V2.md)

| # | Issue | Severity |
|---|-------|----------|
| 1 | Readiness: `recommended_learning_path_ids` missing from `career_paths`; `relevance_path_ids` ownership | High |
| 2 | `mentor_get_full_context` naming vs. layered optimization | Medium |
| 3 | Profile analysis contradiction (Section 1.6 vs 6.3) — resolved: onboarding **does** include LLM-guided profile analysis (Step 3) | Medium |
| 4 | Free tier: 5 messages = 5 user exchanges; after limit, show upgrade prompt + block send | Medium |
| 5 | Tagline/audience consistency (rural, 3 paths) | Low |

---

## Development Phases

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1–2 | Scaffold, DB schema, auth |
| 2 | 3–4 | Onboarding, Dashboard, Digital Twin, Activity Timeline |
| 3 | 5–7 | MCP servers, Orchestrator + Mentor Agent, FastAPI integration |
| 4 | 8–10 | Achievements, Opportunity Radar, Learning Paths, Co-Pilot Agent |
| 5 | 11+ | Simplification Agent, polish, responsive, docs |

---

## Environment Variables

```env
# Supabase
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI
GOOGLE_API_KEY=          # Gemini / Vertex AI

# App
NEXT_PUBLIC_API_URL=     # FastAPI base URL
A2A_MENTOR_URL=
A2A_COPILOT_URL=
A2A_OPPORTUNITY_URL=
A2A_SIMPLIFY_URL=
```

---

## Coding Conventions

- **Frontend**: TypeScript strict, Tailwind, App Router. Components in `components/`. Pages in `app/`.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2. Async everywhere. No sync DB calls in route handlers.
- **Agents**: Google ADK `LlmAgent`. Each agent in its own module under `backend/agents/`.
- **MCP**: Each MCP server in `backend/mcp_servers/`. Naming: `server_tool_action` pattern.
- **DB**: All migrations in `backend/db/migrations/`. Use Supabase CLI. RLS on every table.
- **Tests**: Jest (frontend), pytest (backend). Playwright for E2E critical flows.
- **No secrets in code**: All secrets via env vars. `.env.example` committed; `.env` git-ignored.

---

*Last updated: 2026-02-21*
