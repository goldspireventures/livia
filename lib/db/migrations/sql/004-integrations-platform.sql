-- Integrations platform: scoped API keys + outbound webhooks
CREATE TABLE IF NOT EXISTS api_credentials (
  id text PRIMARY KEY,
  business_id text REFERENCES businesses(id) ON DELETE CASCADE,
  label text NOT NULL,
  key_prefix text NOT NULL UNIQUE,
  key_hash text NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_slugs jsonb DEFAULT '[]'::jsonb,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_credentials_business_idx ON api_credentials(business_id);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL,
  subscribed_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_endpoints_business_idx ON webhook_endpoints(business_id);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id text PRIMARY KEY,
  endpoint_id text NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_name text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_idx ON webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS webhook_deliveries_retry_idx ON webhook_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS webhook_deliveries_business_idx ON webhook_deliveries(business_id);
