-- ============================================================
-- SARGVISION AI — Phase 14.1 Gamification Migration (005)
-- ============================================================

-- 1. Add XP and Streak tracking to the main profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- 2. Create the Badges table to store earned awards
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL, -- e.g., 'first_login', '7_day_streak', 'resume_ready'
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    icon_url TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, badge_key) -- Ensure a user only earns a specific badge once
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_uuid ON user_badges(user_id);

-- RLS Policies
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_self_read" ON user_badges FOR SELECT
    USING (user_id = auth.uid());
    
-- Server-side role or trigger usually controls inserts, but we allow self-inserts for API layer
CREATE POLICY "user_badges_self_insert" ON user_badges FOR INSERT
    WITH CHECK (user_id = auth.uid());
