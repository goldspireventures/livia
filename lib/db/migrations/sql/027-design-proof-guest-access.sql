-- Opaque token for customer design-proof approve/reject without login (Track G1).
CREATE TABLE IF NOT EXISTS design_proof_guest_access (
  proof_id TEXT PRIMARY KEY REFERENCES design_proof_assets(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS design_proof_guest_access_business_idx
  ON design_proof_guest_access(business_id);

CREATE INDEX IF NOT EXISTS design_proof_guest_access_token_idx
  ON design_proof_guest_access(token);
