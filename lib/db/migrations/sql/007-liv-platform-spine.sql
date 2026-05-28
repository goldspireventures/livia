-- Liv platform spine: booking pending reason + staff message attribution
-- Apply via `pnpm --filter @workspace/db run push` or run manually on Postgres.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pending_reason text;

ALTER TABLE conversation_messages
  ADD COLUMN IF NOT EXISTS author_user_id text;

COMMENT ON COLUMN bookings.pending_reason IS 'Machine reason while status=PENDING (awaiting_staff_confirm, awaiting_deposit, etc.)';
COMMENT ON COLUMN conversation_messages.author_user_id IS 'Clerk user id when staff sent outbound reply from dashboard';
