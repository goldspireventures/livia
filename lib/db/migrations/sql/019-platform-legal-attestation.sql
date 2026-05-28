-- Beta: platform ToS/Privacy acceptance on user + self-declared business entity (not KYB).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_legal jsonb;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS tenant_attestation jsonb;

COMMENT ON COLUMN users.platform_legal IS 'Livia platform ToS + Privacy acceptance ledger';
COMMENT ON COLUMN businesses.tenant_attestation IS 'Self-declared legal entity type at onboarding — not KYB-verified';
