-- ============================================================
-- SARGVISION AI — Smart Portfolio Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS user_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    highlights JSONB DEFAULT '[]'::JSONB, -- [{title, reason}]
    share_slug TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by share_slug
CREATE INDEX IF NOT EXISTS idx_user_portfolios_slug ON user_portfolios(share_slug);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user ON user_portfolios(user_id);

-- Enable RLS
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- Policies: users can only manage their own portfolio
CREATE POLICY "user_portfolios_self_only" ON user_portfolios FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Public read for public portfolios
CREATE POLICY "user_portfolios_public_read" ON user_portfolios FOR SELECT
    USING (is_public = TRUE);
