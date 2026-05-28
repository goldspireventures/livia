-- Phase B: operational policy, customer trust counters

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS operational_policy jsonb DEFAULT '{}'::jsonb;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS trusted_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strike_count integer NOT NULL DEFAULT 0;
