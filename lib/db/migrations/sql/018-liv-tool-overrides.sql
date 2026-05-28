-- Per-tenant Liv tool enable/disable (overrides global catalog defaults).
CREATE TABLE IF NOT EXISTS liv_business_tool_overrides (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  profile text NOT NULL,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS liv_business_tool_overrides_unique_idx
  ON liv_business_tool_overrides(business_id, tool_id, profile);
