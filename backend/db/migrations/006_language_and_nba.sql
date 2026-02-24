-- DB Migration for Phase 16: Regional Language
-- Add preferred_language to our profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'English';

-- Optional: constraint to keep it clean (though frontend will control it via select)
-- ALTER TABLE public.profiles ADD CONSTRAINT check_language CHECK (preferred_language IN ('English', 'Hinglish', 'Hindi', 'Bengali'));
