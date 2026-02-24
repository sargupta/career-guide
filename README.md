# SARGVISION AI

> **Hyper-personalized AI career co-pilot for Indian students** — any stream, any college, any career path.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org) [![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)](https://fastapi.tiangolo.com) [![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E)](https://supabase.com) [![Google ADK](https://img.shields.io/badge/Google-ADK-4285F4)](https://google.github.io/adk-docs/)

---

## What is SARGVISION AI?

SARGVISION AI is a lifelong career development platform for Indian students. When a student subscribes at the start of their degree, the platform tracks their entire journey — every project, competition, internship, and skill — and guides them toward the right career through a **personalized AI Mentor**, **Digital Twin**, and **Readiness Score**.

See [`PLAN.md`](./PLAN.md) for the full architecture and [`gemini.md`](./gemini.md) for AI assistant context.

---

## Project Structure

```
career-guide/
├── frontend/          # Next.js 14 (TypeScript + Tailwind + App Router)
├── backend/           # FastAPI (Python 3.11+)
│   ├── api/           # Route handlers
│   ├── agents/        # Google ADK agent definitions
│   ├── mcp_servers/   # MCP server implementations  
│   ├── core/          # Config, auth, utilities
│   └── db/            # Supabase client + migrations
├── .env.example       # All required environment variables
├── gemini.md          # AI assistant context file
└── PLAN.md            # Full implementation plan (818 lines)
```

---

## Quick Start

### 1. Clone & Configure

```bash
git clone <repo>
cd career-guide
cp .env.example .env
# Fill in your Supabase, Google API, and other credentials in .env
```

### 2. Database Setup

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Direct SQL
psql $DATABASE_URL < backend/db/migrations/001_initial_schema.sql
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
cp ../.env.example .env.local  # fill NEXT_PUBLIC_* vars
npm run dev
# → http://localhost:3000
```

### 4. Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, App Router |
| **Backend** | FastAPI (Python 3.11+), Pydantic v2 |
| **Database** | Supabase (Postgres + RLS + Auth) |
| **AI Agents** | Google ADK, A2A Protocol |
| **AI Model** | Gemini (via Google AI API) |
| **Deployment** | Vercel (frontend) · Cloud Run (backend) |

---

## Development Phases

| Phase | Weeks | Focus |
|-------|-------|-------|
| **1** | 1–2 | Foundation: DB schema, auth, basic routes |
| **2** | 3–4 | Core UX: Onboarding, Dashboard, Digital Twin |
| **3** | 5–7 | Agents: Mentor, MCP servers, FastAPI integration |
| **4** | 8–10 | Features: Opportunities, Learning, Achievements |
| **5** | 11+ | Polish, Simplification Agent, responsive |

---

## UI Design

Screens designed in Stitch: [View Project](https://stitch.withgoogle.com/projects/2727145234421076513)

---

*See [`PLAN.md`](./PLAN.md) for detailed specifications.*
