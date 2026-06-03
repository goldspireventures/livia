-- W1 marketing waitlist + book-demo lead capture (livia.io → POST /public/marketing/leads)

CREATE TABLE IF NOT EXISTS marketing_leads (
  id text PRIMARY KEY,
  email text NOT NULL,
  source text NOT NULL DEFAULT 'livia.io',
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_leads_email_idx ON marketing_leads (email);
CREATE INDEX IF NOT EXISTS marketing_leads_created_at_idx ON marketing_leads (created_at);
