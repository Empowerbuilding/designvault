-- 002: Create design_sessions table

CREATE TABLE IF NOT EXISTS design_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id              TEXT NOT NULL,
  plan_id                   UUID REFERENCES website_floor_plans(id),
  builder_slug              TEXT NOT NULL,
  interaction_count         INTEGER DEFAULT 0,
  is_captured               BOOLEAN DEFAULT false,
  modifications             JSONB DEFAULT '[]',
  style_preference          TEXT,
  original_plan_url         TEXT,
  customized_exterior_url   TEXT,
  customized_floor_plan_url TEXT,
  contact_id                UUID,
  captured_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_anonymous_id
  ON design_sessions(anonymous_id);

CREATE INDEX IF NOT EXISTS idx_sessions_builder_slug
  ON design_sessions(builder_slug);

CREATE INDEX IF NOT EXISTS idx_sessions_plan_id
  ON design_sessions(plan_id);

CREATE INDEX IF NOT EXISTS idx_sessions_captured
  ON design_sessions(captured_at)
  WHERE captured_at IS NOT NULL;

-- ── Auto-update updated_at ──────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON design_sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON design_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;

-- Public can read their own sessions (by anonymous_id)
CREATE POLICY sessions_select_policy ON design_sessions
  FOR SELECT
  USING (true);

-- Public can create sessions
CREATE POLICY sessions_insert_policy ON design_sessions
  FOR INSERT
  WITH CHECK (true);

-- Public can update their own sessions
CREATE POLICY sessions_update_policy ON design_sessions
  FOR UPDATE
  USING (true);
