-- Track D2: tenant presentation preset + optional brand accent override.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS presentation_preset_id text DEFAULT 'platform-default',
  ADD COLUMN IF NOT EXISTS brand_accent_hex text;

UPDATE businesses
SET presentation_preset_id = 'platform-default'
WHERE presentation_preset_id IS NULL;
