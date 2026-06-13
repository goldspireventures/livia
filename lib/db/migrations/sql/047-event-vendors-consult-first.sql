-- V12 event vendors — consult-first workflow (enquiry → quote → book)
ALTER TYPE business_vertical ADD VALUE IF NOT EXISTS 'event-vendors';

ALTER TABLE services ADD COLUMN IF NOT EXISTS quote_unit text;

CREATE TABLE IF NOT EXISTS event_vendor_site (
  business_id text PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  hero_title text,
  hero_subtitle text,
  about_text text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  quote_validity_days integer NOT NULL DEFAULT 14,
  default_deposit_percent integer NOT NULL DEFAULT 30,
  terms_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'web',
  event_type text,
  event_date date,
  event_date_flexible boolean NOT NULL DEFAULT false,
  guest_count integer,
  budget_minor integer,
  budget_range text,
  theme text,
  notes text,
  services_requested jsonb NOT NULL DEFAULT '[]'::jsonb,
  inspiration_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_quote_channel text NOT NULL DEFAULT 'email',
  venue text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  partner_name text,
  partner_phone text,
  planner_name text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enquiries_business_status_idx ON enquiries(business_id, status);
CREATE INDEX IF NOT EXISTS enquiries_business_created_idx ON enquiries(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS quote_templates (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  preset_lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_templates_business_idx ON quote_templates(business_id);

CREATE TABLE IF NOT EXISTS quotes (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  enquiry_id text REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  personal_message text,
  deposit_percent integer NOT NULL DEFAULT 30,
  subtotal_minor integer NOT NULL DEFAULT 0,
  deposit_amount_minor integer NOT NULL DEFAULT 0,
  balance_due_minor integer NOT NULL DEFAULT 0,
  valid_until date,
  terms_snapshot text,
  sent_at timestamptz,
  sent_via text,
  accepted_at timestamptz,
  public_token text NOT NULL,
  event_day_sheet jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS quotes_public_token_idx ON quotes(public_token);
CREATE INDEX IF NOT EXISTS quotes_business_status_idx ON quotes(business_id, status);
CREATE INDEX IF NOT EXISTS quotes_enquiry_idx ON quotes(enquiry_id);

CREATE TABLE IF NOT EXISTS quote_line_items (
  id text PRIMARY KEY,
  quote_id text NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id text REFERENCES services(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'flat',
  unit_price_minor integer NOT NULL DEFAULT 0,
  line_total_minor integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS quote_line_items_quote_idx ON quote_line_items(quote_id);
