-- ============================================================
-- SARGVISION AI — Phase 47: Classroom Management & Assignments
-- ============================================================

-- 1. Classrooms (Batches)
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL, -- 6-digit unique code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enrollments (Students in Classrooms)
CREATE TABLE IF NOT EXISTS classroom_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classroom_id, student_id)
);

-- 3. Assignments (Tasks pushed by teachers)
CREATE TABLE IF NOT EXISTS classroom_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES teacher_assets(id) ON DELETE CASCADE,
    deadline TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Submissions (Student work)
CREATE TABLE IF NOT EXISTS classroom_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES classroom_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers_json JSONB NOT NULL,
    grade_score INTEGER, -- 0-100
    feedback_text TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'reviewed')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- RLS
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_submissions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own classrooms
CREATE POLICY "teachers_manage_classrooms" ON classrooms FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- Students and teachers can see members of their classrooms
CREATE POLICY "view_enrollments" ON classroom_enrollments FOR SELECT
    USING (
        student_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
    );

-- Assignments RLS
CREATE POLICY "view_assignments" ON classroom_assignments FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM classroom_enrollments WHERE classroom_id = classroom_assignments.classroom_id AND student_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
    );

-- Submissions RLS
CREATE POLICY "manage_own_submissions" ON classroom_submissions FOR ALL
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "teachers_view_submissions" ON classroom_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classroom_assignments a
            JOIN classrooms c ON a.classroom_id = c.id
            WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "teachers_grade_submissions" ON classroom_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM classroom_assignments a
            JOIN classrooms c ON a.classroom_id = c.id
            WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
        )
    );

-- Enable classroom join by students
CREATE POLICY "students_join_classrooms" ON classroom_enrollments FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON classrooms(join_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON classroom_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON classroom_assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON classroom_submissions(assignment_id);
