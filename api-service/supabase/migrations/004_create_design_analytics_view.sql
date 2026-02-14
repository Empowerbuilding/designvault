-- 004: Create design_analytics materialized view for builder dashboards

-- Drop existing view if schema changed
DROP VIEW IF EXISTS design_analytics;

CREATE VIEW design_analytics AS
SELECT
  builder_slug,
  COUNT(*)
    AS total_sessions,
  COUNT(*) FILTER (WHERE captured_at IS NOT NULL)
    AS captured_sessions,
  COUNT(*) FILTER (WHERE jsonb_array_length(modifications) > 0)
    AS interactive_sessions,
  ROUND(AVG(jsonb_array_length(modifications))::numeric, 2)
    AS avg_modifications,
  ROUND(
    (COUNT(*) FILTER (WHERE captured_at IS NOT NULL))::numeric
    / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS capture_rate_pct,
  DATE_TRUNC('day', created_at)
    AS day
FROM design_sessions
GROUP BY builder_slug, DATE_TRUNC('day', created_at)
ORDER BY day DESC, builder_slug;

-- ── Grant read access ───────────────────────────────────────

GRANT SELECT ON design_analytics TO authenticated;
GRANT SELECT ON design_analytics TO anon;

-- ── Popular plans view ──────────────────────────────────────

DROP VIEW IF EXISTS popular_plans;

CREATE VIEW popular_plans AS
SELECT
  p.id,
  p.title,
  p.style,
  p.category,
  p.click_count,
  COUNT(s.id) AS session_count,
  COUNT(s.id) FILTER (WHERE s.captured_at IS NOT NULL) AS capture_count
FROM website_floor_plans p
LEFT JOIN design_sessions s ON s.plan_id = p.id
GROUP BY p.id, p.title, p.style, p.category, p.click_count
ORDER BY p.click_count DESC;

GRANT SELECT ON popular_plans TO authenticated;
GRANT SELECT ON popular_plans TO anon;
