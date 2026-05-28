# Full-stack local runbook — Livia (verified)

Use this when you want **everything** running locally: API, tenant web, marketing, internal ops, and mobile — first with **full demo data**, then a **fresh real signup** walkthrough.

**Status on this machine (verified):**

| Check | Result |
|-------|--------|
| Root `.env` — `DATABASE_URL`, `CLERK_SECRET_KEY`, `LIVIA_DEMO_PASSWORD` | OK |
| `pnpm demo:provision` | OK — 18 businesses, 6 personas |
| `pnpm gate:production-ready` | OK |
| `GET http://127.0.0.1:3001/api/demo/status` | `provisioned: true` |
| LAN IP for physical iPhone (`dev:mobile:device`) | `192.168.8.241` (yours may differ) |
| `artifacts/livia-internal/.env` | Created from example |
| `artifacts/livia-marketing/.env` | Created from example |
| `artifacts/livia-dashboard/.env` | `VITE_API_BASE_URL` set |

If port **3001** is already in use, stop the old API process before starting a second `pnpm dev:api` (Windows: `Get-NetTCPConnection -LocalPort 3001` then end that PID).

---

## READY FOR MANUAL E2E

When all five dev processes are up (see terminals below), open:

| Surface | URL |
|---------|-----|
| **Demo launcher** | http://127.0.0.1:5173/demo |
| **Tenant sign-in** | http://127.0.0.1:5173/sign-in |
| **Marketing** | http://127.0.0.1:5174 |
| **Internal ops** | http://127.0.0.1:5175 |
| **API health** | http://127.0.0.1:3001/api/healthz |
| **Demo status JSON** | http://127.0.0.1:3001/api/demo/status |

---

## One-time setup (if you have not run this repo before)

From repo root in PowerShell:

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
```

Root `.env` must include at minimum:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (Supabase or local) |
| `CLERK_SECRET_KEY` | API + demo Clerk users |
| `CLERK_PUBLISHABLE_KEY` | Same value in dashboard + mobile `.env` as `VITE_` / `EXPO_PUBLIC_` keys |
| `LIVIA_DEMO_PASSWORD` | All `demo-*@livia.io` users (default **`LiviaDemo2026!`**) |
| `INTERNAL_OPS_SECRET` | Paste at http://127.0.0.1:5175 on first load |

Per-app `.env` (copy from each `artifacts/*/.env.example` if missing):

- `artifacts/livia-dashboard/.env` — Clerk publishable key + `VITE_API_BASE_URL=http://127.0.0.1:3001`
- `artifacts/livia-mobile/.env` — `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (API URL set automatically by `dev:mobile:device`)
- `artifacts/livia-internal/.env` — proxy to `:3001` (no secret in file)
- `artifacts/livia-marketing/.env` — `VITE_API_BASE_URL`, `VITE_DASHBOARD_DEMO_URL`

---

## Phase 1 — Full demo visualization (do this first)

### Step 1 — Seed demo world (CLI, no browser)

With API **stopped or running** (CLI talks to DB directly):

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm demo:provision
```

Expect exit code **0** and `Demo world: 18 businesses`. Re-run anytime to refresh seed data.

Alternative (browser, needs API up): open http://127.0.0.1:5173/demo → **Set up full demo world**.

### Step 2 — Start all surfaces (five terminals)

Open **five** PowerShell tabs from repo root:

| # | Command | URL / notes |
|---|---------|-------------|
| 1 | `pnpm dev:api` | http://127.0.0.1:3001 — listens on `0.0.0.0` (phone can reach it) |
| 2 | `pnpm dev:dashboard` | http://127.0.0.1:5173 |
| 3 | `pnpm dev:marketing` | http://127.0.0.1:5174 |
| 4 | `pnpm dev:internal` | http://127.0.0.1:5175 |
| 5 | `pnpm dev:mobile:device` | Expo — **physical iPhone** on same Wi‑Fi |

Wait until each prints a ready URL (Vite “Local:”, API “Server listening”, Expo Metro line).

**Physical iOS (your device):**

1. Install **Expo Go** from the App Store.
2. Terminal 5 prints `API: http://192.168.x.x:3001` and `Metro: exp://192.168.x.x:8083` — use **your** IP from the terminal, not this doc.
3. Scan QR or Expo Go → **Enter URL** → paste the `exp://…` line.
4. Allow **Node.js** through Windows Firewall if prompted.
5. Phone and PC on the **same Wi‑Fi** (not guest network).

**Sign in on web or mobile** — same Clerk users everywhere:

| Role | Email | After sign-in (web) |
|------|-------|---------------------|
| Founder | `demo-founder@livia.io` | `/chain` — Aurora + vertical shops |
| Owner | `demo-owner@livia.io` | `/dashboard` — Conor's Cut Co. |
| Manager | `demo-admin@livia.io` | `/inbox` |
| Senior staff | `demo-staff-senior@livia.io` | `/my-day` |
| Junior staff | `demo-staff-junior@livia.io` | `/my-day` |
| Reception | `demo-frontdesk@livia.io` | `/bookings` |

**Password (all rows):** value of `LIVIA_DEMO_PASSWORD` in root `.env` — default **`LiviaDemo2026!`**

**Fast path on web:** http://127.0.0.1:5173/demo → click a **door** (one-click Clerk ticket). **Switch persona** chip (bottom-right) returns to `/demo`.

**Per-shop owners** (18 vertical showcases): `demo-owner-{slug}@livia.io` — e.g. `demo-owner-paws-parlour-dublin@livia.io`, same password.

**Customer (no login):** http://127.0.0.1:5173/b/aurora-studio (or any slug from `/api/demo/status`).

### Step 3 — Internal + marketing quick checks

| Surface | What to do |
|---------|------------|
| **Marketing** :5174 | Home, pricing, “Try demo” → should land on dashboard `/demo` |
| **Internal** :5175 | Paste `INTERNAL_OPS_SECRET` from root `.env` → search `aurora` → tenant health card |

Internal staff **do not** use tenant Clerk sessions.

### Step 4 — Optional automated smoke (not required for manual tour)

```powershell
pnpm gate:production-ready
```

Visual capture (simulator + Maestro): see [FULL-VISUAL-AUDIT-WEB-MOBILE.md](./FULL-VISUAL-AUDIT-WEB-MOBILE.md).

---

## Channels setup (WhatsApp / Instagram)

During onboarding **Act 7** or **Settings → Communications**, use the **step-by-step channel wizard**:

1. Jurisdiction-specific channel priorities (IE / ES / DE / …)
2. Meta prerequisites checklist
3. Platform webhook URL (copy for your Meta app admin)
4. Paste WhatsApp Phone number ID + Instagram Page ID
5. Dev: **Simulate inbound** → verify thread in **Inbox**

After go-live (~70% onboarding), a **Quick tour** dialog highlights Dashboard, Inbox, Bookings, Communications, and Liv.

Spec: [`docs/product/CHANNELS-EU-MESSAGING.md`](../product/CHANNELS-EU-MESSAGING.md)

---

## Notifications (push + web alerts)

| Surface | Behaviour |
|---------|-----------|
| **Mobile** | Allow notifications on first sign-in; tap push → booking or inbox |
| **Web** | Amber strip when pending bookings or inbox handoffs (polls every 60s) |
| **Settings** | Communications → **Push & alerts** toggles per event type |

Test push: `POST /internal/cron/test-push` with cron secret + `businessId`.

Spec: [`docs/product/NOTIFICATIONS.md`](../product/NOTIFICATIONS.md)

---

## Phase 2 — Fresh signup from scratch (after demo tour)

Do this **after** you have explored Phase 1. You are validating real onboarding, not demo doors.

1. **Incognito** browser → http://127.0.0.1:5173/sign-up  
2. Use a **new email** (not `demo-*@livia.io`).  
3. Complete onboarding → create shop → add service/staff → public `/b/your-slug`.  
4. Optional: repeat on mobile with `pnpm dev:mobile:device` and the same new account.

Demo routes (`/demo`, persona switcher) stay available in **dev** builds; production customer builds hide them (see `production-surface.ts`).

---

## Mobile — Android emulator (optional)

Physical iPhone: always use **`pnpm dev:mobile:device`** (LAN IP).

**Android Emulator** cannot use `localhost:3001` on the host the same way. Pick one:

### A — `adb reverse` (simplest with `dev:local`)

```powershell
# Start emulator from Android Studio first
adb reverse tcp:3001 tcp:3001
adb reverse tcp:8083 tcp:8083
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:mobile
```

Open app in emulator via Expo; API calls hit host `:3001`.

### B — LAN IP (same as phone)

```powershell
$env:LIVIA_DEV_HOST="192.168.8.241"   # your PC Wi‑Fi IP
pnpm dev:mobile:device
```

### C — Maestro visual capture (Android Studio + Maestro installed)

```powershell
pnpm dev:api
pnpm demo:provision
# Terminal: start emulator, then:
cd "C:\Users\eamon\Personal Projects\apps\Livia\artifacts\livia-mobile"
adb reverse tcp:3001 tcp:3001
pnpm run dev:local
# Another terminal:
cd "C:\Users\eamon\Personal Projects\apps\Livia"
$env:MAESTRO_DEMO_EMAIL="demo-owner@livia.io"
$env:MAESTRO_DEMO_PASSWORD="LiviaDemo2026!"
pnpm maestro:visual-capture
```

See `maestro/README.md` for flow list.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `EADDRINUSE :3001` | Only one API; kill the other process |
| Dashboard blank / API errors | Terminal 1 running; `curl http://127.0.0.1:3001/api/healthz` → `ok` |
| `/demo` provision fails | `CLERK_SECRET_KEY` in root `.env`; re-run `pnpm demo:provision` |
| iPhone cannot reach API | Same Wi‑Fi; firewall; use IP from `dev:mobile:device` output, not `localhost` |
| Clerk sign-in fails on phone | Clerk dashboard → allow your Expo redirect URLs / development instance |
| Demo password rejected | Match `LIVIA_DEMO_PASSWORD` in `.env` (default `LiviaDemo2026!`) |

---

## Related docs

| Doc | Use for |
|-----|---------|
| [FULL-LIVIA-EXPERIENCE.md](./FULL-LIVIA-EXPERIENCE.md) | Persona rituals and route map |
| [DEMO-FULL-SHOWCASE.md](./DEMO-FULL-SHOWCASE.md) | All 18 `/b/*` showcase URLs |
| [E2E-RUNBOOK.md](./E2E-RUNBOOK.md) | Playwright / CI-oriented steps |
| [EU-ONBOARDING-READY.md](./EU-ONBOARDING-READY.md) | EU onboarding certification |

---

## Your go-ahead checklist

Before manual testing, confirm:

- [ ] `pnpm demo:provision` finished with exit 0 (already done on this machine)
- [ ] Five terminals running (api, dashboard, marketing, internal, mobile **or** skip mobile until ready)
- [ ] http://127.0.0.1:5173/demo loads
- [ ] Sign in as `demo-owner@livia.io` / `LiviaDemo2026!` works on web
- [ ] iPhone: Expo shows app; sign-in same email/password
- [ ] http://127.0.0.1:5175 accepts `INTERNAL_OPS_SECRET`

When those pass, start **Phase 1** doors, then **Phase 2** fresh signup when you are ready.
