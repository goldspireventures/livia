-- Design proof ownership, publish rights, revision chain (body-art).
ALTER TABLE design_proof_assets
  ADD COLUMN IF NOT EXISTS proof_kind text NOT NULL DEFAULT 'custom_commission',
  ADD COLUMN IF NOT EXISTS publish_right text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_proof_id text REFERENCES design_proof_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS design_proof_assets_publish_idx
  ON design_proof_assets(business_id, status, publish_right);

-- Backfill flash rows from note heuristics.
UPDATE design_proof_assets
SET proof_kind = 'flash',
    publish_right = 'flash_resell_ok'
WHERE lower(coalesce(note, '')) LIKE '%flash%'
  AND publish_right = 'private'
  AND proof_kind = 'custom_commission';
