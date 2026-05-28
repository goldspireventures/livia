# Internal monitoring portal

**Status:** v1 (2026-05-24)  
**Surface:** `artifacts/livia-internal` → **Monitoring** tab  
**API:** `GET /api/internal/ops/monitoring/*` (requires `INTERNAL_OPS_SECRET` + operator headers)

---

## What you get

| Sub-tab | Purpose |
|---------|---------|
| **Overview** | Live counters, proactive alerts, hourly booking/error charts, log backend status |
| **Log explorer** | Platform DB search (`events`, `notification_logs`, `message_logs`) + Loki/OpenObserve JSON logs |
| **Data flows** | Pipeline health (API, Postgres, bookings, Stripe, channels, Liv AI, Inngest, Loki) |
| **Onboarding** | Ops readiness checklist — use before handing portal to a new operator |
| **Alerts** | Persisted rules (DB), auto-evaluate on refresh, firing history, ack/resolve |
| **Grafana** | Embedded panels (API health dashboard + Loki Explore) |
| **Reports** | Ops snapshot: uptime, live metrics, top ERROR event types |
| **Tools** | Stress probes, demo identity sync (dev) |

Turn on **Live (15s)** for proactive monitoring during incidents.

### Persisted alert rules

Migration `021-internal-ops-monitoring.sql` creates `internal_ops_alert_rules` and `internal_ops_alert_firings`. Six default rules seed on first load (DB latency, notification failures, stuck continuity, etc.). Rules re-evaluate on every **Overview** refresh; open firings dedupe per rule until resolved.

### Saved log searches

Pinned searches live in `internal_ops_saved_log_searches` — use **Log explorer → Pin search** or the seeded shortcuts (errors, failed notifications, Loki API errors).

### Grafana embeds

`pnpm observability:up` provisions **Livia API Health** dashboard. Set `GRAFANA_EMBED_BASE_URL` if Grafana is not on `http://127.0.0.1:3000`.

---

## Deep logs (Loki)

```bash
pnpm observability:up
# Grafana http://127.0.0.1:3000 (admin/admin)
LOKI_PUSH_URL=http://127.0.0.1:3100/loki/api/v1/push pnpm dev:api
```

In the portal: **Monitoring → Log explorer → Loki / OpenObserve**.

Example LogQL (also used when no custom query):

```text
{service="api-server"} | json | tenant_id="<BUSINESS_UUID>"
{service="api-server"} | json | request_id="<UUID>"
```

Set `LOKI_QUERY_BASE_URL` if push and query hosts differ (e.g. Grafana Cloud).

---

## OpenObserve (optional)

```env
OPENOBSERVE_URL=https://your-instance.example
OPENOBSERVE_ORG=default
OPENOBSERVE_USER=
OPENOBSERVE_PASSWORD=
OPENOBSERVE_STREAM=default
```

Portal uses SQL search against the configured stream when `OPENOBSERVE_URL` is set.

---

## Onboarding a new operator

1. Copy `.env` with `INTERNAL_OPS_SECRET` matching API.
2. `pnpm db:migrate:sql` && `pnpm demo:provision` (local).
3. Sign in at http://127.0.0.1:5175 with secret + operator email + role (`engineer` or `founder`).
4. Open **Monitoring → Onboarding** — aim for 100% and green required items.
5. Run **Repair demo ops data** only in dev if tickets/legal are thin (can take ~1 min).

Do **not** rely on auto-repair on sign-in; use the onboarding tab explicitly.

---

## Correlation

| Need | Where |
|------|--------|
| Request trace | Tenants tab → Request trace panel, or log search `request_id` |
| Support incident | Support → Liv bundle |
| Sentry | Tenant card deep link when `SENTRY_ORG_SLUG` set |
| Grafana | Overview → Grafana link when Loki is up |

See also [`logging-and-correlation.md`](./logging-and-correlation.md).
