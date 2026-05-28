-- Liv entity memory (ADR 0012 rung 5) + tool catalog mirror (registry sync).
CREATE TABLE IF NOT EXISTS liv_entity_memory (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_by text NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS liv_entity_memory_entity_idx
  ON liv_entity_memory(business_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS liv_tool_catalog (
  id text PRIMARY KEY,
  tool_id text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  profile text NOT NULL,
  risk text NOT NULL,
  description text NOT NULL,
  input_schema jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS liv_tool_catalog_tool_profile_idx
  ON liv_tool_catalog(tool_id, profile);
