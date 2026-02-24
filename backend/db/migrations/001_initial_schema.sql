-- ============================================================
-- SARGVISION AI — Initial Database Schema
-- Run via: supabase db push  OR  psql $DATABASE_URL < 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DOMAINS & CAREER PATHS
-- ============================================================
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- emoji or icon name
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    required_skills_json JSONB DEFAULT '[]'::JSONB, -- [{skill_id, min_level}]
    expected_activities_json JSONB DEFAULT '{}'::JSONB, -- {internships: 2, competitions: 1}
    recommended_learning_path_ids JSONB DEFAULT '[]'::JSONB, -- [learning_path_id]
    path_brief_json JSONB DEFAULT '{}'::JSONB, -- {requirements, timeline, exam_dates, industry_norms}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES skill_categories(id),
    domain_id UUID REFERENCES domains(id), -- NULL = universal
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    domain_id UUID REFERENCES domains(id),
    career_path_id UUID REFERENCES career_paths(id), -- final/primary path (set at graduation)
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    degree_type TEXT NOT NULL, -- BTech, MBBS, BA, BSc, etc.
    total_years INTEGER NOT NULL DEFAULT 4, -- 3, 4, or 5
    current_year INTEGER NOT NULL DEFAULT 1, -- 1-5
    academic_year_start INTEGER NOT NULL, -- e.g. 2024
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_aspirations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    career_path_id UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL DEFAULT 1, -- 1 = primary aspiration
    is_primary BOOLEAN DEFAULT FALSE, -- true when finalized at graduation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, career_path_id)
);

-- ============================================================
-- DIGITAL TWIN
-- ============================================================
CREATE TABLE IF NOT EXISTS digital_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    skills_json JSONB DEFAULT '[]'::JSONB,
    competencies_json JSONB DEFAULT '{}'::JSONB,
    aspirations_text TEXT, -- free-form aspiration from onboarding
    engagement_metrics JSONB DEFAULT '{}'::JSONB,
    readiness_scores_json JSONB DEFAULT '{}'::JSONB, -- {career_path_id: score}
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5), -- 1=Beginner, 5=Expert
    verified BOOLEAN DEFAULT FALSE,
    academic_year INTEGER, -- year acquired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, skill_id)
);

-- ============================================================
-- ACTIVITIES (LONGITUDINAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('project', 'competition', 'event', 'internship', 'certification', 'extracurricular')),
    title TEXT NOT NULL,
    details_json JSONB DEFAULT '{}'::JSONB, -- role, org, result, url, etc.
    academic_year INTEGER NOT NULL,
    semester INTEGER CHECK (semester IN (1, 2)),
    date DATE,
    relevance_path_ids JSONB DEFAULT '[]'::JSONB, -- [career_path_id] — user selects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACHIEVEMENTS (PORTFOLIO)
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- project, research, creative, competition, certification
    links_json JSONB DEFAULT '[]'::JSONB, -- [{label, url}]
    attachments_json JSONB DEFAULT '[]'::JSONB,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    academic_year INTEGER,
    semester INTEGER CHECK (semester IN (1, 2)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('job', 'internship', 'govt_exam', 'scholarship', 'fellowship', 'competition')),
    title TEXT NOT NULL,
    organization TEXT,
    domain_id UUID REFERENCES domains(id),
    description TEXT,
    requirements_json JSONB DEFAULT '{}'::JSONB,
    match_criteria TEXT,
    apply_url TEXT,
    deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'intent' CHECK (status IN ('intent', 'applied', 'shortlisted', 'rejected', 'selected')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, opportunity_id)
);

-- ============================================================
-- LEARNING PATHS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    provider TEXT, -- NPTEL, Coursera, Udemy, etc.
    url TEXT,
    domain_id UUID REFERENCES domains(id),
    skills_covered JSONB DEFAULT '[]'::JSONB, -- [skill_id]
    category TEXT, -- course, certification, tutorial, book
    is_free BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'English',
    duration_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    completed_at TIMESTAMPTZ,
    academic_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, path_id)
);

-- ============================================================
-- MENTOR (AI CHAT)
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    context_snapshot JSONB DEFAULT '{}'::JSONB -- snapshot of profile at session start
);

CREATE TABLE IF NOT EXISTS mentor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Free tier: track monthly message usage
CREATE TABLE IF NOT EXISTS mentor_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- YYYY-MM
    message_count INTEGER DEFAULT 0,
    UNIQUE (user_id, month)
);

-- ============================================================
-- CONTENT & SIMPLIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS content_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT, -- paper, article, video, textbook
    url TEXT,
    domain_id UUID REFERENCES domains(id),
    summary TEXT,
    key_concepts JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simplification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_library(id),
    output_type TEXT, -- summary, key_concepts, explainer
    result_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- READINESS SNAPSHOTS (HISTORY)
-- ============================================================
CREATE TABLE IF NOT EXISTS readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    career_path_id UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    gaps_json JSONB DEFAULT '[]'::JSONB,
    recommendations_json JSONB DEFAULT '[]'::JSONB,
    snapshot_date DATE DEFAULT CURRENT_DATE
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_user_id ON academic_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_aspirations_user_id ON user_aspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_user_id ON digital_twins(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_year ON activities(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_domain ON opportunities(domain_id, is_active);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON opportunity_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_user_id ON mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_session ON mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user ON readiness_snapshots(user_id, career_path_id);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE simplification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own data
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'profiles', 'academic_enrollments', 'user_aspirations', 'digital_twins',
        'user_skills', 'activities', 'achievements', 'opportunity_applications',
        'enrollments', 'mentor_sessions', 'mentor_usage',
        'simplification_requests', 'readiness_snapshots'
    ];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format(
            'CREATE POLICY "%s_self_only" ON %I FOR ALL
             USING (user_id = auth.uid())
             WITH CHECK (user_id = auth.uid())',
            t, t
        );
    END LOOP;
END $$;

-- Mentor messages: accessible via session ownership
CREATE POLICY "mentor_messages_self" ON mentor_messages FOR ALL
    USING (session_id IN (SELECT id FROM mentor_sessions WHERE user_id = auth.uid()));

-- Public read for reference data
CREATE POLICY "domains_public_read" ON domains FOR SELECT USING (TRUE);
CREATE POLICY "career_paths_public_read" ON career_paths FOR SELECT USING (TRUE);
CREATE POLICY "skills_public_read" ON skills FOR SELECT USING (TRUE);
CREATE POLICY "skill_categories_public_read" ON skill_categories FOR SELECT USING (TRUE);
CREATE POLICY "opportunities_public_read" ON opportunities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "learning_paths_public_read" ON learning_paths FOR SELECT USING (TRUE);
CREATE POLICY "content_library_public_read" ON content_library FOR SELECT USING (TRUE);
