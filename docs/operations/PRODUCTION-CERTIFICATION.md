# Production certification checklist

**Status:** Living doc — 2026-05-25  
**Audience:** Livia engineering + internal ops before GA / design-partner scale.

Use this as the stack-wide audit gate. Pair with [`logging-and-correlation.md`](./logging-and-correlation.md) and [`../product/ONBOARDING-PRODUCTION.md`](../product/ONBOARDING-PRODUCTION.md).

---

## 1. Logging & traceability (P0)

| Check | Implementation |
|-------|----------------|
| Every HTTP response has `x-request-id` | `artifacts/api-server/src/app.ts` |
| Access logs: `request_id`, `tenant_id`, `path`, `status` | pino-http `customProps` |
| Sentry tags set at request start | `request_id`, `tenant_id` on ingress |
| API errors include `requestId` | `lib/http-errors.ts` — **all** `src/routes/*.ts` handlers |
| No SMS body / full Twilio params in logs | `sms-webhook.ts` — MessageSid + last-4 only |
| Structured logger base fields | `service=api-server`, `env` |
| Internal trace by request ID | `GET /internal/ops/trace/:requestId?businessId=` |
| Sentry tenant search deep link | `deepLinks.sentry` on tenant detail |

**Ops workflow:** Customer reports issue → copy `requestId` from dashboard error toast or network tab → internal portal trace → Sentry/Loki with same id.

---

## 2. Security & data exposure (P0)

| Check | Status |
|-------|--------|
| CORS allowlist in production | `lib/cors-config.ts` — set `CORS_ALLOWED_ORIGINS` |
| Demo portal off in production by default | `isDemoPortalEnabled()` — needs `LIVIA_DEMO_ALLOW_IN_PRODUCTION=true` |
| Demo API never returns raw password in prod | `demoResponsesMayIncludeSecrets()` |
| Meta webhook fails closed without `META_APP_SECRET` | `meta-webhook.ts` |
| Twilio webhooks require auth token in prod | `webhook-guard.ts` + sms/voice routes |
| Public staff DTO strips email/phone/userId | `public-staff-dto.ts` |
| Public booking rate limit (IP) | `public-booking-rate-limit.ts` |
| Visit page omits `customerId` | `public.ts` guest visit GET |
| Regulatory footer omits owner email on public profile | `public.ts` |
| Internal ops secret ≠ cron secret in production | `internal-ops-auth.ts` |
| `TRUST_PROXY=true` behind load balancer | `app.ts` |
| `.env` never committed | `.gitignore` |

---

## 3. Onboarding (founder → first booking)

| Check | Doc |
|-------|-----|
| Clerk sign-up → `/onboarding` | `App.tsx` redirects |
| 12-act wizard + persisted state | `onboarding-wizard.tsx` |
| Second shop passes `parentBusinessId` | `onboarding.tsx` + lifecycle link |
| First public booking marks checklist `testBooking` | `onboarding-progress.service.ts` |
| Go-live redirects to create booking | `/bookings?create=1` |
| Mobile: create shop → continue on web | `onboarding-continue.tsx` |

---

## 4. Pre-launch env (production)

```bash
NODE_ENV=production
LOG_LEVEL=info
TRUST_PROXY=true
CORS_ALLOWED_ORIGINS=https://app.livia.io,https://livia.io
INTERNAL_OPS_SECRET=<unique-long>
INTERNAL_CRON_SECRET=<different-long>
META_APP_SECRET=<set>
TWILIO_AUTH_TOKEN=<set>
# Do NOT set LIVIA_DEMO_ENABLED unless staging drill with LIVIA_DEMO_ALLOW_IN_PRODUCTION=true
SENTRY_DSN_API=<set>
SENTRY_ORG_SLUG=<for internal deep links>
SENTRY_PROJECT_SLUG=<for internal deep links>
# Optional log sink (Grafana Cloud or self-hosted Loki push)
LOKI_PUSH_URL=
LOKI_LABELS=service=api-server,env=production
```

---

## 5. Shipped in “all and then some” pass

- `lib/domain-errors.ts` — `replyDomainError` on bookings, businesses, billing, public, chat
- Onboarding act events (`ONBOARDING_ACT_COMPLETED`, `ONBOARDING_GO_LIVE_BLOCKED`)
- Go-live blocked without `checklist.testBooking` (API 409 + wizard UX)
- Dashboard errors show `requestId` (`ApiFetchError`, custom-fetch message)
- Support tickets attach `requestId` from request
- Internal portal **Trace by request ID** on Support tab

## 6. Still open (post-cert backlog)

- Postgres RLS if Supabase client access added
- Inngest function logs: `tenant_id` on every step
- Full `pnpm e2e:full-visual-audit` (final UX gate — run with stack up; see `docs/testing/UX-FULL-PLATFORM-AUDIT-2026-05-24.md`)

## 7. Shipped in “all the above ++” pass

- `sendError` on **all** `artifacts/api-server/src/routes/*.ts` (every JSON error includes `requestId`)
- `lib/log-transport.ts` + `LOKI_PUSH_URL` optional push; `docker/observability` + `pnpm observability:up`
- `lib/onboarding-go-live-gate.ts` (DB-free unit test)
- Migration helpers: `scripts/migrate-send-error.mjs`, `scripts/fix-send-error-imports.mjs`
