-- v3: pet-grooming vertical, booking continuity, pet profiles

ALTER TYPE business_vertical ADD VALUE IF NOT EXISTS 'pet-grooming';
ALTER TYPE business_vertical ADD VALUE IF NOT EXISTS 'automotive-detailing';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS continuity_conversation_id text,
  ADD COLUMN IF NOT EXISTS continuity_sent_at timestamptz;

COMMENT ON COLUMN bookings.continuity_conversation_id IS 'SMS/WA thread opened after web book for style pics and confirm';
COMMENT ON COLUMN bookings.continuity_sent_at IS 'When continuity outbound was sent';

CREATE TABLE IF NOT EXISTS pets (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL DEFAULT 'dog',
  breed text,
  weight_kg numeric(6,2),
  behaviour_notes text,
  allergy_notes text,
  vaccination_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pets_business_customer_idx ON pets(business_id, customer_id);

CREATE TABLE IF NOT EXISTS booking_pets (
  booking_id text NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pet_id text NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, pet_id)
);
