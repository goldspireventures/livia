-- Internal ops: assignment, notes, lifecycle timestamps
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS internal_notes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS triaged_at timestamptz;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS support_tickets_assigned_idx ON support_tickets (assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx ON support_tickets (status, created_at DESC);
