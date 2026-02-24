-- ============================================================
-- SARGVISION AI — Phase 44: Scholarship & Grant Tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS user_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scholarship_name TEXT NOT NULL,
    provider TEXT NOT NULL, -- Govt, CSR, NGO, etc.
    financial_benefit TEXT,
    deadline DATE,
    eligibility_status TEXT DEFAULT 'pending' CHECK (eligibility_status IN ('pending', 'eligible', 'ineligible')),
    audit_notes_json JSONB DEFAULT '[]'::JSONB, -- [{criteria, status, notes}]
    parent_recommended BOOLEAN DEFAULT FALSE,
    application_status TEXT DEFAULT 'not_applied' CHECK (application_status IN ('not_applied', 'applied', 'shortlisted', 'awarded', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, scholarship_name, deadline)
);

-- RLS
ALTER TABLE user_scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_scholarships_self_only" ON user_scholarships FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_scholarships_user ON user_scholarships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scholarships_status ON user_scholarships(eligibility_status);
