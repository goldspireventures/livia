# Founder retest — URLs, logins, and verification commands

Use this after pulling latest. One password, five surfaces.

## URLs (local)

| Surface | URL |
|---------|-----|
| **Demo gateway** | http://127.0.0.1:5173/demo |
| **Tenant dashboard** | http://127.0.0.1:5173/dashboard |
| **Sign-in** | http://127.0.0.1:5173/sign-in |
| **Public booking** | http://127.0.0.1:5173/b/aurora-galway |
| **Marketing** | http://127.0.0.1:5174 |
| **Internal ops** | http://127.0.0.1:5175 |
| **API health** | http://127.0.0.1:3001/api/healthz |

## Demo password

`LiviaDemo2026!` (or `LIVIA_DEMO_PASSWORD` in `.env`)

## Quick logins

| Role | Email | After sign-in |
|------|-------|----------------|
| Founder (multi-shop) | `demo-founder@livia.io` | `/chain` |
| Generic owner | `demo-owner@livia.io` | `/dashboard` |
| Per-tenant owner | `demo-owner-{slug}@livia.io` | `/dashboard` |

**Fastest path:** http://127.0.0.1:5173/demo → **Set up full demo world** → any row → **Open as owner**.

Demo owners should **not** get stuck on `/legal-acceptance` (platform legal is auto-recorded at provision/sign-in) or the onboarding wizard (all demo businesses are marked 100% complete on provision). New real sign-ups still see legal + onboarding once.

| Persona | Email | Lands on |
|---------|-------|----------|
| Manager | `demo-admin@livia.io` | `/inbox` |
| Reception | `demo-frontdesk@livia.io` | `/bookings` |
| Senior staff | `demo-staff-senior@livia.io` | `/my-day` |
| Junior staff | `demo-staff-junior@livia.io` | `/my-day` |

## Prep (PowerShell)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run db:migrate:sql
pnpm demo:provision
pnpm dev:api
# separate terminals:
pnpm dev:dashboard
pnpm dev:internal
pnpm dev:marketing
```

## Automated checks (run before you click)

```powershell
pnpm run smoke:demo
pnpm run smoke:platform
pnpm run stress:flood
pnpm gate:production-ready
```

**Internal observability:** open http://127.0.0.1:5175 → paste `INTERNAL_OPS_SECRET` from `.env` → **Observability** tab → **Ensure demo ops data** (auto-runs if thin). **Support** tab should show ≥8 open tickets after provision.

Full exploration guide: [DEMO-EXPLORATION.md](./DEMO-EXPLORATION.md)

## E2E (demo owner path)

```powershell
pnpm e2e:prep
pnpm --filter @workspace/e2e exec playwright test tests/demo-owner-flow.spec.ts
```

## What we fixed (demo legal loop)

- `POST /me/platform-legal` now creates the user row before updating (fixes “User not found”).
- Demo provision + sign-in record platform legal automatically.
- `GET /me` backfills legal for `demo-*@livia.io` in dev.
- Legal page invalidates cache and sends existing shops to **dashboard**, not empty onboarding.

## Architecture sanity (honest)

| Layer | Verdict |
|-------|---------|
| **Modularity** | Good — `lib/*` shared packages, OpenAPI codegen, vertical packs, Inngest workflows off the request path. |
| **Tenant isolation** | Good — `businessId` scoping + membership RBAC; audit hash chain. |
| **Middleware** | Request ID, structured logs, gzip (prod), Clerk, CORS, Sentry, JSON error envelope with `requestId`. |
| **Failsafes** | Transports degrade (PENDING writes); public chat rate limit; legal + beta gates; internal ops secret-gated. |
| **Gaps** | No full APM yet — use Internal **Observability** + Sentry + `pnpm stress:flood`; run `pnpm smoke:uat` under load. |

Full walkthrough: [`FIRST-DEMO-WALKTHROUGH.md`](./FIRST-DEMO-WALKTHROUGH.md).
