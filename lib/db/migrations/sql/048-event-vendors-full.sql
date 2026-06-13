-- Event vendors — milestones, mood board, quote payments
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS milestone_deposits jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_paid_minor integer NOT NULL DEFAULT 0;

ALTER TABLE event_vendor_site ADD COLUMN IF NOT EXISTS milestone_deposit_template jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS event_mood_board_items (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  enquiry_id text NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  image_url text,
  note text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_mood_board_enquiry_idx ON event_mood_board_items(enquiry_id);
