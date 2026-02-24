-- ============================================================
-- SARGVISION AI — Phase 45: Teacher Co-Pilot Tools
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('quiz', 'lesson_plan', 'worksheet')),
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    title TEXT NOT NULL,
    content_json JSONB NOT NULL, -- The AI-generated content (questions, steps, etc.)
    is_public BOOLEAN DEFAULT FALSE,
    remixed_from UUID REFERENCES teacher_assets(id) ON DELETE SET NULL,
    clones_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE teacher_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_assets_self_only" ON teacher_assets FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "teacher_assets_public_read" ON teacher_assets FOR SELECT
    USING (is_public = TRUE);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_assets_teacher ON teacher_assets(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assets_type ON teacher_assets(asset_type);
