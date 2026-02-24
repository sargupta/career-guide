-- ═══════════════════════════════════════════════════════════════════
-- SARGVISION AI — Migration 009: Monthly Progress Reports
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_month TEXT NOT NULL, -- Format: YYYY-MM (e.g., 2026-02)
    narrative_summary TEXT NOT NULL,
    metrics_snapshot JSONB DEFAULT '{}'::JSONB, -- {skill_gains, readiness_change, activities_count}
    parent_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, report_month)
);

-- RLS Policies
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Students can view their own reports
CREATE POLICY "Students can view their reports" ON monthly_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Parents can view reports of their active students
CREATE POLICY "Parents can view student reports" ON monthly_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE parent_id = auth.uid() AND student_id = monthly_reports.user_id AND status = 'active'
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_id ON monthly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON monthly_reports(report_month);
