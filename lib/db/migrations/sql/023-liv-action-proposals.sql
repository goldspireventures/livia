-- Liv Mandate proposal queue (R1/R2 overflow — human approves before side effects).
CREATE TABLE IF NOT EXISTS liv_action_proposals (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  outcome_preview text,
  reason text,
  value_minor integer NOT NULL DEFAULT 0,
  resource_kind text,
  resource_id text,
  metadata jsonb,
  proposed_by text NOT NULL DEFAULT 'liv',
  resolved_by text REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS liv_action_proposals_business_status_idx
  ON liv_action_proposals(business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS liv_action_proposals_pending_idx
  ON liv_action_proposals(business_id, created_at DESC)
  WHERE status = 'pending';
