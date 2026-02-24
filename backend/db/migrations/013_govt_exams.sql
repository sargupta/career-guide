-- ============================================================
-- SARGVISION AI — Phase 43: Government Exam Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS user_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL, -- e.g. 'UPSC', 'GATE', 'CAT', 'SSC', 'IBPS'
    target_date DATE NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'preparing' CHECK (status IN ('planning', 'preparing', 'reviewing', 'completed')),
    syllabus_progress_json JSONB DEFAULT '[]'::JSONB, -- [{subject, status, progress_pct, notes}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, exam_type, target_date)
);

-- RLS
ALTER TABLE user_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_exams_self_only" ON user_exams FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_exams_user ON user_exams(user_id);
