-- v2 foundations: class booking, package credits, franchise links, design proofs, tiers

DO $$ BEGIN
  ALTER TYPE business_tier ADD VALUE IF NOT EXISTS 'mid-chain';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE business_tier ADD VALUE IF NOT EXISTS 'franchise';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS class_sessions (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id text REFERENCES services(id) ON DELETE SET NULL,
  staff_id text REFERENCES staff(id) ON DELETE SET NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  waitlist_capacity integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS class_sessions_business_starts_idx
  ON class_sessions(business_id, starts_at);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled',
  waitlist_position integer,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS class_enrollments_session_customer_idx
  ON class_enrollments(session_id, customer_id);

CREATE TABLE IF NOT EXISTS package_credit_ledger (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_name text NOT NULL,
  credits_total integer NOT NULL,
  credits_remaining integer NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS package_credit_ledger_customer_idx
  ON package_credit_ledger(business_id, customer_id);

CREATE TABLE IF NOT EXISTS franchise_links (
  id text PRIMARY KEY,
  franchisor_business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  franchisee_business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  royalty_bps integer NOT NULL DEFAULT 500,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS franchise_links_pair_idx
  ON franchise_links(franchisor_business_id, franchisee_business_id);

CREATE TABLE IF NOT EXISTS design_proof_assets (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  image_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_proof_assets_business_idx
  ON design_proof_assets(business_id, status);
