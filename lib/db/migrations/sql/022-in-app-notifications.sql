-- Per-user in-app notification feed (web bell + mobile centre). Distinct from notification_logs transport.
CREATE TABLE IF NOT EXISTS user_notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id text REFERENCES businesses(id) ON DELETE CASCADE,
  kind text NOT NULL,
  priority text NOT NULL DEFAULT 'info',
  persona_hint text,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  mobile_href text,
  resource_kind text,
  resource_id text,
  dedupe_key text NOT NULL,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_dedupe_idx
  ON user_notifications(user_id, dedupe_key);

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON user_notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS user_notifications_business_idx
  ON user_notifications(business_id, created_at DESC);
