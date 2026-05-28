# Livia — Full E2E testing guide

**Start here for day-to-day testing:** [`E2E-RUNBOOK.md`](./E2E-RUNBOOK.md) (terminals, commands, 15‑min manual path — verified on Windows).

Use this document for a **complete pre-launch test pass** across API automation, dashboard, mobile, Phase 10 features, and Gate 3 ops criteria.

**First time logging in?** [`FOUNDER-FIRST-LOGIN.md`](./FOUNDER-FIRST-LOGIN.md) (terminals + demo doors).

**Real-life manual script (prospect → owner → customer books):** [`REAL-WORLD-E2E-GUIDE.md`](./REAL-WORLD-E2E-GUIDE.md) — Gate 2 sign-off.

**Time estimate:** ~2–4 hours (automated ~15 min + manual Clerk flows).

---

## 0. What “full E2E” means here

| Layer | Tool | Auth | Covers |
|-------|------|------|--------|
| **L0** | `pnpm run typecheck` + api-server unit tests | — | Types + billing/audit/disclosure contracts |
| **L1** | `pnpm smoke:gate3` | None | HTTP smoke (API + dashboard HTML shells) |
| **L2** | `pnpm test:e2e:api` | None | Playwright API Gate + Phase 10 + **integrations platform** |
| **L3** | `pnpm test:e2e` | None (dashboard shells only) | + sign-in / public booking / demo pages |
| **L4** | Manual (this guide §4–8) | Clerk | Owner flows, billing, inbox, mobile, internal ops |
| **L5** | Gate 3 ops | Production-like | Paid sub, stores, legal, 7-day P0 (`docs/launch-plan.md`) |

CI today runs **L0 + L2 (API only)** on every PR. **L3–L5 are your responsibility** before declaring Gate 3.

---

## 1. One-time environment prep

### 1.1 Prerequisites

- Node 22+ (CI uses 22), pnpm 9+
- Postgres reachable via `DATABASE_URL`
- [Clerk](https://clerk.com/) app with **the same** publishable key on dashboard + mobile
- Optional: `ANTHROPIC_API_KEY` for public Liv chat smoke

### 1.2 Env files

1. Copy [`.env.e2e.example`](../../.env.e2e.example) → repo-root `.env`
2. `artifacts/livia-dashboard/.env`:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

3. `artifacts/livia-mobile/.env`:

   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### 1.3 Database + Phase 10 migration

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
```

Apply SQL migrations (includes Phase 10 + **integrations platform** `api_credentials`, `webhook_*`):

```text
001-rls-and-audit-guards.sql
002-voice-channel-enums.sql
003-phase10-entitlements-shifts.sql
004-integrations-platform.sql
```

**Linux / macOS / Git Bash:**

```bash
pnpm run deploy:migrate
```

**Windows (no `psql`):** run [`lib/db/migrations/sql/003-phase10-entitlements-shifts.sql`](../../lib/db/migrations/sql/003-phase10-entitlements-shifts.sql) in Supabase SQL editor or any Postgres client, then `pnpm run db:push` again.

### 1.4 Seed demo tenant

```powershell
node scripts/seed-demo.mjs
```

Expect: `Seeding demo workspace…` or `Already seeded — business "luxe-salon-spa"`.

### 1.5 Automated prep script

```powershell
node scripts/e2e-prep.mjs
```

Skips: `node scripts/e2e-prep.mjs --skip-db` or `--skip-browsers`.

### 1.6 Playwright browsers (first time)

```powershell
pnpm --filter @workspace/e2e run install-browsers
```

---

## 2. Start services (test session)

Open **three terminals** (minimum two for web E2E):

| # | Command | URL | Must be up for |
|---|---------|-----|----------------|
| 1 | `pnpm dev:api` | http://127.0.0.1:3001 | All API tests |
| 2 | `pnpm dev:dashboard` | http://127.0.0.1:5173 | Dashboard + gate3 HTML checks |
| 3 | `pnpm dev:mobile:device` | Expo QR | Mobile manual (physical device) |
| 4 | `pnpm dev:internal` | internal app port | Internal ops manual |

Verify API:

```powershell
curl http://127.0.0.1:3001/api/healthz
```

---

## 3. Automated test run (run in order)

All commands from **repo root** with API (+ dashboard for L3) running.

### 3.1 L0 — Static + unit

```powershell
pnpm run typecheck
pnpm --filter @workspace/api-server run test
```

**Pass criteria:** exit code 0; disclosure + entitlements tests green.

### 3.2 L1 — Gate 3 HTTP smoke

```powershell
pnpm smoke:gate3
```

**Pass criteria:** `All Gate 3 smoke checks passed.`  
Checks: healthz, public business, AI disclosure in chat, billing auth, chain rollup auth, peer insights auth, partner API auth, dashboard sign-in + `/b/luxe-salon-spa` HTML.

Optional explicit bases:

```powershell
node scripts/gate3-smoke.mjs http://127.0.0.1:3001 http://127.0.0.1:5173
```

### 3.3 L2 — Playwright API (+ Phase 10)

```powershell
$env:PARTNER_API_KEY="dev-partner-key"   # PowerShell — enables partner booking test
pnpm test:e2e:api
```

**Pass criteria:** all tests green or **skipped** only when demo not seeded / AI disabled (document skips).

**What it covers:**

- `e2e/tests/api-gate.spec.ts` — healthz, 401 on `/me/businesses`, public business, public chat disclosure (skips on 400/429/500/503 or `E2E_SKIP_PUBLIC_CHAT=1`), internal ops 401
- `e2e/tests/phase10-gate.spec.ts` — chain rollup 401, peer insights 401, partner API 401/200, chain checkout 401

Env overrides:

```powershell
$env:E2E_API_BASE="http://127.0.0.1:3001"
$env:E2E_DEMO_SLUG="luxe-salon-spa"
$env:E2E_PARTNER_API_KEY="dev-partner-key"
```

Restart **api-server** after setting `PARTNER_API_KEY` in `.env`.

### 3.4 L3 — Playwright dashboard shells

```powershell
pnpm test:e2e
```

**Pass criteria:** sign-in shell, public booking page heading, `/demo` gateway.

**Note:** Authenticated dashboard routes are **not** in Playwright yet (Clerk). See §4.

### 3.5 Demo-only API smoke

```powershell
pnpm smoke:demo
```

Confirms onboarding/dev routes return **401** without auth (not 404).

---

## 4. Manual dashboard E2E (Clerk required)

Sign in at http://127.0.0.1:5173/sign-in with a test user that **owns** a business (onboarding or demo load).

### 4.1 Core owner loop

| Step | Route / action | Expected |
|------|----------------|----------|
| 1 | Complete onboarding or load demo | Lands on dashboard with business context |
| 2 | `/dashboard` | Today/week counts load (no perpetual skeleton) |
| 3 | `/bookings` | List loads; open a booking detail |
| 4 | `/bookings/new` | Create booking; appears in list |
| 5 | `/customers` → **+** | Create customer |
| 6 | `/staff` | Staff list; open profile |
| 7 | `/services` | Services list |
| 8 | `/inbox` | Conversation list (may be empty) |
| 9 | `/settings` → General | Save business name |
| 10 | `/settings` → AI | Toggle AI; save greeting |
| 11 | `/settings` → Billing | Plan card loads; Solo/Studio/Chain/Host buttons visible |
| 12 | `/settings` → Peer insights | Card shows gating message or benchmarks after opt-in + add-on |
| 13 | `/audit` (OWNER) | Audit log loads; filter/search works |
| 14 | Public page `/b/{your-slug}` | Booking UI + Liv chat disclosure on first message |

### 4.2 Phase 10 — Chain rollup

| Step | Action | Expected |
|------|--------|----------|
| 1 | Own **≥2** businesses (second onboarding or dev seed) | — |
| 2 | Sidebar **Chain** appears (OWNER, ≥2 shops) | Nav visible |
| 3 | `/chain` | Per-shop cards + week totals; click shop switches tenant |
| 4 | API (Bearer token from browser network tab): `GET /api/me/chain-rollup` | JSON with `shopCount`, `shops[]` |

### 4.3 Phase 10 — Peer insights

| Step | Action | Expected |
|------|--------|----------|
| 1 | Settings → Peer insights → **Add-on (€49/mo)** | Dev: toast “granted locally”; prod: Stripe Checkout |
| 2 | **Opt in to benchmarks** | Success toast |
| 3 | Reload card | Message if k&lt;10 peers, else anonymized benchmarks (no shop names) |
| 4 | Network: `GET /api/businesses/{id}/peer-insights` | Matches UI; no PII in payload |

### 4.4 Phase 10 — Billing (dev without Stripe)

```http
POST /api/businesses/{businessId}/billing/dev-plan
Authorization: Bearer <clerk-jwt>
Content-Type: application/json

{ "planId": "chain" }
```

Only when `NODE_ENV !== production`. Then confirm Settings billing shows **Chain**.

With Stripe configured, test checkout buttons for Solo, Studio, Chain (`shopCount: 2`), Host (`renterCount: 1`).

### 4.5 Integrations platform (webhooks + partner API)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Settings → **Integrations** tab | Webhooks + API keys UI loads |
| 2 | Add webhook URL (use [webhook.site](https://webhook.site) for testing) | Secret copied once; endpoint listed |
| 3 | **Test ping** | Delivery row `delivered` or clear HTTP error |
| 4 | Create API key with `bookings:read` + `services:read` | Raw key copied once |
| 5 | `GET /api/partner/v1/businesses/{slug}/services` with key | `{ data: { services: [...] } }` |
| 6 | Confirm a booking (or cancel) | Webhook.site receives signed POST within ~15s |
| 7 | Verify signature (see `docs/engineering/integrations-platform.md`) | `X-Livia-Signature` validates |

**Cron retry sweep (optional):**

```powershell
curl -X POST http://127.0.0.1:3001/api/internal/cron/webhook-deliveries -H "X-Internal-Cron-Secret: YOUR_SECRET"
```

### 4.6 Communications & voice (if configured)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Settings → Communications | Twilio/Resend status readout |
| 2 | Dashboard voice KPI | “Voice recovered” when voice bookings exist |
| 3 | Call Twilio voice URL (staging) | AI opening line mentions AI assistant |

---

## 5. Manual mobile E2E

**Physical device:** `pnpm dev:mobile:device` (not `dev:mobile`). Phone + PC on same Wi‑Fi; allow Node in Windows Firewall.

| Step | Tab / screen | Expected |
|------|--------------|----------|
| 1 | Sign in (Clerk) | No auth loop |
| 2 | Onboarding → **Load demo workspace** | Today shows Luxe Salon & Spa |
| 3 | Today | Next appointment card |
| 4 | Bookings | List + detail |
| 5 | Clients → **+** | New client form saves |
| 6 | Inbox | List loads |
| 7 | More | Business switcher if multiple |
| 8 | Settings / AI | Toggle persists after reload |

---

## 6. Public & unauthenticated surfaces

| URL | Check |
|-----|--------|
| http://127.0.0.1:5173/b/luxe-salon-spa | Services, slot picker, confirm step |
| POST `/api/public/b/luxe-salon-spa/chat` | First reply contains “AI assistant” |
| http://127.0.0.1:5173/demo | Demo launcher |
| Marketing site (if running) | Pricing shows Solo €79, Studio €149, Chain, Host, peer add-on footnote |

---

## 7. Internal ops & partner API

### 7.1 Internal ops (`livia-internal`)

1. Set `INTERNAL_OPS_SECRET` on api-server; restart API.
2. `pnpm dev:internal` — paste secret in UI.
3. Search tenants → open tenant → health card (Stripe/Clerk links).

```powershell
curl -H "X-Internal-Ops-Secret: dev-ops-secret" http://127.0.0.1:3001/api/internal/ops/tenants?q=luxe
```

Expect **200** + tenant list (not 401).

### 7.2 Partner API (read-only)

```powershell
$headers = @{ "X-Partner-Api-Key" = "dev-partner-key" }
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/partner/v1/businesses/luxe-salon-spa" -Headers $headers
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/partner/v1/businesses/luxe-salon-spa/bookings?from=2026-01-01&to=2027-01-01" -Headers $headers
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/partner/v1/businesses/luxe-salon-spa/services" -Headers $headers
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/partner/v1/businesses/luxe-salon-spa/customers" -Headers $headers
```

Expect: `{ data: ... }` envelopes; customers have **no** `email` or `phone` fields.

Without header → **401**. With `PARTNER_API_KEY` unset → **503**.

---

## 8. Phase-by-phase regression checklist

Use when you need breadth after a large merge. Skip phases already covered above.

| Phase | Focus | Quick verify |
|-------|--------|--------------|
| 0–1 | Schema, OpenAPI, tenant context | `pnpm codegen` + typecheck |
| 2 | Billing meters | Complete a booking → usage in Settings billing |
| 3 | Liv inbox | Public chat + dashboard inbox |
| 4 | Mobile parity | §5 |
| 5 | Onboarding | New business + policy defaults |
| 6 | Audit log | `/audit` + persona view-as toast |
| 7 | Voice | Twilio webhook + voice digest on dashboard |
| 8 | Internal ops | §7.1 |
| 9 | CI smoke | L1–L3 green |
| 10 | Chain, peer, partner, design tokens | §4.2–4.3, §7.2, `pnpm test:e2e:api` |

---

## 9. Gate 3 ops (founder sign-off — not automated)

From `docs/launch-plan.md`:

- [ ] First **paid** Stripe subscription in production
- [ ] App store builds submitted / approved
- [ ] Legal pages live (privacy, terms, AI disclosure)
- [ ] Status page + 7 days zero P0 incidents

Engineering companion: `docs/compliance/soc2-type1-kickoff-checklist.md`, `docs/audits/marketing-vs-reality.md`.

---

## 10. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `404` on `/api/public/b/luxe-salon-spa` | `node scripts/seed-demo.mjs` |
| Public chat skip / 400 | Set `ANTHROPIC_API_KEY` or enable AI on business |
| `pnpm smoke:gate3` dashboard fails | Start `pnpm dev:dashboard` |
| Playwright `ECONNREFUSED` | Start `pnpm dev:api`; check `E2E_API_BASE` |
| Partner test skipped | Set `PARTNER_API_KEY` in `.env` and restart API |
| `entitlement_grants` column missing | Run migration `003-phase10-entitlements-shifts.sql` |
| Clerk 401 on manual tests | Same publishable key on dashboard/mobile; sign out/in |
| Mobile can’t reach API | `dev:mobile:device`, firewall, `curl http://<LAN-IP>:3001/api/healthz` |
| `check:naming` fails on Windows | Run in Git Bash / WSL / CI only |

---

## 11. CI parity (reproduce locally)

```bash
export DATABASE_URL=postgresql://livia:livia@localhost:5432/livia
export CI=true
export INTERNAL_OPS_SECRET=ci-ops-secret
export PARTNER_API_KEY=ci-partner-key
export E2E_PARTNER_API_KEY=ci-partner-key
bash scripts/deploy-migrate.sh
node scripts/seed-demo.mjs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start &
pnpm test:e2e:api
```

---

## 12. Quick reference — commands

```powershell
node scripts/e2e-prep.mjs          # prep DB seed + unit tests + browsers
pnpm dev:api
pnpm dev:dashboard
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
```

**Report template** (paste into PR or Notion):

```
Date:
Branch:
L0 typecheck+unit: PASS/FAIL
L1 smoke:gate3: PASS/FAIL
L2 test:e2e:api: PASS/FAIL (skips: ...)
L3 test:e2e: PASS/FAIL
Manual dashboard: PASS/FAIL (notes)
Manual mobile: PASS/FAIL / N/A
Phase 10 chain/peer/partner: PASS/FAIL
Gate 3 ops: open / signed
```
