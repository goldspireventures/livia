-- Liv operational signals — reactive moments surfaced in presence / Today / ritual headers.
CREATE TABLE IF NOT EXISTS liv_signals (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind text NOT NULL,
  priority text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL,
  event_name text,
  entity_type text,
  entity_id text,
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  dismissed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS liv_signals_dedupe_idx ON liv_signals(dedupe_key);
CREATE INDEX IF NOT EXISTS liv_signals_business_created_idx ON liv_signals(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS liv_signals_business_active_idx ON liv_signals(business_id)
  WHERE dismissed_at IS NULL;
