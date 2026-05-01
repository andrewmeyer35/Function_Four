-- Migration 012: Pantry photos
-- Adds optional image_url column to pantry_items for per-item photo support.
-- Storage bucket 'pantry-photos' must be created manually in Supabase Dashboard:
--   Storage → New bucket → Name: "pantry-photos", Public: true
-- Then add RLS policy via SQL Editor:
--   CREATE POLICY "pantry photos open" ON storage.objects
--   FOR ALL USING (bucket_id = 'pantry-photos') WITH CHECK (bucket_id = 'pantry-photos');

ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS image_url TEXT;

NOTIFY pgrst, 'reload schema';
