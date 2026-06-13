-- Event vendors innovation program — consult-first depth (V12)

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS planner_email text,
  ADD COLUMN IF NOT EXISTS planner_phone text,
  ADD COLUMN IF NOT EXISTS event_date_hold_status text,
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_operator_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS mood_board_approval_token text,
  ADD COLUMN IF NOT EXISTS mood_board_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS planner_access_token text;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS supersedes_quote_id text REFERENCES quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE event_vendor_site
  ADD COLUMN IF NOT EXISTS setup_fee_minor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outdoor_terms_extra text;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS stock_count integer;

CREATE UNIQUE INDEX IF NOT EXISTS enquiries_mood_board_token_idx
  ON enquiries (mood_board_approval_token)
  WHERE mood_board_approval_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS enquiries_planner_access_token_idx
  ON enquiries (planner_access_token)
  WHERE planner_access_token IS NOT NULL;
