-- Production payment ledger + Stripe webhook idempotency

CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  livemode boolean NOT NULL DEFAULT false,
  business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON stripe_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS stripe_events_business_idx ON stripe_events(business_id, created_at DESC);

DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('STRIPE', 'MULAH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_intent_status AS ENUM (
    'PENDING', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_accounts (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL DEFAULT 'STRIPE',
  provider_account_id text,
  status text NOT NULL DEFAULT 'PENDING',
  charges_enabled boolean NOT NULL DEFAULT false,
  payouts_enabled boolean NOT NULL DEFAULT false,
  details_submitted boolean NOT NULL DEFAULT false,
  onboarding_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_accounts_business_idx ON payment_accounts(business_id);

CREATE TABLE IF NOT EXISTS payment_intent_records (
  id text PRIMARY KEY,
  business_id text REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  provider payment_provider NOT NULL DEFAULT 'STRIPE',
  provider_payment_intent_id text,
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status payment_intent_status NOT NULL DEFAULT 'PENDING',
  checkout_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_intents_business_idx ON payment_intent_records(business_id);
CREATE INDEX IF NOT EXISTS payment_intents_booking_idx ON payment_intent_records(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_intents_provider_pi_idx
  ON payment_intent_records(provider_payment_intent_id)
  WHERE provider_payment_intent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  business_id text REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id text REFERENCES customers(id) ON DELETE SET NULL,
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  payment_intent_id text REFERENCES payment_intent_records(id),
  provider payment_provider NOT NULL DEFAULT 'STRIPE',
  provider_charge_id text,
  amount_minor integer NOT NULL,
  platform_fee_minor integer,
  net_amount_minor integer,
  currency text NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL,
  paid_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_business_idx ON payments(business_id);
CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_charge_idx
  ON payments(provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS refunds (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_id text NOT NULL REFERENCES payments(id),
  booking_id text REFERENCES bookings(id) ON DELETE SET NULL,
  provider_refund_id text,
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  reason text,
  status refund_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refunds_business_idx ON refunds(business_id);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON refunds(payment_id);

CREATE TABLE IF NOT EXISTS provider_dlq (
  id text PRIMARY KEY,
  provider text NOT NULL,
  operation text NOT NULL,
  business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  payload jsonb,
  error text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_dlq_provider_idx ON provider_dlq(provider, created_at DESC);
