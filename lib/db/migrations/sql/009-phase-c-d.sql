-- Phase C/D: morning briefings, prompt versions, structure, packs, media

CREATE TYPE business_structure_kind AS ENUM ('standalone', 'location', 'brand_entity');

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS parent_business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS structure_kind business_structure_kind NOT NULL DEFAULT 'standalone',
  ADD COLUMN IF NOT EXISTS liv_pack_config jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS businesses_parent_idx ON businesses(parent_business_id);

CREATE TABLE IF NOT EXISTS morning_briefings (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  briefing_date text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, briefing_date)
);

CREATE INDEX IF NOT EXISTS morning_briefings_business_idx ON morning_briefings(business_id);

CREATE TABLE IF NOT EXISTS liv_prompt_versions (
  id text PRIMARY KEY,
  business_id text REFERENCES businesses(id) ON DELETE CASCADE,
  prompt_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS liv_prompt_versions_lookup_idx
  ON liv_prompt_versions(business_id, prompt_key, is_active);

CREATE TABLE IF NOT EXISTS media_assets (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  mime_type text,
  entity_type text,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_business_entity_idx
  ON media_assets(business_id, entity_type, entity_id);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS avatar_url text;
