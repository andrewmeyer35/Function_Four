-- ============================================================
-- Migration 003: Goals and Daily Logs
-- Week runs Saturday (day 1) → Friday (day 7)
-- ============================================================

-- User-defined weekly goals per category
CREATE TABLE IF NOT EXISTS user_goals (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL CHECK (category IN ('financial','fitness','fun','flirt')),
  metric_key  TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  target      INTEGER     NOT NULL DEFAULT 3 CHECK (target >= 1 AND target <= 21),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric_key)
);

-- Daily tracking logs — one row per user per calendar day
CREATE TABLE IF NOT EXISTS daily_logs (
  id                     UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id           UUID        REFERENCES households(id),
  log_date               DATE        NOT NULL,
  week_start             DATE        NOT NULL, -- always a Saturday

  -- Financial
  saved_toward_goal      BOOLEAN,
  no_impulse_spend       BOOLEAN,
  meals_ate_in           BOOLEAN,   -- did you eat most meals at home?

  -- Fitness
  worked_out             BOOLEAN,
  sleep_7plus            BOOLEAN,   -- slept 7+ hours last night
  good_nutrition         BOOLEAN,   -- ate clean or balanced

  -- Social / Fun
  had_social_activity    BOOLEAN,
  quality_connection     BOOLEAN,   -- meaningful 1-on-1 or group connection

  -- Flirt / Fervier
  dating_activity        BOOLEAN,
  self_care              BOOLEAN,   -- solo glow-up / self care day

  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Row Level Security
ALTER TABLE user_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs  ENABLE ROW LEVEL SECURITY;

-- Permissive Phase 1 policies (lock down in Phase 1.1)
CREATE POLICY "users_own_goals"      ON user_goals  USING (true) WITH CHECK (true);
CREATE POLICY "users_own_daily_logs" ON daily_logs   USING (true) WITH CHECK (true);
