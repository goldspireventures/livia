-- =====================================================================
-- 001 — Row-Level Security + audit-log append-only guards.
--
-- Per ADR 0014 (multi-tenant isolation) + ADR 0015 (audit log) + ADR 0018.
--
-- Idempotent: safe to re-apply. Drop + re-create policies/triggers.
--
-- Apply with:
--   psql "$SUPABASE_DATABASE_URL_DIRECT" -f lib/db/migrations/sql/001-rls-and-audit-guards.sql
-- =====================================================================

-- ---------- Helper: read tenant context from session GUC --------------
CREATE OR REPLACE FUNCTION app_business_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.business_id', true), '')
$$;

-- ---------- Helper: bypass for migration / admin sessions -------------
-- A session may set `app.bypass_rls = 'on'` to skip tenant filter (used by
-- the migration runner, the smoke-test script, and back-office ops). Never
-- set this in tenant-serving code paths.
CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.bypass_rls', true) = 'on', false)
$$;

-- ---------- Tenant-scoped tables: enable RLS + policy -----------------
-- Applies the same deny-by-default + same-business_id-allow policy.

DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'businesses',                  -- self-scoped: id = app_business_id()
    'business_memberships',
    'staff',
    'staff_services',
    'services',
    'customers',
    'channel_identities',
    'bookings',
    'availability_rules',
    'time_off',
    'time_off_requests',
    'delegations',
    'conversations',
    'conversation_messages',
    'payment_accounts',
    'payment_intents',
    'payments',
    'refunds',
    'notification_logs',
    'message_logs',
    'device_tokens',
    'ai_observations',
    'ai_interactions',
    'feature_flags',
    'events',
    'audit_log',
    'evals_traces'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    -- Skip silently if the table doesn't exist yet (some are forward-looking).
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      RAISE NOTICE 'RLS skip: table public.% does not exist (yet)', tbl;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I', tbl, tbl);

    IF tbl = 'businesses' THEN
      -- Self-referential: id column carries the tenant identity.
      EXECUTE format($p$
        CREATE POLICY %I_tenant_isolation ON public.%I
        AS PERMISSIVE FOR ALL TO PUBLIC
        USING (app_bypass_rls() OR id = app_business_id())
        WITH CHECK (app_bypass_rls() OR id = app_business_id())
      $p$, tbl, tbl);
    ELSE
      -- Standard: business_id column carries the tenant identity.
      EXECUTE format($p$
        CREATE POLICY %I_tenant_isolation ON public.%I
        AS PERMISSIVE FOR ALL TO PUBLIC
        USING (app_bypass_rls() OR business_id = app_business_id())
        WITH CHECK (app_bypass_rls() OR business_id = app_business_id())
      $p$, tbl, tbl);
    END IF;
  END LOOP;
END$$;

-- ---------- Audit log: append-only enforcement ------------------------
-- Per ADR 0015. UPDATE and DELETE are blocked at the row level. INSERT is
-- guarded so prev_hash and row_hash cannot be tampered with: we recompute
-- prev_hash from the most recent row for the tenant, and row_hash from
-- canonical(meta + payload).
--
-- The application-side writer in @workspace/audit-log computes the same
-- values; the DB trigger is the second line of defence.

CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF app_bypass_rls() THEN
    -- Even superuser bypass cannot mutate audit_log rows. The only path to
    -- redact is INSERT of a tombstone row that supersedes a prior payload.
    RAISE EXCEPTION 'audit_log is append-only — % is forbidden (use a tombstone row instead)', TG_OP
      USING ERRCODE = 'check_violation';
  END IF;
  RAISE EXCEPTION 'audit_log is append-only — % is forbidden', TG_OP
    USING ERRCODE = 'check_violation';
END$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON public.audit_log;
DROP TRIGGER IF EXISTS audit_log_no_delete ON public.audit_log;
DROP TRIGGER IF EXISTS audit_log_no_truncate ON public.audit_log;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_log') THEN
    CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON public.audit_log
      FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
    CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON public.audit_log
      FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
    CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON public.audit_log
      FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_mutation();
  END IF;
END$$;

-- ---------- Audit log: hash-chain canonicalisation in DB --------------
-- Computes prev_hash from the chain tail; computes row_hash from the
-- canonical serialisation of (meta + payload). The application-side writer
-- in @workspace/audit-log computes the same values; this trigger is the
-- second line of defence so a misbehaving writer cannot break the chain.

CREATE OR REPLACE FUNCTION audit_log_compute_hashes() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  tail_hash bytea;
  meta jsonb;
  body text;
BEGIN
  -- Look up the chain tail for this tenant (using RLS-bypass internally).
  EXECUTE 'SELECT row_hash FROM public.audit_log WHERE business_id = $1 ORDER BY id DESC LIMIT 1'
    INTO tail_hash USING NEW.business_id;

  IF tail_hash IS NULL THEN
    NEW.prev_hash := decode(repeat('00', 32), 'hex');
  ELSE
    NEW.prev_hash := tail_hash;
  END IF;

  meta := jsonb_build_object(
    'businessId', NEW.business_id,
    'occurredAt', to_char(NEW.occurred_at AT TIME ZONE 'UTC',
                          'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'actorKind', NEW.actor_kind,
    'actorId', NEW.actor_id,
    'onBehalfOfId', NEW.on_behalf_of_id,
    'actionClass', NEW.action_class,
    'resourceKind', NEW.resource_kind,
    'resourceId', NEW.resource_id
  );

  -- Canonical = sorted-keys JSON. Postgres jsonb sorts keys at storage.
  body := '{"meta":' || meta::text || ',"payload":' || COALESCE(NEW.payload, '{}'::jsonb)::text || '}';
  NEW.row_hash := digest(NEW.prev_hash || body::bytea, 'sha256');

  RETURN NEW;
END$$;

-- pgcrypto is required for digest() — Supabase has it in extensions schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TRIGGER IF EXISTS audit_log_hash_chain ON public.audit_log;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_log') THEN
    CREATE TRIGGER audit_log_hash_chain BEFORE INSERT ON public.audit_log
      FOR EACH ROW EXECUTE FUNCTION audit_log_compute_hashes();
  END IF;
END$$;

-- ---------- Done ------------------------------------------------------
SELECT 'RLS + audit-log guards applied' AS status;
