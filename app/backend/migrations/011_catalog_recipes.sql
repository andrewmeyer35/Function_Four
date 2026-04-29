CREATE TABLE IF NOT EXISTS catalog_recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT,
  cuisines     TEXT[] NOT NULL DEFAULT '{}',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  recipe_json  JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_cuisines     ON catalog_recipes USING GIN(cuisines);
CREATE INDEX IF NOT EXISTS idx_catalog_dietary_tags ON catalog_recipes USING GIN(dietary_tags);

ALTER TABLE catalog_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "catalog_read" ON catalog_recipes;
CREATE POLICY "catalog_read" ON catalog_recipes FOR SELECT USING (true);
