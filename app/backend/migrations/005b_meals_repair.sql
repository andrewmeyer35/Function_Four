-- Migration 005b — Meals Schema Repair
-- Safe to run multiple times (all statements are idempotent).
-- Run in Supabase SQL Editor after 005_meals_tables.sql

-- ─── pantry_items — ensure all queried columns exist ─────────────────────────
ALTER TABLE pantry_items
  ADD COLUMN IF NOT EXISTS aliases         TEXT[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quantity        NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS unit            TEXT,
  ADD COLUMN IF NOT EXISTS expiration_date DATE,
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now();

-- ─── meal_photos — ensure all inserted columns exist ─────────────────────────
ALTER TABLE meal_photos
  ADD COLUMN IF NOT EXISTS dish_confidence    NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS cuisine            TEXT,
  ADD COLUMN IF NOT EXISTS estimated_servings INT,
  ADD COLUMN IF NOT EXISTS analysis_json      JSONB;

-- ─── consumption_logs — ensure all inserted columns exist ─────────────────────
ALTER TABLE consumption_logs
  ADD COLUMN IF NOT EXISTS pantry_item_id    UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meal_photo_id     UUID REFERENCES meal_photos(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity_consumed NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS unit              TEXT,
  ADD COLUMN IF NOT EXISTS confidence        NUMERIC(4,3);

-- ─── recipe_imports — rename legacy 'recipe' column if it still exists ────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipe_imports' AND column_name = 'recipe'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipe_imports' AND column_name = 'recipe_json'
  ) THEN
    ALTER TABLE recipe_imports RENAME COLUMN "recipe" TO "recipe_json";
  END IF;
END $$;

-- ─── recipe_imports — ensure all inserted columns exist ──────────────────────
ALTER TABLE recipe_imports
  ADD COLUMN IF NOT EXISTS recipe_json           JSONB,
  ADD COLUMN IF NOT EXISTS source_image_url      TEXT,
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS pantry_deductions     JSONB        NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cart_items            JSONB        NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status                TEXT        NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS confirmed_at          TIMESTAMPTZ;

-- recipe_json must not be null for new rows — drop NOT NULL only if column was
-- just added as nullable (legacy rows may not have it).
-- Make it nullable so existing rows without it don't break reads.
ALTER TABLE recipe_imports ALTER COLUMN recipe_json DROP NOT NULL;

-- ─── Reload PostgREST schema cache ───────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
