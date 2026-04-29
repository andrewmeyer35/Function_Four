-- Migration 007 — Container / Package Tracking
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rhsefwfepsefykmrnhyp/sql

ALTER TABLE pantry_items
  ADD COLUMN IF NOT EXISTS package_size NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS package_unit TEXT;

NOTIFY pgrst, 'reload schema';