-- Add theme column to user_portfolios
ALTER TABLE user_portfolios ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'modern';
