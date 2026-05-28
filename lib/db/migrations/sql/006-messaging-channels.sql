-- EU social messaging: per-business Meta connection + Messenger channel

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS messaging_channels jsonb;

COMMENT ON COLUMN businesses.messaging_channels IS
  'Per-shop Meta channel ids: whatsapp.phoneNumberId, instagram.pageId, messenger.pageId';

DO $$
BEGIN
  ALTER TYPE conversation_channel ADD VALUE IF NOT EXISTS 'MESSENGER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'messenger';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
