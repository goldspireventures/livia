# Livia — fresh local test (copy/paste)

**Full E2E runbook (simplest):** [`E2E-RUNBOOK.md`](./E2E-RUNBOOK.md)

**Full founder walkthrough (first login):** [`FOUNDER-FIRST-LOGIN.md`](./FOUNDER-FIRST-LOGIN.md)

Close all terminals, then paste **one block per terminal**. Order: API → Web → Internal → Mobile (optional).

---

## One-time (first run only)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
pnpm run db:push
```

**Env (must exist before dev servers start):**

| File | Keys |
|------|------|
| Repo root `.env` | `DATABASE_URL`, `CLERK_SECRET_KEY`, `INTERNAL_OPS_SECRET` (any long random string for local) |
| `artifacts/livia-dashboard/.env` | `VITE_CLERK_PUBLISHABLE_KEY` |
| `artifacts/livia-mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL=http://127.0.0.1:3001` |

Optional demo flag (usually not needed locally): `LIVIA_DEMO_ENABLED=true` on API.

---

## Terminal 1 — API (port 3001)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:api
```

Wait until you see the server listening on **3001**.

---

## Terminal 2 — Salon / business web (port 5173)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:dashboard
```

---

## Terminal 3 — Livia company internal ops (port 5175)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:internal
```

This is **not** Clerk. Open http://localhost:5175 and paste **`INTERNAL_OPS_SECRET`** from root `.env`.

---

## Terminal 4 — Mobile (optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:mobile:device
```

Full per-persona login on phone is still easiest via web `/demo`; mobile **Experience** tab can provision the demo world.

---

## Terminal 5 — Smoke (optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm smoke:gate3
pnpm test:e2e:api
```

---

## URLs (bookmark these)

| What | URL |
|------|-----|
| **Start here — all doors** | http://localhost:5173/demo |
| Product hub (provision + links) | http://localhost:5173/portal |
| E2E playbook in app | http://localhost:5173/guides |
| Launch checklist | http://localhost:5173/launch-status |
| **Livia internal (company staff)** | http://localhost:5175 |
| Public customer booking | http://localhost:5173/b/aurora-studio |
| API health | http://127.0.0.1:3001/api/health |

---

## Two different “Livia” experiences

1. **Salon / chain (demo personas)** — real Clerk users on the dashboard. Founder, owner, manager, staff, reception, customer booking. One shared demo password.
2. **Livia Inc internal ops** — separate app on **:5175**, unlocked with **`INTERNAL_OPS_SECRET`**. Tenant directory, health — not `demo-founder@livia.io`.

The **8th door** on `/demo` (“Livia internal”) opens the internal console. `/portal` also has an **Internal ops** card.

---

## Test script (≈15 min)

1. Open http://localhost:5173/demo  
2. Click **Set up full demo world** (once; needs API + Clerk).  
3. Click each **salon door** — each signs you in as a different Clerk user (check bottom-right **Switch persona**).  
4. Click **Livia internal** → :5175 → paste `INTERNAL_OPS_SECRET`.  
5. Open http://localhost:5173/b/aurora-studio (customer, no login).  
6. Optional: http://localhost:5173/launch-status and http://localhost:5173/guides.

Longer script: `docs/testing/FULL-LIVIA-EXPERIENCE.md` · product paths: `docs/product/LAUNCH-PATH.md`.

---

## Demo logins (after provision)

Password: value of `LIVIA_DEMO_PASSWORD` in API env, or default **`LiviaDemo2026!`**

| Door | Email | You should land on |
|------|-------|-------------------|
| Founder (chain) | `demo-founder@livia.io` | `/chain` |
| Owner (single shop) | `demo-owner@livia.io` | `/dashboard` |
| Manager | `demo-admin@livia.io` | `/inbox` |
| Senior staff | `demo-staff-senior@livia.io` | `/my-day` |
| Junior staff | `demo-staff-junior@livia.io` | `/my-day` |
| Reception | `demo-frontdesk@livia.io` | `/bookings` |
| Customer | — | `/b/aurora-studio` (public) |
| **Livia internal** | — | http://localhost:5175 + **ops secret** |

Manual fallback: http://localhost:5173/sign-in with email + password above.

---

## Your own account (not demo)

Use Clerk sign-in with **your** email on web and mobile — same session if keys match. Demo world is separate from your production-style onboarding.

---

## If something fails

| Symptom | Fix |
|---------|-----|
| Provision fails | API running? `CLERK_SECRET_KEY` set? Restart API after `.env` changes. |
| Sign-in ticket fails | Use email + `LiviaDemo2026!` on `/sign-in`. |
| Internal 401 | `INTERNAL_OPS_SECRET` in root `.env` must match what you paste on :5175; restart API. |
| Empty inbox | Re-run **Set up full demo world** on `/demo`. |
