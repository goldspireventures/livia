-- Per-tenant Liv outbound copy overrides (platform-wide; policy holds defaults)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS liv_outbound_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
