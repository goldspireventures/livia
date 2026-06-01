-- Ordered service ids shown in the top grid on public /b (max 4 enforced in API).
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS public_featured_service_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
