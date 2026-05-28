-- Phase 0: onboarding progress on businesses + support tickets for Help UI (Phase 6).

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb;

CREATE TYPE support_ticket_category AS ENUM (
  'bug',
  'billing',
  'liv_error',
  'feature',
  'other'
);

CREATE TYPE support_ticket_severity AS ENUM (
  'blocking',
  'annoying',
  'nice_to_have'
);

CREATE TYPE support_ticket_status AS ENUM (
  'open',
  'triaged',
  'resolved',
  'closed'
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category support_ticket_category NOT NULL,
  severity support_ticket_severity NOT NULL DEFAULT 'annoying',
  description text NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  context jsonb DEFAULT '{}'::jsonb,
  consent_logs_access text NOT NULL DEFAULT 'false',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_business_idx ON support_tickets (business_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets (business_id, status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx ON support_tickets (created_at);
