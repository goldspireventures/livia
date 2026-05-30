-- R2 guest hub (W6) — customer-owned vault; owners never query these tables.
CREATE TABLE IF NOT EXISTS guest_identities (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  token TEXT PRIMARY KEY,
  guest_id TEXT REFERENCES guest_identities(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guest_sessions_phone_idx ON guest_sessions(phone_e164);

CREATE TABLE IF NOT EXISTS guest_shop_links (
  guest_id TEXT NOT NULL REFERENCES guest_identities(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  first_booking_at TIMESTAMPTZ,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guest_id, business_id)
);

CREATE INDEX IF NOT EXISTS guest_shop_links_business_idx ON guest_shop_links(business_id);

CREATE TABLE IF NOT EXISTS guest_favorites (
  guest_id TEXT NOT NULL REFERENCES guest_identities(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guest_id, business_id)
);
