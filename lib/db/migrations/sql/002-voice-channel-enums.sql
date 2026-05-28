-- Phase 7: voice receptionist channel + call session table.
-- Safe to re-run (IF NOT EXISTS / ADD VALUE IF NOT EXISTS on PG 15+).

DO $$ BEGIN
  ALTER TYPE conversation_channel ADD VALUE IF NOT EXISTS 'VOICE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE channel_type ADD VALUE IF NOT EXISTS 'VOICE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS voice_call_sessions (
  call_sid text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  turn_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voice_call_sessions_business_idx ON voice_call_sessions (business_id);
CREATE INDEX IF NOT EXISTS voice_call_sessions_conversation_idx ON voice_call_sessions (conversation_id);
