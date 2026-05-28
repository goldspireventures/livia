# Livia — E2E runbook (web + mobile + API)

> **Beta founder walkthrough (manual):** [`MANUAL-WALKTHROUGH-BETA.md`](./MANUAL-WALKTHROUGH-BETA.md)  
> **v2 full pass (historical):** [`V2-FULL-E2E-INSTRUCTIONS.md`](./V2-FULL-E2E-INSTRUCTIONS.md)

**Verified:** 2026-05-22 on Windows — `e2e-prep`, `smoke:gate3`, `test:e2e`, `test:e2e:api` all pass (some optional skips).

Copy **one command block per terminal**. Do not close server terminals while testing.

---

## What you need once

| File | Set this |
|------|----------|
| Repo root `.env` | Copy from [`.env.example`](../../.env.example) — `DATABASE_URL` or `SUPABASE_DATABASE_URL` (**Session pooler**, port 5432 — not `db.*.supabase.co` if DNS fails) |
| Same `.env` | `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `INTERNAL_OPS_SECRET` (any long random string) |
| `artifacts/livia-dashboard/.env` | `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` (same Clerk app as API) |
| `artifacts/livia-mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`, `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3001` |

**Do not** set `SUPABASE_DATABASE_URL_DIRECT` to `db.xxx.supabase.co` on Windows unless that host resolves for you. Use the pooler URL for `DATABASE_URL`.

---

## Full platform test (recommended)

```powershell
pnpm start:platform:test          # terminals: API + dashboard + marketing + internal + demo
pnpm test:e2e:full-ready          # same as test:e2e:verticals — marketing + verticals + public booking + UX gate
```

See **[`READY-FOR-FULL-TEST.md`](./READY-FOR-FULL-TEST.md)** for URLs and manual walkthrough.

---

## Every test session (overview)

```
Terminal A (once)     →  pnpm e2e:prep
Terminal 1 (keep on)  →  pnpm dev:api        →  :3001
Terminal 2 (keep on)  →  pnpm dev:dashboard  →  :5173
Terminal 3 (run tests)→  smoke + Playwright
Browser               →  http://localhost:5173/demo
Phone (optional)      →  pnpm dev:mobile:device
```

---

## Terminal A — Prep (run first; can close when done)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
node scripts/e2e-prep.mjs
```

**Pass:** last line is `Prep finished (exit 0)`.

**If exit 1:**

| Error | Fix |
|-------|-----|
| `ENOTFOUND db.*.supabase.co` on `db:push` | Use pooler URL in `DATABASE_URL`; remove or fix `SUPABASE_DATABASE_URL_DIRECT` |
| `business_id does not exist` on migration 001 | Pull latest repo (001 is fixed to skip child tables) |
| Seed still works but push failed | You can still test if seed printed `luxe-salon-spa` — fix URL and re-run `pnpm run db:push` |

First time only (if `e2e-prep` complains about Playwright):

```powershell
pnpm --filter @workspace/e2e run install-browsers
```

---

## Terminal 1 — API (leave running)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:api
```

**Wait for:** `Server listening` and `port: 3001`.

**Port already in use:**

```powershell
netstat -ano | findstr :3001
taskkill /F /PID <pid_from_LISTENING_row>
pnpm dev:api
```

**Quick check** (new PowerShell window):

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/healthz
```

Expect JSON with ok/status (not a timeout).

---

## Terminal 2 — Web dashboard (leave running)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:dashboard
```

**Wait for:** `Local: http://localhost:5173/`

**Open:** http://localhost:5173/demo

---

## Terminal 2b — Marketing / livia.io (leave running)

```powershell
pnpm dev:marketing
```

**Wait for:** `Local: http://localhost:5174/`

**Or start everything at once:**

```powershell
pnpm start:platform:test
```

---


## Terminal 3 — Automated tests (after Terminal 1 + 2 are up)

Run **in this order**:

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
```

**Pass:**

| Command | You want |
|---------|----------|
| `pnpm smoke:gate3` | `All Gate 3 smoke checks passed.` |
| `pnpm test:e2e:api` | **0 failed** (skipped tests are OK — see below) |
| `pnpm test:e2e` | **0 failed** (skipped OK) |

Optional:

```powershell
pnpm smoke:demo
```

### All verticals (9 packs — owner + public booking)

After `pnpm demo:provision` (or `pnpm e2e:prep` once). If you added new vertical seeds, **restart `pnpm dev:api`** then run prep again (calls `sync-vertical-showcase` when demo already exists):

```powershell
pnpm test:e2e:verticals
```

**Pass:** smoke + UX gate finish with exit 0. Covers hair, beauty, allied-health, medspa, body-art, wellness, pet-grooming, fitness, automotive-detailing.

Screenshots (long run):

```powershell
pnpm test:e2e:verticals:full
```

See also [`TEST-EVERY-BUSINESS.md`](./TEST-EVERY-BUSINESS.md) and [`NORTH-STAR-DASHBOARD.md`](../company/NORTH-STAR-DASHBOARD.md).

---

## Skips that are OK (not blockers)

| Skip | Why | To enable (optional) |
|------|-----|----------------------|
| Public chat / AI disclosure | No Anthropic key on API | `AI_INTEGRATIONS_ANTHROPIC_*` or `ANTHROPIC_API_KEY` in root `.env`, restart API |
| Meta webhook / communications | Token not set | `META_WEBHOOK_VERIFY_TOKEN` in `.env`, restart API |
| Partner API with key | `PARTNER_API_KEY` unset | Add `PARTNER_API_KEY=dev-partner-key` to `.env`, restart API |
| Marketing pages | Site not running | Terminal 4 below + `$env:E2E_MARKETING_URL="http://127.0.0.1:5174"` |

---

## Terminal 4 — Marketing (optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia\artifacts\livia-marketing"
pnpm run dev
```

Open http://localhost:5174 — check `/pricing`, `/how-it-works`.

---

## Terminal 5 — Mobile (optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:mobile:device
```

Scan QR in Expo Go. Phone and PC on same Wi‑Fi.

**Easiest path:** provision demo on **web** first (`/demo`), then sign in on phone as `demo-owner@livia.io` with password **`LiviaDemo2026!`**.

---

## Manual test — 15 minutes (do this in the browser)

All on http://localhost:5173 unless noted.

### 1. Provision demo (once)

1. Go to **/demo**
2. Click **Set up full demo world**
3. Wait for success (needs Terminal 1 + `CLERK_SECRET_KEY`)

### 2. Try three doors

| Click door | Email (if asked) | You should see |
|------------|------------------|----------------|
| **Owner** | `demo-owner@livia.io` | Dashboard / today |
| **Manager** | `demo-admin@livia.io` | Inbox |
| **Customer** (no login) | — | `/b/aurora-studio` booking page |

Password (all demo users): **`LiviaDemo2026!`**

### 3. One customer booking (money path)

1. Open **incognito** → http://localhost:5173/b/luxe-salon-spa  
2. Pick a service → time → enter name **Test Customer** → confirm  
3. As **Owner** → **Bookings** → new row appears  

### 4. Two settings checks

1. **Settings** → **Communications** → **Simulate inbound** (WhatsApp) if shown  
2. **Inbox** → thread appears (may need simulate after fresh provision)

**Done** for a minimal Gate 2-style pass.

---

## Manual test — full web checklist

Sign in via **/demo** doors or **/sign-in** with demo emails. Use **Switch persona** (bottom-right) to change role.

| Page | URL | Check |
|------|-----|--------|
| Demo launcher | `/demo` | Provision + all doors |
| Dashboard | `/dashboard` | Loads data, no endless spinner |
| My day | `/my-day` | Staff view |
| Bookings list | `/bookings` | List + open one |
| New booking | `/bookings/new` | Create → appears in list |
| Clients | `/customers` | List + **+** new client |
| Client detail | `/customers/:id` | Opens |
| Staff | `/staff` | List + profile |
| Services | `/services` | List |
| Inbox | `/inbox` | Threads (after simulate or seed) |
| Settings | `/settings` | Tabs: shop, liv, comms, billing, integrations |
| Chain | `/chain` | Founder only, multi-shop |
| Audit | `/audit` | Owner |
| Public book (seed) | `/b/luxe-salon-spa` | Full book flow |
| Public book (demo) | `/b/aurora-studio` | Full book flow |
| Guides | `/guides` | In-app help loads |
| Portal | `/portal` | Links work |
| Launch status | `/launch-status` | No 500 |

---

## Manual test — mobile checklist

After web provision on `/demo`:

| # | Screen | Pass if |
|---|--------|---------|
| 1 | Sign in `demo-owner@livia.io` | Lands on app, no loop |
| 2 | **Today** | Shows next appointment or empty state |
| 3 | **Bookings** | Same booking as web incognito test |
| 4 | **Bookings** → tap row | Detail opens |
| 5 | **Clients** → **+** | New client saves |
| 6 | **Inbox** | Loads |
| 7 | **More** → Settings | Liv toggle saves |
| 8 | **More** → Staff / Services | Lists open |
| 9 | `demo-staff-senior@livia.io` | **My day** tab visible |

---

## Internal ops (separate app, not Clerk)

**Terminal 6 (optional):**

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:internal
```

1. Open http://localhost:5175  
2. Paste **`INTERNAL_OPS_SECRET`** from root `.env` (same value API uses)  
3. Search `luxe` or `aurora` → open tenant → health card loads  

Or from `/demo` click **Livia internal** door.

---

## Real account (not demo) — optional

1. http://localhost:5173/sign-up  
2. Complete **/onboarding** (Ireland, Hair, Solo)  
3. Copy public link from wizard → open in incognito → book  
4. Confirm booking on **Bookings** (web + mobile)  

Separate from demo world; does not replace demo provision.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Prep finished (exit 1)` | Read Terminal A output; fix DB URL or pull latest for migration 001 |
| API timeout / hung | Kill port 3001, restart `pnpm dev:api` |
| Dashboard “connection refused” | Start Terminal 2; wait for Vite `ready` |
| Clerk sign-in fails | Same `pk_test_` in dashboard `.env` and API |
| Demo provision fails | API running + `CLERK_SECRET_KEY` in root `.env` |
| Empty inbox | Re-run **Set up full demo world** or Settings → Simulate inbound |
| Mobile can’t reach API | `EXPO_PUBLIC_API_BASE_URL=http://<PC-LAN-IP>:3001` + firewall |
| Restart API after `.env` changes | Always |

---

## Visual audit captures (agent / designer loop)

**Shell routes** (no login):

```powershell
pnpm e2e:visual-capture
```

Output: `e2e/visual-captures/*.png`

**Founder checklist** (signed in via demo — use this for UX audit):

```powershell
pnpm e2e:founder-checklist
```

Output: `e2e/visual-captures/auth/*.png` — provisions demo, enters **Founder** door, walks Glance → Today → Inbox → Bookings dialog → Settings → Audit → second-shop onboarding.

Compare against [`docs/product/UX-AUDIT-2026-05-21.md`](../product/UX-AUDIT-2026-05-21.md), fix UI, re-run.

**Full contextual web audit** (all demo personas × routes × settings tabs):

```powershell
pnpm e2e:contextual-web
```

Output: `e2e/visual-captures/web/<persona>/*.png` (82 captures). Pair with [`docs/product/UX-CONTEXTUAL-REVIEW.md`](../product/UX-CONTEXTUAL-REVIEW.md) and [`WEB-MOBILE-PARITY.md`](../product/WEB-MOBILE-PARITY.md).

**Mobile visual capture** (Maestro — simulator/device + app running):

```powershell
pnpm dev:api
pnpm dev:mobile:device   # or ios simulator
pnpm maestro:visual-capture
```

See [`maestro/README.md`](../../maestro/README.md). Output: `e2e/visual-captures/mobile/*.png`.

---

## Command cheat sheet

| Goal | Command |
|------|---------|
| Full prep | `node scripts/e2e-prep.mjs` |
| API | `pnpm dev:api` |
| Web | `pnpm dev:dashboard` |
| Internal | `pnpm dev:internal` |
| Mobile (phone) | `pnpm dev:mobile:device` |
| HTTP smoke | `pnpm smoke:gate3` |
| API E2E | `pnpm test:e2e:api` |
| Web E2E | `pnpm test:e2e` |
| UX screenshots | `pnpm e2e:visual-capture` |
| All-persona web audit | `pnpm e2e:contextual-web` |
| Mobile Maestro captures | `pnpm maestro:visual-capture` |

---

## Sign-off (paste when done)

```text
Date:
Prep (exit 0): YES / NO
smoke:gate3: PASS / FAIL
test:e2e:api: PASS / FAIL (skips: ...)
test:e2e: PASS / FAIL
/demo provision: PASS / FAIL
Public booking luxe-salon-spa: PASS / FAIL
Owner inbox simulate: PASS / FAIL / N/A
Mobile owner sign-in: PASS / FAIL / N/A
Internal ops search: PASS / FAIL / N/A
```

---

**More detail:** [`FOUNDER-FIRST-LOGIN.md`](./FOUNDER-FIRST-LOGIN.md) · [`REAL-WORLD-E2E-GUIDE.md`](./REAL-WORLD-E2E-GUIDE.md) · [`FULL-LIVIA-EXPERIENCE.md`](./FULL-LIVIA-EXPERIENCE.md)
