-- Migration 010: Add suggestion cache columns to user_preferences
-- Run in Supabase SQL Editor, then: NOTIFY pgrst, 'reload schema';

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS cached_suggestions    JSONB,
  ADD COLUMN IF NOT EXISTS last_suggestion_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pantry_snapshot_hash  TEXT;
