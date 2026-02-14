-- 001: Extend website_floor_plans with design vault columns
-- Safe to run multiple times: each ALTER uses IF NOT EXISTS via DO blocks

-- ── New columns ─────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN style TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN category TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN price_tier TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN is_featured BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN is_new BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN floor_plan_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN interior_urls JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN tags TEXT[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN click_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN display_order INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE website_floor_plans ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_floor_plans_style
  ON website_floor_plans(style);

CREATE INDEX IF NOT EXISTS idx_floor_plans_category
  ON website_floor_plans(category);

CREATE INDEX IF NOT EXISTS idx_floor_plans_featured
  ON website_floor_plans(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_floor_plans_click_count
  ON website_floor_plans(click_count DESC);

CREATE INDEX IF NOT EXISTS idx_floor_plans_display_order
  ON website_floor_plans(display_order ASC);

-- ── RPC: atomic click increment ─────────────────────────────

CREATE OR REPLACE FUNCTION increment_click_count(plan_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE website_floor_plans
  SET click_count = click_count + 1
  WHERE id = plan_id;
$$;
