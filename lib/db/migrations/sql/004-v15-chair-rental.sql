-- v1.5: chair-rental host ↔ renter links (separate tenant per renter)
CREATE TABLE IF NOT EXISTS host_renter_links (
  id text PRIMARY KEY,
  host_business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  renter_business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  chair_label text NOT NULL,
  weekly_rent_minor integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  rent_status text NOT NULL DEFAULT 'due',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT host_renter_unique UNIQUE (host_business_id, renter_business_id)
);

CREATE INDEX IF NOT EXISTS host_renter_host_idx ON host_renter_links(host_business_id);
CREATE INDEX IF NOT EXISTS host_renter_renter_idx ON host_renter_links(renter_business_id);

COMMENT ON TABLE host_renter_links IS
  'Chair-rental: host sees rent/occupancy only — never renter customer PII (v1.5).';
