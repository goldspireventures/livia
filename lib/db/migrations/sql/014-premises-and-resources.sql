-- Shared premises (multi-tenant same address) + bookable resources (rooms / thermal capacity)

CREATE TABLE IF NOT EXISTS premises (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  owner_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'IE',
  shared_phone text,
  routing_mode text NOT NULL DEFAULT 'menu',
  default_business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premises_owner_idx ON premises(owner_user_id);

CREATE TABLE IF NOT EXISTS premises_tenants (
  id text PRIMARY KEY,
  premises_id text NOT NULL REFERENCES premises(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  public_label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT premises_tenant_unique UNIQUE (premises_id, business_id)
);

CREATE INDEX IF NOT EXISTS premises_tenants_premises_idx ON premises_tenants(premises_id);
CREATE INDEX IF NOT EXISTS premises_tenants_business_idx ON premises_tenants(business_id);

COMMENT ON TABLE premises IS 'Physical site shared by multiple independent business tenants (e.g. hair + spa same building).';
COMMENT ON TABLE premises_tenants IS 'Maps a business tenant to a premises with customer-facing label.';

CREATE TYPE booking_resource_type AS ENUM ('room', 'equipment', 'thermal');

CREATE TABLE IF NOT EXISTS booking_resources (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  resource_type booking_resource_type NOT NULL DEFAULT 'room',
  capacity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_resources_business_idx ON booking_resources(business_id, is_active);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS required_resource_id text REFERENCES booking_resources(id) ON DELETE SET NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS resource_id text REFERENCES booking_resources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_resource_idx ON bookings(business_id, resource_id, start_at)
  WHERE resource_id IS NOT NULL;
