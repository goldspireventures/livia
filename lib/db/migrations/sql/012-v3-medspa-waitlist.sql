-- v3 Phase 3: medspa consent + medical intake + slot waitlist (batch train 2026-05-22)

CREATE TABLE IF NOT EXISTS medspa_consent_records (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  procedure_code text NOT NULL,
  procedure_label text NOT NULL,
  consent_version text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signature_name text,
  market_code text NOT NULL DEFAULT 'IE',
  metadata jsonb,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medspa_consent_business_status_idx
  ON medspa_consent_records (business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS medical_intake_records (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  allergies text,
  medications text,
  conditions text,
  prior_procedures text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medical_intake_business_status_idx
  ON medical_intake_records (business_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS slot_waitlist_entries (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  service_id text REFERENCES services(id) ON DELETE SET NULL,
  preferred_staff_id text REFERENCES staff(id) ON DELETE SET NULL,
  phone text,
  email text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  offered_booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  offered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS slot_waitlist_business_active_idx
  ON slot_waitlist_entries (business_id, status, created_at DESC);
