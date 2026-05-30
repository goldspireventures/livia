-- G2 guest intake + waitlist accept tokens (W5 link-first)
CREATE TABLE IF NOT EXISTS medical_intake_guest_access (
  intake_id TEXT PRIMARY KEY REFERENCES medical_intake_records(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medical_intake_guest_access_token_idx
  ON medical_intake_guest_access(token);

ALTER TABLE slot_waitlist_entries
  ADD COLUMN IF NOT EXISTS offer_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS slot_waitlist_offer_token_idx
  ON slot_waitlist_entries(offer_token);
