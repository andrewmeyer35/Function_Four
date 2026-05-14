-- Migration 005 — Meals Feature Tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── pantry_items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id     UUID REFERENCES households(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  aliases          TEXT[] NOT NULL DEFAULT '{}',
  quantity         NUMERIC(10,3),
  unit             TEXT,
  expiration_date  DATE,
  category         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pantry_items_open" ON pantry_items;
CREATE POLICY "pantry_items_open" ON pantry_items USING (true) WITH CHECK (true);

-- ─── meal_photos ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_photos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id        UUID REFERENCES households(id) ON DELETE SET NULL,
  image_url           TEXT NOT NULL,
  dish_name           TEXT NOT NULL,
  dish_confidence     NUMERIC(4,3),
  cuisine             TEXT,
  estimated_servings  INT,
  analysis_json       JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE meal_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_photos_open" ON meal_photos;
CREATE POLICY "meal_photos_open" ON meal_photos USING (true) WITH CHECK (true);

-- ─── consumption_logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumption_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id      UUID REFERENCES households(id) ON DELETE SET NULL,
  pantry_item_id    UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  meal_photo_id     UUID REFERENCES meal_photos(id) ON DELETE SET NULL,
  ingredient_name   TEXT NOT NULL,
  quantity_consumed NUMERIC(10,3),
  unit              TEXT,
  source_type       TEXT NOT NULL,  -- 'meal_photo_estimated' | 'confirmed'
  confidence        NUMERIC(4,3),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consumption_logs_open" ON consumption_logs;
CREATE POLICY "consumption_logs_open" ON consumption_logs USING (true) WITH CHECK (true);

-- ─── recipe_imports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipe_imports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id          UUID REFERENCES households(id) ON DELETE SET NULL,
  source_url            TEXT,
  source_type           TEXT NOT NULL,  -- 'url_jsonld' | 'url_llm' | 'screenshot_ocr' | 'manual_entry'
  source_image_url      TEXT,
  recipe_json           JSONB NOT NULL,
  extraction_confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  pantry_deductions     JSONB NOT NULL DEFAULT '[]',
  cart_items            JSONB NOT NULL DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'confirmed',
  confirmed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recipe_imports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_imports_open" ON recipe_imports;
CREATE POLICY "recipe_imports_open" ON recipe_imports USING (true) WITH CHECK (true);

-- ─── RPC: decrement_pantry_quantity ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_pantry_quantity(p_item_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pantry_items
  SET
    quantity   = GREATEST(0, COALESCE(quantity, 0) - p_amount),
    updated_at = now()
  WHERE id = p_item_id;
END;
$$;
