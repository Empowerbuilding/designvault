-- 003: Create design_cache table

CREATE TABLE IF NOT EXISTS design_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID REFERENCES website_floor_plans(id),
  action_type   TEXT NOT NULL,     -- 'style_swap' or 'floor_plan_edit'
  action_params TEXT NOT NULL,     -- preset name or edit prompt hash
  cache_key     TEXT,              -- legacy key format (planId:style:preset)
  result_url    TEXT NOT NULL,
  hit_count     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────

-- Primary lookup: plan + action type + params (unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_lookup
  ON design_cache(plan_id, action_type, action_params);

-- Secondary lookup by legacy cache_key (used by API service)
CREATE INDEX IF NOT EXISTS idx_cache_key
  ON design_cache(cache_key)
  WHERE cache_key IS NOT NULL;

-- Popular results
CREATE INDEX IF NOT EXISTS idx_cache_hits
  ON design_cache(hit_count DESC);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE design_cache ENABLE ROW LEVEL SECURITY;

-- Public can read cache entries
CREATE POLICY cache_select_policy ON design_cache
  FOR SELECT
  USING (true);

-- Only service role can insert (API service uses service key)
CREATE POLICY cache_insert_policy ON design_cache
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update (increment hit_count)
CREATE POLICY cache_update_policy ON design_cache
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ── Helper: increment hit count on cache read ───────────────

CREATE OR REPLACE FUNCTION increment_cache_hit(lookup_key TEXT)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE design_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = lookup_key;
$$;
