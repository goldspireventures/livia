-- Roadmap completion: channel routing, spa day packages, care series, franchise policy, chair exit, OPS role

-- Shared-channel tenant selection (SMS / shared numbers)
CREATE TABLE IF NOT EXISTS channel_premises_routing (
  id text PRIMARY KEY,
  premises_id text NOT NULL REFERENCES premises(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  selected_business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  pending_menu_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT channel_premises_routing_unique UNIQUE (premises_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS channel_premises_routing_phone_idx ON channel_premises_routing(customer_phone);

ALTER TABLE premises
  ADD COLUMN IF NOT EXISTS shared_whatsapp_phone_number_id text;

-- Spa day packages (multi-service itinerary)
CREATE TABLE IF NOT EXISTS day_packages (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_duration_minutes integer NOT NULL,
  price_minor integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS day_packages_business_idx ON day_packages(business_id, is_active);

CREATE TABLE IF NOT EXISTS day_package_steps (
  id text PRIMARY KEY,
  package_id text NOT NULL REFERENCES day_packages(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  service_id text NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  resource_id text REFERENCES booking_resources(id) ON DELETE SET NULL,
  staff_id text REFERENCES staff(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL,
  buffer_after_minutes integer NOT NULL DEFAULT 15,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS day_package_steps_seq_idx ON day_package_steps(package_id, sequence);

-- Allied-health / physio care series (e.g. 6 sessions)
CREATE TABLE IF NOT EXISTS care_series (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_id text NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  preferred_staff_id text REFERENCES staff(id) ON DELETE SET NULL,
  sessions_total integer NOT NULL,
  sessions_completed integer NOT NULL DEFAULT 0,
  cadence_days integer NOT NULL DEFAULT 14,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS care_series_customer_idx ON care_series(business_id, customer_id);

CREATE TABLE IF NOT EXISTS care_series_sessions (
  id text PRIMARY KEY,
  series_id text NOT NULL REFERENCES care_series(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  session_number integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS care_series_sessions_num_idx ON care_series_sessions(series_id, session_number);

-- Franchise policy override (franchisor → franchisee Liv + ops policy)
ALTER TABLE franchise_links
  ADD COLUMN IF NOT EXISTS policy_pack_override jsonb;

ALTER TABLE host_renter_links
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS portability_exported_at timestamptz;

-- Chain ops director role
DO $$ BEGIN
  ALTER TYPE membership_role_v2 ADD VALUE IF NOT EXISTS 'OPS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
