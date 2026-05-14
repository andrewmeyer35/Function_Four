-- Migration 006 — Weekly Meal Planning
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rhsefwfepsefykmrnhyp/sql

-- Add reorder threshold to pantry items
ALTER TABLE pantry_items
  ADD COLUMN IF NOT EXISTS min_quantity NUMERIC(10,3);

-- Weekly meal plan header (one per user per week)
CREATE TABLE IF NOT EXISTS meal_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  week_start   DATE NOT NULL,   -- Saturday (matches existing week system)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- One row per recipe slot per day
CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id     UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week      SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sat…6=Fri
  recipe_import_id UUID REFERENCES recipe_imports(id) ON DELETE SET NULL,
  custom_dish_name TEXT,   -- fallback when no saved recipe
  servings         INT NOT NULL DEFAULT 2,
  meal_type        TEXT NOT NULL DEFAULT 'dinner',  -- breakfast|lunch|dinner|snack
  UNIQUE(meal_plan_id, day_of_week, meal_type)
);

ALTER TABLE meal_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_plans_open"        ON meal_plans;
DROP POLICY IF EXISTS "meal_plan_entries_open" ON meal_plan_entries;
CREATE POLICY "meal_plans_open"        ON meal_plans        USING (true) WITH CHECK (true);
CREATE POLICY "meal_plan_entries_open" ON meal_plan_entries USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
