-- ═══════════════════════════════════════════════════════════════════
-- SARGVISION AI — Migration 008: Parental Access & Nudges
-- ═══════════════════════════════════════════════════════════════════

-- 1. Parent-Student Relationship Table
CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, active, rejected
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_id, student_id)
);

-- 2. Parent Nudges Table (Guidance injected into AI Mentor)
CREATE TABLE IF NOT EXISTS parent_nudges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES auth.users(id),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    consumed_at TIMESTAMPTZ -- When the AI actually mentions it
);

-- 3. RLS Policies
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_nudges ENABLE ROW LEVEL SECURITY;

-- Parents can see their own links
CREATE POLICY "Parents can view their links" ON parent_student_links
    FOR SELECT USING (auth.uid() = parent_id);

-- Students can see their own links
CREATE POLICY "Students can view their links" ON parent_student_links
    FOR SELECT USING (auth.uid() = student_id);

-- Students can update the status (accept/reject)
CREATE POLICY "Students can update link status" ON parent_student_links
    FOR UPDATE USING (auth.uid() = student_id);

-- Parents can manage nudges for their active students
CREATE POLICY "Parents can manage nudges" ON parent_nudges
    FOR ALL USING (
        auth.uid() = parent_id AND 
        EXISTS (
            SELECT 1 FROM parent_student_links 
            WHERE parent_id = auth.uid() AND student_id = parent_nudges.student_id AND status = 'active'
        )
    );

-- 4. Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parent_student_links_updated_at
    BEFORE UPDATE ON parent_student_links
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
