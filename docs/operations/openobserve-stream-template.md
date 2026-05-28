# OpenObserve / Elasticsearch log stream template

Use this when shipping api-server JSON logs to OpenObserve or an Elasticsearch-compatible index.

## Recommended fields

| Field | Type | Source |
|-------|------|--------|
| `request_id` | string | pino-http on every request |
| `tenant_id` | string | `:businessId` routes |
| `user_id` | string | Clerk user when authenticated |
| `level` | string | `info` / `warn` / `error` |
| `method` | string | HTTP method |
| `path` | string | Route path (no query string) |
| `status` | number | HTTP status |
| `duration_ms` | number | Response time |
| `msg` | string | Log message |
| `service` | string | `api-server` (via `LOKI_LABELS`) |
| `env` | string | `NODE_ENV` |

## OpenObserve

```env
OPENOBSERVE_URL=https://your-host
OPENOBSERVE_ORG=default
OPENOBSERVE_STREAM=default
OPENOBSERVE_USER=
OPENOBSERVE_PASSWORD=
```

Example SQL (also surfaced in internal portal **Log explorer → field contract**):

```sql
SELECT * FROM default WHERE level = 'error' ORDER BY _timestamp DESC LIMIT 100
SELECT * FROM default WHERE request_id = '<UUID>' ORDER BY _timestamp DESC LIMIT 50
SELECT * FROM default WHERE tenant_id = '<BUSINESS_UUID>' AND status >= 500
```

## Loki (local / Grafana Cloud)

```bash
pnpm observability:up
LOKI_PUSH_URL=http://127.0.0.1:3100/loki/api/v1/push pnpm dev:api
```

Pre-provisioned dashboard: **Livia API Health** (`uid: livia-api-health`) — embedded in internal portal **Monitoring → Grafana**.
