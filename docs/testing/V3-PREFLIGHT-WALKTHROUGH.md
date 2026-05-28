# v3 pre-flight + manual walkthrough

Run **automated pre-flight first**, then your manual pass. Failures should appear in terminal output and API logs (`pnpm dev:api` console).

---

## One-time env

| File | Required |
|------|----------|
| Repo `.env` | `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `INTERNAL_OPS_SECRET` |
| `artifacts/livia-dashboard/.env` | `VITE_CLERK_PUBLISHABLE_KEY` (same Clerk app) |

---

## Terminal layout (keep servers running)

| # | Command | URL |
|---|---------|-----|
| A | `pnpm e2e:prep` | (once) |
| 1 | `pnpm dev:api` | http://127.0.0.1:3001 |
| 2 | `pnpm dev:dashboard` | http://127.0.0.1:5173 |
| 3 | `pnpm test:e2e:preflight` | automated |
| 4 | `pnpm dev:marketing` | http://127.0.0.1:5174 (optional) |
| 5 | `pnpm dev:internal` | http://127.0.0.1:5175 (optional) |

---

## Automated pre-flight (do this before manual)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm e2e:prep
# Terminal 1 + 2 up, then:
pnpm smoke:gate3
pnpm test:e2e:preflight
```

**Pass criteria:** `0 failed` (skipped tests OK if marketing/internal not running).

**What it covers:**

- API: health, public book + `nextSteps`, v3 platform health, continuity traces, partner auth, demo provision
- Dashboard shells: toolkit, audit, lifecycle, design-proofs, launch-status
- Public UI: full `/b/luxe-salon-spa` click-through to confirmed
- Authenticated owner: toolkit (payroll, running late), bookings, inbox, settings, chain, medspa gate, audit
- Marketing: `/de`, pet-grooming, medspa verticals (if :5174 up)
- Internal: platform health v3 + traces (if secret set)

---

## Manual walkthrough — v3 highlights (30–45 min)

After pre-flight passes, sign in via **http://localhost:5173/demo** → **Founder** door. Password: `LiviaDemo2026!`

### A. Alive booking (Scenario 01)

1. Incognito → `/b/luxe-salon-spa` → book with phone → confirm shows **What happens next**
2. Owner → **Bookings** → open new booking → **Booking continuity** panel / timeline
3. **Dashboard** or **Toolkit** → stuck continuity card if any pending

### B. Owner toolkit (v3 ops)

1. `/toolkit` — Payroll export, Running late (dry-run: don’t spam real SMS in prod)
2. `/settings?tab=policy` — Booking continuity toggle
3. `/settings?tab=comms` — Simulate inbound (if shown)

### C. Verticals / expansion

1. `/customers` → open client → **Pets** panel only if vertical is pet-grooming (demo is hair — expect no pets card)
2. `/medspa` — expect “medspa vertical” message on hair demo
3. Marketing → `/de`, `/verticals/medspa`, `/verticals/pet-grooming`

### D. Internal ops

1. http://localhost:5175 → paste `INTERNAL_OPS_SECRET`
2. **Platform** tab → v3 signals (stuck continuity, migrations list)
3. **Continuity** tab → trace table
4. Search `luxe` → tenant health card

### E. Regression core (10 min)

| Route | Check |
|-------|--------|
| `/chain` | Glance loads |
| `/inbox` | Threads |
| `/bookings/new` | Create booking |
| `/rota` | Shifts UI |
| `/demo` | Provision + doors |

---

## Logs when something fails

| Layer | Where to look |
|-------|----------------|
| API | Terminal running `pnpm dev:api` — JSON logs per request |
| Dashboard | Browser devtools → Network → failed `/api/*` |
| Playwright | Terminal output + `e2e/test-results/` on retry |
| DB | Migration errors in `pnpm e2e:prep` output |

Restart API after any `.env` change.

---

## Sign-off template

```text
Date:
e2e:prep exit 0: YES / NO
smoke:gate3: PASS / FAIL
test:e2e:preflight: PASS / FAIL (failed: …)
Public UI book: PASS / FAIL
Owner toolkit: PASS / FAIL
Internal v3 traces: PASS / FAIL / N/A
Manual v3 A–E: PASS / FAIL
```

---

See also: [`E2E-RUNBOOK.md`](./E2E-RUNBOOK.md) · [`V3-ENGINEERING-CLOSED.md`](../product/V3-ENGINEERING-CLOSED.md)
