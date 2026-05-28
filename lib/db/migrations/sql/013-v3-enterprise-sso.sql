-- v3 Block L: enterprise SSO config stub (no live SAML until IdP wired)

CREATE TABLE IF NOT EXISTS enterprise_sso_configs (
  business_id text PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'oidc',
  issuer_url text,
  client_id text,
  metadata_url text,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
