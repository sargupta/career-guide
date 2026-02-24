# SARGVISION AI — In-Depth Implementation Plan

> Hyper-personalized, AI-powered career co-pilot for **Indian students** across tier-I, tier-II, and tier-III colleges—any stream, any subject, any career path.  
> EdTech × HR Tech at the intersection of personalized education and career opportunities.

---

## 1. Vision & Scope

### 1.1 Inclusive Mission
SARGVISION AI serves **Indian students** across tier-I, tier-II, and tier-III colleges:
- **Primary audience**: Students with **good devices** (smartphones/laptops with modern browsers, sufficient bandwidth). Design prioritizes premium, professional experience without low-bandwidth constraints.
- **Tier-I, Tier-II, Tier-III colleges** — same quality guidance regardless of institution
- **Any domain** — Medicine, Law, Arts, Commerce, Science, Agriculture, Teaching, Banking, Govt exams, Creative, Vocational
- **Any career path** — Software engineer, doctor, teacher, civil servant, entrepreneur, artist, farmer, nurse, accountant, designer, and hundreds more

The platform must feel relevant whether the user is preparing for NEET, UPSC, SSC, campus placements, or exploring a non-traditional path.

*Note: Rural/low-bandwidth users are not excluded but are secondary. Lite mode remains available for edge cases.*

### 1.2 Core Value Proposition
- **Dynamic Digital Twin**: Living model of each user's skills, aspirations, work samples, and learning journey—refined by every interaction. Works for any domain (not just tech).
- **Personalized AI Mentor**: A dedicated, empathetic AI assistant that knows the student's profile, career paths, and full journey. Not a generic chatbot—a companion that understands context, progress, and aspirations deeply.
- **Unified Ecosystem**: Mentorship + skill development + portfolio building + career matching in one platform
- **Target Market**: Indian students and young professionals across all streams; paid subscription with tiered/affordable options for students

### 1.3 Primary Features (Inspired Scope)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Authentication** | Secure signup/login (email + optional phone), session management, password reset | P0 |
| **Multi-Step Onboarding** | Guided profile creation; **domain/career selection** (any stream); Digital Twin initialization | P0 |
| **Main Dashboard** | Overview hub, key metrics, quick access—**personalized by chosen domain** | P0 |
| **Digital Twin** | Skills/competencies radar (domain-agnostic), engagement metrics, AI insights | P0 |
| **AI Mentor** | **Personalized AI assistant**—empathic, profile-aware, career-path expert; knows full progress & inputs; resume/CV feedback; mock interviews | P0 |
| **Achievements Portfolio** | Build portfolio: projects, assignments, research, creative work—**tagged by academic year** | P0 |
| **Activity Timeline** | Log projects, competitions, events, internships—**longitudinal record** by year/semester | P0 |
| **Preparation Readiness** | **Readiness score per aspirational career path**; gaps; next best actions; graduation readiness dashboard | P0 |
| **Opportunity Radar** | Match scores; **all opportunity types** (jobs, internships, govt exams, scholarships, fellowships); filtering; tracking | P0 |
| **Learning Paths** | Curated resources: courses, NPTEL, free content, exam prep, vernacular options; progress tracking | P0 |
| **Simplification Agent** | Research papers, textbooks, articles, videos—key concept extraction for **any subject** | P1 |
| **Project Co-Pilot & Labs** | Multi-modal asset creation (presentations, documents, images, audio)—**domain-appropriate** outputs | P1 |

### 1.4 AI Mentor Philosophy (Journey Companion)
Throughout the journey, the student has a **personalized AI mentor**—an assistant that:

- **Knows the student**: Profile, domain, degree, year, aspirations, and all 3 career paths
- **Tracks progress**: Every project, competition, event, internship, skill, and learning milestone logged
- **Shows empathy**: Supportive, understanding, celebratory of wins; never dismissive
- **Understands career paths deeply**: Expert-level knowledge of each aspirational path—requirements, timelines, exams, industry norms
- **References what the student shared**: "Given your interest in X…", "Your hackathon in 2nd year…", "Since you're targeting Software and Product…"

The mentor is not a one-off Q&A bot. It is a **companion** that grows with the student, remembers context, and gives advice that feels personal because it *is* personal—built on the student's own inputs and progress.

### 1.5 Accessibility & Inclusivity Requirements
- **Primary**: Tier-I/II/III students with good devices—full glassmorphism, animations, premium UX
- **Lite mode**: Optional fallback for older devices; reduces blur, simplifies glass; always light theme
- **Simple language**: Avoid jargon; explain terms; Hindi/regional language support (future phase)
- **Guided flows**: First-time users get step-by-step help; no assumed prior platform experience
- **Domain-agnostic UI**: No tech-centric defaults; user's chosen domain drives terminology and examples

### 1.6 Academic Lifecycle & Longitudinal Tracking (Core Model)
**When a student subscribes at the start of their degree** (e.g., BTech 1st year), the platform becomes their **career development record** for the entire journey:

| Phase | What Happens |
|-------|--------------|
| **Enrollment** | Student sets: degree type (BTech, MBBS, BA, etc.), current year (1st/2nd/3rd/4th), academic year start |
| **Profile analysis** | **Required at onboarding.** Platform analyzes aspirations, expectations, interests; student selects **up to 3 aspirational career paths** (not final—exploratory). LLM-guided analysis informs path suggestions. |
| **Year 1–4** | Track all data points: projects, competitions, events, workshops, internships, certifications, grades |
| **Digital Twin** | Becomes a living record—every activity, skill, achievement is logged and linked to academic year/semester |
| **Readiness** | At any point (especially final year): **Preparation score per career path**—how ready is the student for each of their 3 paths? |
| **Decision** | At graduation: Student sees readiness for each path; can choose which to pursue; platform suggests **next best actions** (apply here, fill this gap, etc.) |

**Key principle**: The student subscribes once at the start; the platform tracks everything until they graduate (or beyond). The Digital Twin is the **single source of truth** for their career development.

### 1.7 Readiness Score Algorithm (Preparation Assessment)

**Readiness (0–100%)** per career path is computed from a weighted formula. Each career path has **required_skills** (from `career_paths.required_skills_json`) and **activity_relevance** mapping.

#### Formula
```
Readiness = (0.35 × SkillsScore) + (0.35 × ActivityScore) + (0.20 × LearningScore) + (0.10 × RecencyBonus)
```

| Component | Weight | Calculation |
|-----------|--------|-------------|
| **SkillsScore** | 35% | `(user_skills_matched / max(required_skills_count, 1)) × 100`. Match by `skill_id` at launch; **semantic match** (embedding similarity) for future phases when skills overlap across domains. Level (1–5) affects partial credit. |
| **ActivityScore** | 35% | `min(100, (relevant_activities / max(expected_activities, 1)) × 100)`. Cap at 100. Each path has `expected_activities` (e.g., min 2 internships, 1 competition). Activities tagged with `relevance_path_ids`—**user selects** when logging (required for readiness). |
| **LearningScore** | 20% | `(completed_relevant_courses / max(recommended_courses_count, 1)) × 100`. Uses `career_paths.recommended_learning_path_ids` to get recommended courses. |
| **RecencyBonus** | 10% | Recent activity (current/last academic year) gets bonus. `(recent_activities / max(total_activities, 1)) × 10` capped at 10. |

#### Gaps
- **Missing skills**: Required skills from `career_paths.required_skills_json` not in `user_skills`
- **Low activity**: Path expects N internships; user has fewer
- **Stale profile**: No activity in current academic year

#### Next Best Actions
Generated from gaps: "Add skill X", "Complete internship in Y", "Enroll in course Z", "Log your project from this semester"

#### Data Model
- `career_paths`: Add `required_skills_json` (array of skill_ids), `expected_activities_json` (e.g. `{internships: 2, competitions: 1}`), **`recommended_learning_path_ids`** (array of learning_path_ids for this career path)
- `activities`: Add `relevance_path_ids` (array of career_path_ids)—**user selects when logging**; required for readiness to work

#### Edge Cases
- **0 aspirational paths**: Readiness not computed; dashboard shows "Add career paths in settings to see readiness"
- **Division by zero**: All denominators use `max(..., 1)` to avoid errors

#### Verification (Future)
For high-impact activities (internships, certifications), consider optional verification: GitHub link for projects, certificate upload, or employer email. Reduces gaming of readiness score. Not in MVP.

### 1.8 Data Points to Track (Longitudinal)
- **Projects** — Academic projects, personal projects, research (with year/semester)
- **Competitions** — Hackathons, case studies, Olympiads, essay contests, sports (with result)
- **Events** — Workshops, seminars, fests, conferences (attended/organized)
- **Internships** — Summer/winter internships (with duration, role)
- **Certifications** — Courses completed, certificates earned
- **Grades/Academics** — Semester-wise (optional; user can choose to add)
- **Extracurricular** — Clubs, societies, leadership roles

### 1.9 Pricing & Monetization
**Model**: Freemium with paid subscription. Validate willingness to pay before full gateway integration.

| Tier | Features | Price (hypothesis) |
|------|----------|-------------------|
| **Free** | Dashboard, Digital Twin (view), Activity timeline (log up to 5/year), **5 Mentor messages/month** (user messages only = 5 exchanges), **Readiness score visible** (0–100 per path), basic Opportunity Radar (view only) | ₹0 |
| **Pro** | Unlimited Mentor, full Opportunity Radar + apply tracking, **Readiness gaps + next best actions + detailed recommendations**, Learning Paths, Achievements portfolio, Simplification Agent | ₹299–499/month or ₹2499–3999/year |

**Free tier mechanics**:
- **5 messages** = 5 user messages (5 exchanges). Same context quality (Core + Session) as Pro.
- After limit: Show "Upgrade to Pro for unlimited" + block send until next month or upgrade.
- **Readiness**: Free sees score (0–100) per path; Pro sees gaps, next best actions, detailed recommendations.

**Validation**: Survey/pilot with target users before launch. Adjust pricing based on conversion and churn. Payment gateway (Razorpay/Stripe) in Phase 2 after validation.

### 1.10 Out of Scope (Initial Phase)
- Native mobile apps (web-first, responsive)
- Real-time video mock interviews
- Full regional language UI (placeholder; content can be multilingual)
- Direct corporate/HR integrations (future phase)
- Payment gateway integration (implement after pricing validation)

---

## 2. Technical Architecture

### 2.1 High-Level Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                         │
│  Next.js 14 (App Router) • TypeScript • Tailwind • Glassmorphism • Responsive │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ REST / WebSocket
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                        │
│  FastAPI (Python) • Auth Middleware • Rate Limiting • Request Validation     │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   AGENT ORCHESTRATOR  │   │   MCP SERVERS         │   │   DATABASE             │
│   (Google ADK)        │   │   (Model Context      │   │   Supabase/Postgres    │
│   • Digital Twin      │   │    Protocol)          │   │   • 14+ Tables         │
│   • Session routing   │   │   • DB, APIs, Files    │   │   • RLS                │
└───────────┬───────────┘   └───────────────────────┘   └───────────────────────┘
            │
            │ A2A Protocol (RemoteA2aAgent)
            │
┌───────────┴───────────────────────────────────────────────────────────────────┐
│                        SPECIALIZED AGENTS (A2A Servers)                         │
│  Mentor Agent │ Project Co-Pilot │ Opportunity Radar │ Simplification Agent    │
│  (Each: ADK + MCP tools)                                                        │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Protocol Responsibilities

| Protocol | Role | Implementation |
|----------|------|----------------|
| **MCP** | Agents connect to tools, data, external services | MCP servers for DB, GitHub, content, opportunities |
| **A2A** | Agents collaborate with each other | ADK A2AServer + RemoteA2aAgent |
| **ADK** | Build and run agents | google-adk, LlmAgent, tools, system prompts |

### 2.3 Agent Topology

```
                    ┌─────────────────────────────────────┐
                    │         ORCHESTRATOR AGENT          │
                    │  • Routes user intent               │
                    │  • Maintains Digital Twin context   │
                    │  • Calls specialized agents via A2A │
                    │  • Uses MCP for user/DB access      │
                    └─────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  MENTOR AGENT   │      │ PROJECT CO-PILOT│      │ OPPORTUNITY      │
│  • Career advice│      │ • Portfolio help│      │ RADAR AGENT      │
│  • Resume review│      │ • Multi-modal   │      │ • Match scoring   │
│  • Mock prep    │      │   assets        │      │ • Filtering      │
│  MCP: Session,  │      │ MCP: GitHub,    │      │ MCP: Opps DB,    │
│  Learning Paths │      │ Projects DB     │      │ Digital Twin     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────┐
                         │ SIMPLIFICATION  │
                         │ AGENT           │
                         │ • Paper summary │
                         │ • Explainer gen │
                         │ MCP: Content DB │
                         └─────────────────┘
```

---

## 3. Database Design

### 3.1 Core Tables (20+)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Auth + profile | id, email, phone (optional), hashed_password, created_at |
| `profiles` | Extended user info | user_id, full_name, avatar_url, bio, education, location, **domain_id**, **career_path_id** (primary/final choice) |
| `academic_enrollments` | **Academic lifecycle** | user_id, degree_type (BTech/MBBS/BA/BSc/etc), total_years (4/5/3), current_year (1-4), academic_year_start (e.g. 2024), institution (optional) |
| `user_aspirations` | **Multi-path aspirations** | user_id, career_path_id, rank (1/2/3), is_primary (final choice at graduation) |
| `domains` | Career domains (streams) | id, name, description |
| `career_paths` | Specific career options | id, domain_id, name, description, **required_skills_json**, **expected_activities_json**, **recommended_learning_path_ids** |
| `digital_twins` | Living career model | user_id, skills_json, competencies_json, aspirations, engagement_metrics, **readiness_scores_json** (per career path), last_updated |
| `skills` | Master skill/competency list | id, name, category_id, domain_id (nullable), description |
| `skill_categories` | Skill groupings | id, name |
| `user_skills` | User ↔ skills | user_id, skill_id, level, verified, **academic_year** (when acquired) |
| `achievements` | Portfolio items | id, user_id, title, description, type, links_json, attachments_json, visibility, **academic_year**, **semester** (1/2) |
| `activities` | **Longitudinal activities** | id, user_id, type, title, details_json, **academic_year**, **semester**, date, **relevance_path_ids** (career_path_ids this activity is relevant to) |
| `opportunities` | All opportunity types | id, type, title, org, domain_id, requirements_json, match_criteria, **apply_url** (redirect for applications) |
| `opportunity_applications` | User applications | user_id, opportunity_id, status, applied_at |
| `learning_paths` | Curated resources | id, title, provider, url, domain_id, skills_covered, category, is_free, language |
| `enrollments` | User course progress | user_id, path_id, progress_pct, completed_at, **academic_year** |
| `mentor_sessions` | AI chat sessions | id, user_id, started_at, context_snapshot |
| `mentor_messages` | Chat messages | session_id, role, content, created_at |
| `content_library` | Papers, articles, videos | id, title, type, url, domain_id, summary, key_concepts |
| `simplification_requests` | User simplification history | user_id, content_id, output_type, created_at |
| `readiness_snapshots` | **Preparation score history** | user_id, career_path_id, score (0-100), gaps_json, recommendations_json, snapshot_date |

### 3.2 Domains & Career Paths (Inclusive Coverage)
**Domains** (user selects during onboarding):
- Engineering & Technology
- Medicine & Healthcare
- Law & Legal
- Arts & Humanities
- Commerce & Business
- Science & Research
- Agriculture & Rural Development
- Teaching & Education
- Government & Civil Services
- Creative & Media
- Vocational & Skilled Trades
- Other / Exploring

**Career Paths** (examples per domain; 100+ total):
- *Engineering*: Software, Civil, Mechanical, Electrical, etc.
- *Medicine*: MBBS, Nursing, Pharmacy, Allied Health
- *Law*: Litigation, Corporate, Judiciary, Legal Research
- *Arts*: Journalism, Psychology, Sociology, History
- *Commerce*: CA, CFA, Banking, Accountancy, MBA
- *Science*: Research, Data Science, Biotechnology
- *Agriculture*: Agri-business, Extension, Research
- *Teaching*: School, College, EdTech, Training
- *Govt*: UPSC, SSC, State PSC, Defence
- *Creative*: Design, Writing, Film, Music
- *Vocational*: Electrician, Mechanic, Crafts, etc.

### 3.3 Skills & Competencies (Domain-Agnostic, 80+)
Skills are tagged by `domain_id` (nullable = universal). Examples:

| Category | Universal Skills | Domain-Specific Examples |
|----------|------------------|--------------------------|
| **Technical** | MS Office, Basic IT | Programming, CAD, Lab Techniques |
| **Clinical** | — | Patient Care, Diagnosis, Medical Ethics |
| **Legal** | — | Legal Research, Drafting, Court Procedures |
| **Data & Analysis** | Data Interpretation, Statistics | ML, Clinical Trials, Legal Analytics |
| **Business** | Communication, Finance Basics | Marketing, Sales, Agri-business |
| **Creative** | Writing, Presentation | Design, Video Editing, Content Creation |
| **Soft Skills** | Communication, Leadership, Problem Solving, Time Management | (Universal) |
| **Exam-Specific** | — | Quantitative Aptitude, Reasoning, GK (govt exams) |

### 3.4 Security
- **Row Level Security (RLS)** on all tables
- User data isolated by `user_id` / `auth.uid()`
- Service role for agent/backend operations
- Indexes on `user_id`, `opportunity_id`, `session_id`, `domain_id` for performance

### 3.5 Opportunity Types (Inclusive)
Opportunities must cover the full spectrum of what Indian students seek:

| Type | Examples | Relevance |
|------|----------|-----------|
| **Jobs** | Private sector, startups, PSUs | All domains |
| **Internships** | Corporate, NGOs, govt | All domains |
| **Govt Exams** | UPSC, SSC, State PSC, Railway, Defence | High for tier-II/III |
| **Scholarships** | National, state, private, merit, need-based | Critical for affordability |
| **Fellowships** | Research, teaching, social impact | Aspirational |
| **Competitions** | Hackathons, case studies, essay, Olympiads | Skill showcase |

### 3.6 Opportunity Data Strategy
**MVP approach**: Hand-curated seed dataset. Expand via APIs/partners later.

| Phase | Strategy | Count |
|-------|----------|-------|
| **Launch** | Manual curation: 50–100 opportunities across types. Jobs/internships from known portals (Naukri, LinkedIn—manual entry); govt exams from official sites; scholarships from National Scholarship Portal, state schemes. | 50–100 |
| **Growth** | Partner APIs (e.g., job aggregators); RSS/calendar for govt exam dates; scholarship databases. Semi-automated ingestion with review. | 500+ |
| **Scale** | Scraping (with ToS compliance); user-submitted opportunities (moderated); corporate partnerships. | 1000+ |

**Data schema** (`opportunities`):
- `requirements_json`: `{skills: [skill_ids], min_internships: 0, education: "BTech", ...}` for match logic
- `match_criteria`: Keywords or structured fields used by match algorithm
- **Match algorithm**: Weighted overlap—user skills vs. required skills (by skill_id); activity type match (internship count, etc.); domain match. Score = weighted sum, normalized 0–100.

**Apply flow**: "Apply" = **redirect to external URL** (opportunity has `apply_url`). Platform stores `opportunity_applications` with status (Applied, Shortlisted, Rejected) for user tracking—updated manually or via webhook if partner provides.

### 3.7 Learning Resources (Inclusive)
- **Free/Low-cost**: NPTEL, SWAYAM, YouTube, Khan Academy, government portals
- **Exam prep**: Domain-specific (NEET, JEE, UPSC, SSC, etc.)
- **Vernacular**: Tag content by language (Hindi, regional) for future
- **Tier-appropriate**: Include resources that work with limited bandwidth

---

## 4. MCP Server Design

### 4.1 MCP Servers to Implement

| MCP Server | Purpose | Tools/Resources |
|------------|---------|-----------------|
| **database** | User, profile, academic_enrollment, aspirations, Digital Twin, skills, achievements, activities, domains, career_paths | CRUD via Supabase client |
| **mentor_context** | **Layered context for AI Mentor**: Core (profile, paths, readiness), Extended (Digital Twin summary, recent activities, learning), Full (complete timeline, all skills) | Aggregated context injection; layer param |
| **opportunities** | Jobs, internships, govt exams, scholarships, fellowships; match logic | Query by domain, type; applications |
| **learning** | Learning paths (all domains), enrollments, progress | List by domain; NPTEL, free resources |
| **achievements** | Portfolio CRUD (projects, assignments, research, creative); links, attachments | Create/update; domain-appropriate types |
| **content** | Papers, articles, videos, textbooks (any subject) | Search by domain; fetch; store summaries |
| **auth** | User context, session validation | Get current user, validate token |

### 4.2 MCP Tool Naming Convention
- `database_get_user_profile` (includes domain, career_path, **academic_enrollment**)
- `database_get_user_aspirations` (3 aspirational career paths)
- `database_update_digital_twin`
- `database_get_domains_and_career_paths`
- `activities_log` (project, competition, event, internship, certification—with academic_year, semester, **relevance_path_ids** required)
- `activities_list` (filter by year, type)
- `readiness_compute` (compute preparation score for a career path from Digital Twin + activities)
- `opportunities_search` (filter by domain, type)
- `opportunities_apply`
- `learning_list_paths` (filter by domain)
- `learning_update_progress`
- `achievements_create` (with academic_year, semester)
- `achievements_list`
- `content_summarize` (domain-aware)
- `mentor_get_core_context` (profile, 3 paths, readiness scores, last 15 messages—~800 tokens)
- `mentor_get_extended_context` (adds Digital Twin summary, last 10 activities, learning progress—~1200 tokens)
- `mentor_get_full_context` (complete timeline, all skills, all learning—~3000 tokens; for explicit "review my profile" requests)

---

## 5. Agent Design (ADK + A2A)

### 5.1 Orchestrator Agent
- **Role**: Entry point for all user requests; routes to specialized agents; **domain-aware** and **academic-year-aware** routing
- **Tools (MCP)**: Get user profile (domain, career_path, **academic_enrollment**, **aspirations**), Digital Twin, session history
- **A2A**: RemoteA2aAgent to Mentor, Project Co-Pilot, Opportunity Radar, Simplification
- **System prompt**: Intent classification; adapt to domain and **current academic year**; context assembly; response aggregation

### 5.2 Mentor Agent — Personalized AI Companion

**Core identity**: The AI Mentor is not a generic chatbot. It is a **personalized assistant** that accompanies the student throughout their journey—empathic, deeply informed about their career paths, and fully aware of every input and progress they have shared.

#### Persona & Behavior
| Attribute | Implementation |
|-----------|----------------|
| **Empathy** | Acknowledges struggles, celebrates progress, uses supportive tone. Never dismissive or robotic. |
| **Profile-aware** | Knows: name, domain, degree, current year, institution, location, aspirations (free-form). Speaks to *this* student. |
| **Career-path expert** | Deep knowledge of the student's **3 aspirational paths**. Understands requirements, timelines, exam patterns, industry norms for each. Gives path-specific advice. |
| **Progress-aware** | Has full context: projects, competitions, events, internships, skills, learning progress, readiness scores. References specific achievements: "Your hackathon win in 2nd year…", "Given your internship at X…". |
| **Longitudinal memory** | Remembers past conversations, decisions, goals. Continuity across sessions. |
| **Proactive** | Can surface relevant suggestions: "You haven't logged anything for this semester—want to add your project?" |

#### Context Optimization (Token Management)
Full persona retained; context is **layered and capped** to control cost and latency:

| Layer | Content | Max Tokens | When |
|-------|---------|------------|------|
| **Core** (always) | Profile (name, domain, degree, year), 3 aspirational paths (names + 1-line each), current readiness scores | ~800 | Every request |
| **Extended** (on demand) | Digital Twin summary (top 10 skills), last 10 activities, learning progress summary | ~1200 | When user asks about progress/readiness |
| **Session** | Last 15 messages (current + previous session) | ~1500 | Every request |
| **Full fetch** (rare) | Complete activity timeline, full skills, full learning | ~3000 | Explicit "review my profile" type requests |

**Strategies**:
- **Summarization**: For users with 50+ activities, inject LLM-generated summary (e.g., "3 internships, 5 projects, 2 competitions") instead of raw list
- **Recency bias**: Prioritize current/last academic year; older data summarized
- **Caching**: Core + Extended cached per user; invalidate on profile/activity update
- **Token budget**: Hard cap ~6K tokens context per request; prioritize session > core > extended
- **Proactive**: Surfaces as **in-app prompts** when user opens Mentor (e.g., "You haven't logged anything this semester—want to add your project?")—not push; requires user to open app
- **Disclaimer**: "This is guidance, not professional advice. For mental health support, please contact [helpline]." Signpost to external resources; no in-app human escalation.

#### Context Injected (Every Request)
- **Core** (via `mentor_get_core_context`): Profile, 3 paths, readiness scores, last 15 messages
- **Extended** (via `mentor_get_extended_context`, conditional): Digital Twin summary, recent activities, learning progress
- **Full** (via `mentor_get_full_context`, on explicit request): Complete timeline, all skills, all learning

#### Skills (A2A)
`career_advice`, `resume_review`, `mock_interview_prep`, `exam_guidance`, `year_wise_guidance`, `progress_reflection`

#### Output
- Domain-appropriate, year-appropriate, **path-specific** advice
- References student's actual data (e.g., "Based on your 3 paths—Software, Product, Research—here's what makes sense for 3rd year…")
- Next actions; resource recommendations
- Empathic framing; encouragement when needed

### 5.3 Project Co-Pilot Agent (Achievements Co-Pilot)
- **Role**: Help build **achievements portfolio**—domain-appropriate outputs (not just code)
- **Tools (MCP)**: Achievements DB; optional GitHub for tech; file/attachment support for all
- **Skills (A2A)**: `portfolio_ideation`, `asset_creation`, `portfolio_review`
- **Output**: Ideas for projects/assignments/research/creative work; presentation templates; document outlines; for tech: code snippets; for others: case studies, lesson plans, design briefs, etc.

### 5.4 Opportunity Radar Agent
- **Role**: Match user to **all opportunity types**; compute **preparation readiness** per aspirational path; suggest improvements
- **Tools (MCP)**: Opportunities DB, Digital Twin, **activities**, **readiness_compute**, applications
- **Skills (A2A)**: `match_score`, `filter_opportunities`, `next_best_actions`, `readiness_assessment`
- **Output**: Ranked opportunities; match %; **readiness score (0–100) per career path**; **gaps** (what's missing); **next best actions** (what to do this year/semester to improve readiness); graduation readiness view

### 5.5 Simplification Agent
- **Role**: Summarize papers, textbooks, articles—**any subject**
- **Tools (MCP)**: Content library (domain-tagged), summarization API
- **Skills (A2A)**: `summarize`, `extract_concepts`, `generate_explainer`
- **Output**: Summaries, key concepts, explainer scripts—**language and examples adapted to user's domain**

### 5.6 Agent Cards (A2A Discovery)
Each agent exposes `.well-known/agent.json` with:
- `name`, `description`, `version`
- `skills` (list of AgentSkill)
- `url` (A2A endpoint)
- `defaultInputModes` / `defaultOutputModes`

---

## 6. Frontend Architecture

### 6.1 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **State**: React Query (server state), Zustand (client state, if needed)
- **Auth**: Supabase Auth or similar (session, protected routes)
- **Forms**: React Hook Form + Zod

### 6.2 Route Structure

```
/                    → Landing / marketing (inclusive messaging)
/login               → Login
/signup              → Signup
/onboarding          → Multi-step onboarding (see 6.3)
/dashboard           → Main hub (personalized by domain, shows year progress)
/digital-twin        → Digital Twin view (skills, readiness per career path)
/timeline            → Activity timeline (projects, competitions, events by year)
/mentor              → AI Mentor chat
/achievements        → Achievements portfolio (tagged by academic year)
/readiness           → Preparation readiness (score per path, gaps, next actions)
/opportunities       → Opportunity Radar (all types, filterable by domain)
/learning            → Learning paths (domain-filtered; includes free/NPTEL)
/simplify            → Simplification Agent
/settings            → Profile, account, academic info, domain/career update
```

### 6.3 Onboarding Flow (5 Steps, Reduced Friction)
**Goal**: Minimize drop-off; allow "complete later" for optional steps. **Profile analysis is required** at onboarding.

| Step | Required? | Content |
|------|-----------|---------|
| 1. **Academic + Profile** | Yes | Degree type, current year, academic year start; name, email (from auth) |
| 2. **Domain** | Yes | Choose stream or "Exploring" |
| 3. **Profile analysis** | Yes | **LLM analyzes** aspirations, expectations, interests from free-form input; suggests up to 3 career paths. Student selects 0–3 (or accepts suggestions). "Not sure yet" = 0 paths; can add later. |
| 4. **Skills** | No | Domain-appropriate skill picker—optional; can add later from Digital Twin |
| 5. **Digital Twin init** | Yes | Confirm; initialize with profile analysis output |

**Escape hatches**:
- Step 3: "Skip for now" → user has 0 paths; can add later in settings
- Step 4: "I'll add later" → Digital Twin starts with domain + paths; skills empty
- **Complete later**: User can exit after step 2; dashboard prompts to complete when they return

### 6.4 Design System — First Principles & Audience

**Design philosophy**: No dark theme. Light, dynamic, professional. Glassmorphism-based. Built from first principles for the right audience (Indian students, tier-I/II/III with good devices; rural secondary).

#### First Principles
| Principle | Application |
|-----------|-------------|
| **Clarity** | Users must quickly understand where they stand and what to do next. Clear hierarchy, no ambiguity. |
| **Trust** | Career guidance is sensitive. Design must feel credible, established—not playful or gimmicky. |
| **Hope & Growth** | Light, open spaces convey possibility. Avoid heavy, closed aesthetics. |
| **Accessibility** | Readable contrast; works on budget devices; not dependent on high-end rendering. |
| **Reduced cognitive load** | One primary action per view; progressive disclosure; no clutter. |

#### Audience Considerations
- **Primary**: Tier-I/II/III students with good devices—full premium UX
- **Indian students (18–25)**: Aspirational, career-focused, mobile-first
- **Emotional need**: Reassurance, direction, progress visibility
- **Design response**: Light, open, professional; glassmorphism for premium feel

#### Visual Direction
- **Theme**: **Light base only**. No dark mode. Dynamic, airy, optimistic.
- **Glassmorphism**: Frosted glass cards, subtle backdrop blur, semi-transparent surfaces. Conveys modernity and premium quality. Applied to cards, modals, nav—not everywhere (preserve readability).
- **Colors**: Light backgrounds (off-white, soft grey); primary accent for growth/trust (refined teal or soft blue); warm accent for CTAs (coral, amber). Avoid harsh contrasts.
- **Typography**: Clean, readable sans-serif (e.g. Plus Jakarta Sans, Outfit). Avoid code/monospace as default. Clear hierarchy (size, weight).
- **Spacing**: Generous whitespace. Breathe. Don't crowd.
- **Depth**: Soft shadows, layered glass panels. Conveys structure and professionalism.

#### Design Principles (Applied)
- **Fitts's Law**: Touch targets ≥ 44px; primary actions prominent
- **Hick's Law**: Limit choices per screen; guide, don't overwhelm
- **Visual hierarchy**: Clear primary/secondary/tertiary; scan path follows intent
- **Consistency**: Design tokens; reusable components; predictable patterns
- **Feedback**: Loading states, success/error states; user always knows status
- **Affordance**: Buttons look clickable; inputs look editable

#### Dynamic & Lively (Without Dark)
- **Micro-interactions**: Subtle hover states, smooth transitions on cards and buttons
- **Progress indicators**: Animated readiness gauges, timeline progress—conveys momentum
- **Gradient accents**: Soft, light gradients (not harsh) for headers, badges
- **Contextual color**: Readiness green, attention amber, neutral grey—semantic, not decorative
- **Motion**: Purposeful, not decorative. Guide attention; celebrate completion.

#### Implementation Notes
- **Lite mode**: For low-end devices—reduce blur, simplify glass effect, fewer animations. **Always light theme.**
- **Glassmorphism fallback**: Where `backdrop-filter` unsupported, use solid light background with subtle border.
- **Accessibility**: WCAG AA contrast on text over glass; ensure blur doesn't compromise readability.

### 6.5 Key UI Components
- `AcademicEnrollmentForm` (onboarding—degree, year, start date)
- `DomainSelector` (onboarding)
- `ProfileAnalysisStep` (onboarding—LLM analyzes aspirations; user selects 0–3 paths from suggestions)
- `CareerPathSelector` (onboarding)
- `SkillsRadar` / `CompetenciesRadar` (Digital Twin)
- `ReadinessGauge` (per career path—0–100% preparation score)
- `ReadinessDashboard` (graduation view—compare 3 paths, gaps, next actions)
- `ActivityTimeline` (year-by-year view: projects, competitions, events)
- `MatchScoreBadge` (Opportunity Radar)
- `ChatInterface` (Mentor)
- `AchievementCard` (with academic year tag)
- `LearningPathCard` (Courses)
- `OnboardingStepper` (5 steps)

---

## 7. API Design

### 7.1 REST Endpoints (FastAPI)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Login |
| POST | `/auth/signup` | Signup |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Current user + profile (includes domain, career_path) |
| PUT | `/users/me` | Update profile |
| GET | `/domains` | List domains (for onboarding) |
| GET | `/domains/:id/career-paths` | List career paths for domain |
| GET | `/users/me/academic` | Get academic enrollment |
| PUT | `/users/me/academic` | Update academic enrollment |
| GET | `/users/me/aspirations` | Get aspirational career paths (up to 3) |
| PUT | `/users/me/aspirations` | Set aspirational career paths |
| GET | `/digital-twin` | Get Digital Twin (includes readiness_scores) |
| POST | `/mentor/sessions` | Create session |
| POST | `/mentor/sessions/:id/messages` | Send message, get response |
| GET | `/achievements` | List user achievements (filter by type, academic_year) |
| POST | `/achievements` | Create achievement (with academic_year, semester) |
| GET | `/activities` | List activities (filter by year, type) |
| POST | `/activities` | Log activity (project, competition, event, internship, certification). **Requires `relevance_path_ids`** (user selects which career paths this activity is relevant to) for readiness to work. |
| GET | `/readiness` | Get readiness scores for all 3 aspirational paths |
| POST | `/readiness/refresh` | Recompute readiness (async) |
| GET | `/opportunities` | List with filters (domain, type), match scores |
| POST | `/opportunities/:id/apply` | Create `opportunity_applications` record (status: "Intent"); return `{application_id, apply_url}`. Frontend redirects user to `apply_url` for external application. |
| GET | `/learning/paths` | List learning paths (filter by domain) |
| POST | `/learning/enroll` | Enroll |
| PUT | `/learning/progress` | Update progress |
| POST | `/simplify` | Summarize / extract concepts |

### 7.2 Agent Communication Flow
1. Frontend → FastAPI → Orchestrator Agent (ADK)
2. Orchestrator uses MCP tools for user/DB context
3. Orchestrator uses RemoteA2aAgent to call specialized agents
4. Response aggregated → returned to frontend

---

## 8. Authentication & Security

### 8.1 Auth Flow
- Email + password signup/login
- JWT or session cookies
- Protected routes check auth on mount
- Onboarding completion flag (redirect logic)

### 8.2 Security Measures
- HTTPS only
- CORS configured for frontend origin
- Rate limiting on auth and agent endpoints
- Input validation (Zod/Pydantic)
- No secrets in frontend; env vars for backend

### 8.3 Privacy & Compliance (DPDP Act 2023)
- **Consent**: Explicit consent at signup for data collection (profile, activities, mentor conversations). Clear privacy policy.
- **Data retention**: User data retained until account deletion. Mentor messages: 2 years or until deletion.
- **Right to deletion**: User can request full account + data deletion. Process within 30 days.
- **Data residency**: Prefer India-hosted DB (Supabase India region). LLM: Use providers with no-training-on-user-data policy (Gemini, OpenAI); avoid sending PII in prompts where possible.
- **Audit**: Log agent access (user_id, timestamp, agent type); no prompt/response content in logs. PII excluded from analytics.
- **Mental health**: Mentor disclaimer: "This is guidance, not professional advice. For mental health support, please contact [helpline]." No escalation to human for distress—signpost to external resources.

---

## 9. Development Phases

### Phase 1: Foundation (Weeks 1–2)
- [ ] Project scaffolding (monorepo or separate repos)
- [ ] Database schema + migrations
- [ ] Auth (signup, login, session)
- [ ] Basic Next.js app + routing
- [ ] Supabase/Postgres setup + RLS

### Phase 2: Core UX (Weeks 3–4)
- [ ] Multi-step onboarding (academic enrollment → domain → **profile analysis** (LLM) → aspirational paths 0–3 → skills optional → Digital Twin init)
- [ ] Dashboard layout + navigation (domain + year personalized)
- [ ] Digital Twin UI (skills radar + readiness per path)
- [ ] Activity timeline (log & view by year)
- [ ] Profile + academic CRUD
- [ ] Domains + career paths seed data

### Phase 3: Agents & MCP (Weeks 5–7)
- [ ] MCP servers (database, opportunities, learning, achievements)
- [ ] Orchestrator Agent (ADK, domain-aware)
- [ ] Mentor Agent (A2A server, any-domain guidance)
- [ ] FastAPI integration with agents
- [ ] AI Mentor chat UI

### Phase 4: Features (Weeks 8–10)
- [ ] Achievements Portfolio (CRUD + UI, all types)
- [ ] Opportunity Radar (all types: jobs, exams, scholarships; match logic + UI)
- [ ] Learning Paths (domain-filtered; NPTEL, free resources)
- [ ] Project Co-Pilot Agent (domain-appropriate outputs)
- [ ] Opportunity Radar Agent

### Phase 5: Polish
- [ ] Simplification Agent + UI
- [ ] Animations, loading states, error handling
- [ ] Responsive polish
- [ ] Documentation (README, setup, architecture)

*Timeline is flexible; phases may extend based on team size and complexity.*

---

## 10. Environment & Deployment

### 10.1 Environment Variables
- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `GOOGLE_API_KEY` or `VERTEX_AI_*` for Gemini
- `NEXT_PUBLIC_API_URL` (FastAPI base URL)
- `A2A_AGENT_URLS` (Mentor, Co-Pilot, etc.)

### 10.2 Deployment Targets
- **Frontend**: Vercel (Next.js)
- **Backend**: Cloud Run / Railway / Fly.io (FastAPI)
- **Agents**: Same backend or separate services (A2A allows both)
- **Database**: Supabase (managed Postgres)

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Agent latency | Streaming responses; async for long tasks |
| Cost (LLM calls) | Caching, rate limits, token budgets |
| MCP/A2A complexity | Start with 1–2 MCP servers; add incrementally |
| Data privacy | RLS; no PII in logs; audit agent access |
| **Tech bias in agents** | System prompts explicitly instruct domain-agnostic responses; test with non-tech personas |
| **Sparse data for niche domains** | Seed opportunities/learning paths broadly; allow user-contributed suggestions (future) |
| **Low bandwidth** | Lite mode; optimize images; lazy load; consider PWA for offline (future) |

---

## 12. Success Criteria

### Functional
- [ ] User can sign up, onboard (academic enrollment + profile analysis + aspirational paths 0–3), and see Digital Twin
- [ ] AI Mentor responds with **personalized**, **empathic** guidance; references student's profile, career paths, and progress; feels like a dedicated companion
- [ ] Activity timeline: user can log projects, competitions, events by academic year
- [ ] Readiness dashboard: preparation score (0–100) per aspirational path; gaps; next actions
- [ ] Opportunity Radar shows match scores; supports **all opportunity types**
- [ ] Achievements can be created and displayed (tagged by academic year)
- [ ] Learning paths show progress; domain-filtered; include free resources
- [ ] All agents communicate via A2A
- [ ] MCP tools power agent context
- [ ] Build succeeds; no critical security issues

### Longitudinal / Lifecycle
- [ ] BTech 1st year student can subscribe and set 3 career paths
- [ ] By 4th year, Digital Twin reflects full journey (projects, competitions, events)
- [ ] At graduation, readiness shows preparedness for each path; user can choose and act

### Inclusivity
- [ ] A Medicine/Arts/Agriculture student has a relevant experience (not tech-centric)
- [ ] Govt exam and scholarship opportunities visible and matchable
- [ ] Onboarding works for "Exploring" / undecided users
- [ ] Lite mode reduces load for low-end devices
- [ ] Language is simple; no unexplained jargon

---

## 13. Content Strategy
**Who creates and maintains platform content?**

| Content Type | Owner | Process |
|--------------|-------|---------|
| **Domains & Career Paths** | Product/Content team | Seed 12 domains, **prioritize top 20 paths** at launch. Add `required_skills_json`, `expected_activities_json`, `recommended_learning_path_ids` per path. Review quarterly. |
| **Skills** | Product | Seed 80+ skills with category, domain tags. Expand based on user feedback. |
| **Learning Paths** | Content team | Curate 25+ paths at launch (NPTEL, SWAYAM, Udemy, Coursera links). Tag by domain, skills. Add monthly. |
| **Opportunities** | Content + Operations | MVP: 50–100 hand-curated. Growth: API partners, semi-automated ingestion. Update govt exam dates, scholarship deadlines weekly. |
| **Career Path Briefs** | Content team | Structured briefs per path: requirements, timeline, exam info (max ~500 words). Schema: `{requirements, timeline, exam_dates, industry_norms}`. Feed to Mentor system prompt. **Top 20 paths at launch**; expand to 50+ in 3 months. Exam dates: **quarterly review**. |

**Content calendar**: Monthly review of opportunities, learning paths. **Quarterly review** of career path requirements and path briefs.

**Future**: Localization (Hindi, regional languages) for UI and content. Offline/PWA for patchy connectivity—defer until core is stable.

---

## 14. Testing Strategy
| Layer | Approach |
|-------|----------|
| **Unit** | Pydantic models, utility functions, readiness algorithm. Jest for React components. |
| **Integration** | API endpoints (FastAPI TestClient). DB operations with test DB. Auth flows. |
| **Agent** | Mock LLM responses for deterministic tests. Sample prompts → expected behavior. |
| **E2E** | Playwright/Cypress for critical flows: signup → onboarding → dashboard → mentor (1 message). |
| **Agent evaluation** | Manual review of Mentor responses for sample personas (Medicine, Tech, Govt). Check: domain-appropriate, no hallucination on exam dates, empathic tone. |

**Coverage target**: 70%+ for backend; critical paths 100% E2E.

---

## 15. Monitoring & Observability
| Metric | Tool | Alert |
|--------|------|-------|
| **API latency** | Prometheus + Grafana or Datadog | p99 > 3s |
| **Agent latency** | Custom middleware | Mentor response > 10s |
| **LLM cost** | Token usage logs | Daily spend > threshold |
| **Errors** | Sentry / similar | 5xx, unhandled exceptions |
| **Auth** | Log failed logins | Spike in failures |
| **Agent failures** | Log A2A/MCP errors | Retry exhaustion |

**Logging**: Structured JSON. No PII in logs. Request IDs for tracing.

---

## 16. Moderation & Safety
| Area | Approach |
|------|----------|
| **Mentor input** | Filter harmful content (hate, self-harm, illegal). Block or refuse to respond. **Log to moderation queue** for review. |
| **Moderation queue** | Flagged content reviewed by **designated moderator** within 24h. Dashboard for queue. Escalation path for severe cases (e.g., legal, safety). |
| **User-generated** | Achievements, activity titles—basic profanity filter. Flag for review if reported. |
| **Escalation** | No in-app human handoff. Signpost to external: "For mental health support, contact [helpline]." |
| **Abuse** | Rate limits on Mentor, API. Account suspension for abuse. |

---

## 17. Open Decisions

1. **Monorepo vs multi-repo**: Single repo (frontend + backend + agents) vs separate
2. **Agent deployment**: All in one FastAPI process vs separate A2A services
3. **LLM provider**: Gemini (Vertex) vs OpenAI vs both
4. **Auth provider**: Supabase Auth vs custom (e.g. NextAuth + custom backend)

---

## 18. Inclusivity & Lifecycle Summary (Quick Reference)

| Aspect | Approach |
|--------|----------|
| **Who** | All Indian students—metro, tier-II/III, rural; any stream |
| **What** | Any subject, any career path—tech, medicine, arts, govt, agriculture, etc. |
| **When** | Student subscribes at **start of degree** (e.g., BTech 1st year); platform tracks until graduation |
| **Aspirations** | Up to **3 career paths** at start; final choice at graduation |
| **Tracking** | Projects, competitions, events, internships—**by academic year/semester** |
| **Portfolio** | Achievements tagged by year; activity timeline |
| **Readiness** | **Preparation score per path**; gaps; next best actions; graduation dashboard |
| **Opportunities** | Jobs, internships, govt exams, scholarships, fellowships |
| **Learning** | Domain-filtered; free/NPTEL; tier-appropriate |
| **UX** | Simple language; guided flows; lite mode; year-aware guidance |
| **Design** | Light theme only; glassmorphism; first-principles; audience-appropriate (trust, hope, clarity) |
| **AI Mentor** | Personalized companion; empathic; knows profile + 3 paths + full progress; references student's own inputs |
| **Onboarding** | 5 steps; **profile analysis (LLM) required**; paths 0–3; skills optional; "complete later" escape hatches |
| **Pricing** | Freemium; Free (5 mentor msgs/mo, readiness score visible) vs Pro (unlimited, gaps + actions); validate before gateway |
| **Privacy** | DPDP compliance; consent, retention, deletion; data residency |
| **Content** | Hand-curated seed; content team owns domains, paths, opportunities |
| **Testing** | Unit, integration, E2E, agent evaluation |
| **Monitoring** | Latency, cost, errors; no PII in logs |
| **Moderation** | Mentor input filter; signpost for mental health |

---

*Document version: 1.3 | Last updated: Feb 2025 | Incorporates Critical Review V2 recommendations*
