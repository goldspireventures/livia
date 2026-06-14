-- Guest retail fulfillment — ship, collect, or bring to appointment.
ALTER TABLE retail_orders
  ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_detail TEXT;
