-- Phase 10: entitlement grants (add-on) + staff shift stub
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS entitlement_grants jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN businesses.entitlement_grants IS
  'Extra entitlement keys granted beyond plan (e.g. peer_set_insights add-on).';

CREATE TABLE IF NOT EXISTS staff_shifts (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_shifts_business_idx ON staff_shifts(business_id);
CREATE INDEX IF NOT EXISTS staff_shifts_staff_idx ON staff_shifts(staff_id);
