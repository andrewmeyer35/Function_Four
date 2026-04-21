-- Add workout detail columns to daily_logs
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS workout_intensity SMALLINT CHECK (workout_intensity BETWEEN 1 AND 7),
  ADD COLUMN IF NOT EXISTS workout_distance  NUMERIC(6,2);
