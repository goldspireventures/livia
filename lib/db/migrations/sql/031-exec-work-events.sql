-- Track H — exec hat work ledger (cockpit Hats River)

CREATE TABLE IF NOT EXISTS exec_work_events (
  id text PRIMARY KEY,
  hat_id text NOT NULL CHECK (hat_id IN ('ceo', 'coo', 'cpo', 'cto', 'cs', 'cro')),
  summary text NOT NULL,
  actor text NOT NULL CHECK (actor IN ('human', 'agent')),
  actor_label text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_id text,
  source text CHECK (source IN ('cursor', 'cli', 'manual', 'git', 'support')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exec_work_events_hat_created_idx
  ON exec_work_events (hat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS exec_work_events_created_idx
  ON exec_work_events (created_at DESC);
