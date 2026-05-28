-- Internal ops monitoring: alert rules, firing history, saved log searches, Grafana panel registry

CREATE TABLE IF NOT EXISTS internal_ops_alert_rules (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  severity text NOT NULL DEFAULT 'warn' CHECK (severity IN ('warn', 'critical')),
  metric_key text NOT NULL,
  operator text NOT NULL DEFAULT 'gt' CHECK (operator IN ('gt', 'gte', 'lt', 'lte', 'eq')),
  threshold numeric NOT NULL,
  window_minutes integer NOT NULL DEFAULT 15,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS internal_ops_alert_rules_enabled_idx
  ON internal_ops_alert_rules (enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS internal_ops_alert_firings (
  id text PRIMARY KEY,
  rule_id text NOT NULL REFERENCES internal_ops_alert_rules (id) ON DELETE CASCADE,
  fired_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  value_at_fire numeric NOT NULL,
  message text NOT NULL,
  acknowledged_by text,
  acknowledged_at timestamptz,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS internal_ops_alert_firings_rule_idx
  ON internal_ops_alert_firings (rule_id, fired_at DESC);
CREATE INDEX IF NOT EXISTS internal_ops_alert_firings_open_idx
  ON internal_ops_alert_firings (fired_at DESC) WHERE resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS internal_ops_saved_log_searches (
  id text PRIMARY KEY,
  name text NOT NULL,
  backend text NOT NULL DEFAULT 'platform' CHECK (backend IN ('platform', 'loki', 'openobserve')),
  query_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS internal_ops_saved_log_searches_pinned_idx
  ON internal_ops_saved_log_searches (pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS internal_ops_grafana_panels (
  id text PRIMARY KEY,
  title text NOT NULL,
  panel_type text NOT NULL DEFAULT 'explore' CHECK (panel_type IN ('explore', 'dashboard', 'external')),
  embed_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
