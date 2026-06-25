-- Migration import jobs — async ingest status (Inngest + sync fallback)

CREATE TABLE IF NOT EXISTS migration_import_jobs (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  mode text NOT NULL,
  source_id text NOT NULL,
  total_imported integer NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  message text NOT NULL DEFAULT '',
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS migration_import_jobs_business_idx ON migration_import_jobs (business_id, created_at DESC);
