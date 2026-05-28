-- Operational spine: conversation cases linked to bookings + shift templates.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS linked_booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS case_intent text,
  ADD COLUMN IF NOT EXISTS resolution jsonb;

CREATE INDEX IF NOT EXISTS conversations_linked_booking_idx
  ON conversations(linked_booking_id)
  WHERE linked_booking_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shift_templates (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  label text,
  role_hint text,
  min_staff integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shift_templates_business_idx ON shift_templates(business_id);

CREATE TABLE IF NOT EXISTS refund_ledger (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  conversation_id text REFERENCES conversations(id) ON DELETE SET NULL,
  proposal_id text,
  amount_minor integer NOT NULL,
  status text NOT NULL DEFAULT 'processed',
  provider_ref text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_ledger_business_idx ON refund_ledger(business_id, created_at DESC);
