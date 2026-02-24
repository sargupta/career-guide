-- ============================================================
-- SARGVISION AI — Persona Engine Migration
-- Run via: supabase db push OR psql $DATABASE_URL < 002_persona_profiles.sql
-- ============================================================

-- ============================================================
-- USER PERSONA PROFILES
-- Stores psychographic + behavioural classification per user.
-- Populated during onboarding, refined over time.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_persona_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Archetype Classification
    archetype TEXT NOT NULL DEFAULT 'EXPLORER',
        -- MAANG_ASPIRANT | GOVT_ASPIRANT | RESEARCHER | ACADEMIC_TOPPER
        -- CREATIVE_HUSTLER | BREADWINNER | CAREER_SWITCHER | NATURAL_LEADER
        -- DISTRACTED_LEARNER | RURAL_HOPEFUL | EXPLORER
    segment TEXT,
        -- IT | RESEARCH | GOVT | CREATIVE | MANAGEMENT | SALES | ACADEMIA
    confidence_score NUMERIC(3,1) DEFAULT 0.0, -- 0.0-1.0, classifier confidence

    -- Psychographic Profile
    learning_style TEXT DEFAULT 'text',
        -- visual | text | audio | bullets
    motivation_type TEXT DEFAULT 'mixed',
        -- intrinsic | extrinsic | mixed
    info_density TEXT DEFAULT 'medium',
        -- high | medium | low
    confidence_level INTEGER DEFAULT 5 CHECK (confidence_level BETWEEN 1 AND 10),

    -- Emotional & Social Context
    primary_anxiety TEXT,
        -- 'placement_stress' | 'financial_urgency' | 'lost_unsure' | 'exam_prep' | 'peer_competition'
    social_context TEXT,
        -- 'hustle_culture' | 'community_cohort' | 'family_expectation' | 'academic_peer'

    -- Communication Preferences
    tone_preference TEXT DEFAULT 'peer',
        -- strict_coach | peer | executive | companion | researcher | elder_sibling
    language_preference TEXT DEFAULT 'en',
        -- en | hi | hinglish
    nudge_channel TEXT DEFAULT 'whatsapp',
        -- whatsapp | dashboard | email
    nudge_hour_ist INTEGER DEFAULT 19 CHECK (nudge_hour_ist BETWEEN 0 AND 23),
        -- Best hour to send nudge in IST (24h format). e.g. 5 = 5 AM

    -- Device & Connectivity
    device_tier TEXT DEFAULT 'mid',
        -- low | mid | high
    connectivity TEXT DEFAULT 'average',
        -- poor | average | fiber

    -- AI Memory Hints (Top 3 injected into LLM context)
    memory_hint_1 TEXT, -- e.g. "Student is working part-time. Keep advice short."
    memory_hint_2 TEXT,
    memory_hint_3 TEXT,

    -- MCP Tool Priority
    primary_mcp_tool TEXT,   -- e.g. 'opportunity_scout', 'academic_radar', 'news_scout'
    secondary_mcp_tool TEXT,

    -- Raw Signals Storage
    signals_raw JSONB DEFAULT '{}'::JSONB, -- raw 5-question onboarding answers

    -- Metadata
    classifier_version TEXT DEFAULT 'v1.0',
    is_manually_updated BOOLEAN DEFAULT FALSE, -- true if user overrode the auto-classification
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_persona_profiles_user_id ON user_persona_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_persona_profiles_archetype ON user_persona_profiles(archetype);

-- RLS: Users can only access their own persona profile
ALTER TABLE user_persona_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_profiles_self_only" ON user_persona_profiles FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- PERSONA SIGNAL AUDIT LOG
-- Stores every signal update event for debugging/analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS persona_signal_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
        -- 'onboarding' | 'domain_change' | 'activity_log' | 'manual_override'
    signals_delta JSONB DEFAULT '{}'::JSONB,  -- what changed
    archetype_before TEXT,
    archetype_after TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persona_signal_log_user ON persona_signal_log(user_id);
ALTER TABLE persona_signal_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persona_signal_log_self_only" ON persona_signal_log FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
