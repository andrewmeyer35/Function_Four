-- Migration 009 — Persistent Cart Items
-- Run in Supabase SQL Editor
-- After running: NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  household_id  UUID,
  name          TEXT NOT NULL,
  quantity      NUMERIC,
  unit          TEXT,
  checked_at    TIMESTAMPTZ,
  -- 'custom' = added by user (not from recipe)
  -- 'override' = user changed qty on a meal-plan-derived item
  source        TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('custom', 'override')),
  week_start    DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id   ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_household ON cart_items(household_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_week      ON cart_items(week_start);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_items_all" ON cart_items;
CREATE POLICY "cart_items_all" ON cart_items USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for live household sync
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

NOTIFY pgrst, 'reload schema';