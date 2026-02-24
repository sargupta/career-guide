-- ═══════════════════════════════════════════════════════════════════
-- SARGVISION AI — Migration 010: Resource Library
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE resource_type AS ENUM ('video', 'pdf', 'article', 'course');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type resource_type NOT NULL DEFAULT 'article',
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    tags JSONB DEFAULT '[]'::JSONB, -- List of specific topics/skills e.g. ["Anatomy", "Surgical Basics"]
    difficulty difficulty_level DEFAULT 'intermediate',
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Everyone can view active resources (Public Read)
CREATE POLICY "Anyone can view active resources" ON resources
    FOR SELECT USING (is_active = TRUE);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_domain_id ON resources(domain_id);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING GIN (tags);

-- Seed initial resources (Mock Data for Medical/Eng)
INSERT INTO resources (title, description, url, type, domain_id, tags, difficulty)
SELECT 
    'Anatomy Fundamentals', 
    'A comprehensive guide to human anatomy for first-year medical students.', 
    'https://www.youtube.com/watch?v=anatomy101', 
    'video', 
    id, 
    '["Anatomy", "Medical Basics"]'::JSONB, 
    'beginner'
FROM domains WHERE name = 'Medical Professionals' LIMIT 1;

INSERT INTO resources (title, description, url, type, domain_id, tags, difficulty)
SELECT 
    'Calculus for Engineers', 
    'Advanced calculus concepts applied to structural engineering.', 
    'https://ocw.mit.edu/courses/mathematics/', 
    'course', 
    id, 
    '["Math", "Engineering Basics"]'::JSONB, 
    'intermediate'
FROM domains WHERE name = 'Software Engineering' LIMIT 1;
