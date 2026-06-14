-- Version snapshots for design proof artwork (guest carousel + studio rollback).
CREATE TABLE IF NOT EXISTS design_proof_revisions (
  id text PRIMARY KEY,
  proof_id text NOT NULL REFERENCES design_proof_assets(id) ON DELETE CASCADE,
  version integer NOT NULL,
  image_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_proof_revisions_proof_idx
  ON design_proof_revisions(proof_id);

CREATE UNIQUE INDEX IF NOT EXISTS design_proof_revisions_proof_version_uniq
  ON design_proof_revisions(proof_id, version);
