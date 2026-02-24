-- ═══════════════════════════════════════════════════════════════════
-- Migration 004: Add memory_summary column to profiles
--
-- Stores a weekly Gemini-generated narrative summary of the student's
-- memory facts, used for fast long-term context injection without a
-- full vector search on every request.
--
-- Updated by: scheduler.py → job_enrich_digital_twin()
-- Read by: agents/lead_mentor.py (appended to instruction)
-- ═══════════════════════════════════════════════════════════════════

alter table profiles
    add column if not exists memory_summary      text,         -- Gemini-generated narrative of all career facts
    add column if not exists memory_enriched_at  timestamptz;  -- when last enriched by the scheduler

comment on column profiles.memory_summary is
    'Weekly Gemini-synthesised summary of the student''s career memory facts '
    '(goals, skills, blockers, experience). Updated by job_enrich_digital_twin(). '
    'Injected into LeadMentor instruction as a compact long-term context.';
