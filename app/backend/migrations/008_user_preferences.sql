-- Migration 008 — User Food Preferences
-- Run in Supabase SQL Editor
-- After running: NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS user_preferences (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL,
  -- Dietary restrictions: 'vegetarian','vegan','gluten-free','dairy-free','nut-free','shellfish-free','halal','kosher'
  dietary_restrictions    TEXT[] NOT NULL DEFAULT '{}',
  -- Free-form ingredient names the user wants to avoid
  disliked_ingredients    TEXT[] NOT NULL DEFAULT '{}',
  -- Cuisine types: 'italian','asian','mexican','mediterranean','american','indian','middle-eastern','french','greek','japanese'
  cuisine_preferences     TEXT[] NOT NULL DEFAULT '{}',
  household_size          INT NOT NULL DEFAULT 2 CHECK (household_size BETWEEN 1 AND 10),
  -- 'quick' (<30 min), 'medium' (30-60 min), 'elaborate' (60+ min)
  weekly_cooking_time     TEXT NOT NULL DEFAULT 'medium' CHECK (weekly_cooking_time IN ('quick', 'medium', 'elaborate')),
  default_servings        INT NOT NULL DEFAULT 2 CHECK (default_servings BETWEEN 1 AND 20),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_select" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_upsert" ON user_preferences;

CREATE POLICY "user_preferences_select" ON user_preferences USING (true) WITH CHECK (true);
CREATE POLICY "user_preferences_upsert" ON user_preferences
  FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
