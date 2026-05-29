-- Cockpit-managed workforce access (Goldspire). No domain-wide auto-grant.

CREATE TABLE IF NOT EXISTS internal_workforce_access_grants (
  id text PRIMARY KEY,
  email text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('restricted', 'full')),
  notes text,
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS internal_workforce_access_grants_email_active_idx
  ON internal_workforce_access_grants (lower(email))
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS internal_workforce_access_grants_active_idx
  ON internal_workforce_access_grants (granted_at DESC)
  WHERE revoked_at IS NULL;
