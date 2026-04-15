-- Add builder_slugs array to floor plans for per-builder filtering
ALTER TABLE website_floor_plans
  ADD COLUMN IF NOT EXISTS builder_slugs text[] DEFAULT NULL;

-- NULL means visible to all builders (backwards compatible)
-- Set specific slugs to restrict a plan to certain builders
-- Example: UPDATE website_floor_plans SET builder_slugs = '{barnhaus,showcase}' WHERE id = '...';

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_floor_plans_builder_slugs
  ON website_floor_plans USING GIN (builder_slugs);
