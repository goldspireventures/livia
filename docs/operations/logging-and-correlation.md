# Logging & correlation guide

**Status:** v1.0 (2026-05-21)  
**Implements:** [`../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md`](../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md) §4

---

## 1. Field contract (api-server)

Every request log line should include:

| Field | Required when | Example |
|-------|---------------|---------|
| `request_id` | Always | `550e8400-e29b-41d4-a716-446655440000` |
| `tenant_id` | `:businessId` routes | business UUID |
| `user_id` | Authenticated | Clerk `user_...` |
| `plan_tier` | After `requireRole` | `solo`, `studio` |
| `method` | Always | `PATCH` |
| `path` | Always (no query string) | `/api/businesses/.../bookings/...` |
| `status` | Response | `409` |
| `duration_ms` | Response | `42` |

**Implemented in:** `artifacts/api-server/src/app.ts` (pino-http).

---

## 2. Correlate across systems

| Symptom | Start here | Then |
|---------|------------|------|
| 5xx spike | Sentry issue (`tenant_id` / `request_id` tags) | `GET /internal/ops/trace/:requestId?businessId=` |
| Wrong booking | Audit log `bookingId` | Logs `tenant_id` + time |
| Liv bad reply | `conversationId` in DB | `ai_interactions` / eval trace |
| Billing wrong | Stripe event id | `business.stripeCustomerId` + webhook logs |
| Support ticket | `support_tickets.id` | `context` JSON from reporter |

---

## 3. What NOT to log

- Full card numbers, CVV  
- Raw SMS body with health data (minimize; redact per policy)  
- Clerk session tokens  
- Partner API keys  

Use structured fields; avoid string concatenation of PII.

---

## 4. Loki + Grafana (local and production)

**Local stack**

```bash
pnpm observability:up
# Grafana http://127.0.0.1:3000 — Loki datasource pre-provisioned
LOKI_PUSH_URL=http://127.0.0.1:3100/loki/api/v1/push pnpm dev:api
```

When `LOKI_PUSH_URL` is set, `artifacts/api-server/src/lib/log-transport.ts` duplicates JSON lines to Loki while keeping stdout (for Fly/K8s scrapers).

**Grafana LogQL**

```text
{service="api-server"} | json | tenant_id="<BUSINESS_UUID>" | level="error"
{service="api-server"} | json | request_id="<UUID>"
```

Production: prefer platform log shipping (stdout JSON) **or** set `LOKI_PUSH_URL` to your Grafana Cloud / self-hosted push endpoint.

---

## 5. Gaps to close (R1)

- [x] Sentry SDK: `request_id` tag on captured exceptions (`http-errors.ts` + `app.ts`)
- [ ] Chat routes: log `conversation_id` at info when message processed  
- [ ] Inngest: pass `tenant_id` in function logger context  
- [x] Staging/prod sink documented in `.env.example` (`LOKI_PUSH_URL`, `LOKI_LABELS`)
