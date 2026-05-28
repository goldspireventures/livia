# Founder first login — full platform walkthrough

> **Beta cohort manual (step-by-step + UX):** [`MANUAL-WALKTHROUGH-BETA.md`](./MANUAL-WALKTHROUGH-BETA.md) — use that for pre-launch walkthroughs.

**You have not logged in yet.** This is the moment-of-truth script: start the stack, run automated smoke, then click through the product like a real EU salon owner and customer.

**Time:** ~45 min automated + manual, or ~15 min “demo doors only” fast path.

**UAT certification (automated + parity matrix):** [`UAT-CERTIFICATION.md`](./UAT-CERTIFICATION.md)

---

## What you need installed

- Node 22+, pnpm 9+
- Chrome (for Playwright)
- Clerk app (test keys)
- Postgres URL in repo-root `.env` (`DATABASE_URL` or `SUPABASE_DATABASE_URL`)

---

## Phase A — One-time setup (do once)

Open **PowerShell** in the repo:

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run codegen
```

### Env files (required)

| File | Variables |
|------|-----------|
| **Repo root `.env`** | Copy from [`.env.example`](../../.env.example) — `DATABASE_URL`, `CLERK_*`, `LIVIA_DEMO_PASSWORD`, `INTERNAL_OPS_SECRET` |
| **`artifacts/livia-dashboard/.env`** | Copy from [`artifacts/livia-dashboard/.env.example`](../../artifacts/livia-dashboard/.env.example) |
| **`artifacts/livia-mobile/.env`** (optional) | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL=http://127.0.0.1:3001` |

**Social channels (optional for simulate):**

```env
META_WEBHOOK_VERIFY_TOKEN=livia_meta_verify_dev
META_DEV_SIMULATE=true
```

### Database

```powershell
node --env-file=.env scripts/apply-sql-migrations.mjs
pnpm run db:push
pnpm run db:seed
```

If `db:push` fails with DNS (`ENOTFOUND db.*.supabase.co`), use the **pooler** connection string from Supabase (Session mode, port 5432) in `.env`, then retry. Migrations can still run via `apply-sql-migrations.mjs` if the pooler host resolves.

### Automated prep (optional bundle)

```powershell
node scripts/e2e-prep.mjs
```

Skips DB: `node scripts/e2e-prep.mjs --skip-db`

---

## Phase B — Start the stack (4 terminals)

Use **four separate PowerShell windows**. Leave each running.

### Terminal 1 — API (port 3001)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:api
```

**Wait for:** `Server listening` on port **3001**.

If you see `EADDRINUSE` on 3001, an old API is still running. Free the port then restart:

```powershell
netstat -ano | findstr :3001
taskkill /F /PID <pid_from_LISTENING_row>
pnpm dev:api
```

**Important:** `dev:api` rebuilds `dist/` on each start. If social webhooks 404, kill the old process and start again.

Quick check (Terminal 5 or browser):

```powershell
curl http://127.0.0.1:3001/api/healthz
```

Expect: JSON with ok/status.

---

### Terminal 2 — Owner dashboard (port 5173)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:dashboard
```

**Open:** http://localhost:5173

---

### Terminal 3 — Livia internal ops (port 5175, optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:internal
```

**Open:** http://localhost:5175 — paste `INTERNAL_OPS_SECRET` from root `.env` (not Clerk).

---

### Terminal 4 — Marketing site (port 5174, optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia\artifacts\livia-marketing"
pnpm run dev
```

**Open:** http://localhost:5174

---

### Terminal 5 — Automated smoke (run after T1 + T2 are up)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
pnpm test:e2e:platform
```

**Marketing E2E** (only if Terminal 4 is running):

```powershell
$env:E2E_MARKETING_URL="http://127.0.0.1:5174"
pnpm --filter @workspace/e2e exec playwright test eu-full-platform --project=platform
```

**Pass criteria:** Gate 3 smoke prints `All Gate 3 smoke checks passed.` Playwright: **no failures** (skips OK for marketing not running / missing AI key / Meta token mismatch).

**Known local skips (not blockers for UI walkthrough):**

- `public chat AI disclosure` — needs `ANTHROPIC_API_KEY` on API (skips gracefully if unset).
- Meta webhook verify — set `META_WEBHOOK_VERIFY_TOKEN=livia_meta_verify_dev` in root `.env` or match your token.
- Marketing Phase 1 tests — start Terminal 4 and set `$env:E2E_MARKETING_URL="http://127.0.0.1:5174"`.

**Restart API** after changing `.env` (Meta webhook, partner keys, etc.).

---

## Phase C — Your first login (manual, ~30 min)

### C1 — Fast path: demo world (recommended first)

1. http://localhost:5173/demo  
2. Click **Set up full demo world** (once; needs API + `CLERK_SECRET_KEY`).  
3. Open each **door** (Founder, Owner, Manager, Staff, Reception).  
4. Default password: **`LiviaDemo2026!`** (unless `LIVIA_DEMO_PASSWORD` is set on API).

| Door | Email | You should see |
|------|-------|----------------|
| Owner | `demo-owner@livia.io` | Dashboard, bookings, inbox |
| Manager | `demo-admin@livia.io` | Inbox |
| Customer (no login) | — | http://localhost:5173/b/aurora-studio |

**Switch persona:** bottom-right on dashboard after signing in.

---

### C2 — Seed tenant path (luxe-salon-spa)

If you ran `pnpm run db:seed`:

| Surface | URL |
|---------|-----|
| Public booking | http://localhost:5173/b/luxe-salon-spa |
| API public profile | http://127.0.0.1:3001/api/public/b/luxe-salon-spa |

Chat with Liv on the public page; first reply must mention **AI assistant**.

---

### C3 — Your real Clerk account (production-style)

1. http://localhost:5173/sign-in → **Sign up** with your email.  
2. Onboarding wizard: Ireland, Hair, Solo → complete acts through **Channels**.  
3. Settings → **Communications** → **Social channels** — save demo IDs or use **Simulate inbound**.  
4. **Inbox** — WhatsApp thread (Emma Walsh) and Instagram (@sophie_styles) after seed/simulate.  
5. Settings → copy public link → open in **incognito** and book an appointment.  
6. Back as owner: booking appears on calendar / bookings list.

---

### C4 — Wow checklist (launch feel)

- [ ] One **Inbox** shows WEB + SMS + WhatsApp + Instagram threads  
- [ ] Liv reply includes AI disclosure on first message  
- [ ] Public booking creates a real row you see as owner  
- [ ] **Help** opens from sidebar; report Liv works  
- [ ] `/launch-status` or guides in app load without 500  
- [ ] Internal ops (:5175) lists tenants when secret is correct  

Deeper script: [`REAL-WORLD-E2E-GUIDE.md`](./REAL-WORLD-E2E-GUIDE.md) · automation layers: [`E2E-TESTING-GUIDE.md`](./E2E-TESTING-GUIDE.md).

---

## Phase D — Mobile (optional, Terminal 6)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:mobile:device
```

Scan QR with Expo Go; same Clerk key as dashboard. Easiest first mobile pass: sign in as `demo-owner@livia.io` after demo provision.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API won’t start | `PORT=3001` in `.env`; nothing else on 3001 |
| Clerk sign-in fails | Same `pk_test_` in dashboard `.env` and API `CLERK_PUBLISHABLE_KEY` |
| `404` on `/api/channels/meta` | Restart API after pull |
| `messaging_channels` column missing | `pnpm run db:migrate:sql` then `pnpm run db:seed` |
| Demo provision fails | API running + `CLERK_SECRET_KEY` set |
| Public chat 503 / skip in E2E | Set `ANTHROPIC_API_KEY` on API |
| Empty inbox | Re-run demo provision or `pnpm run db:seed` |
| Playwright meta test skipped | Restart API; set `META_WEBHOOK_VERIFY_TOKEN` on API |

---

## Command cheat sheet

| Goal | Command |
|------|---------|
| SQL migrations | `pnpm run db:migrate:sql` |
| Schema push | `pnpm run db:push` |
| Seed luxe salon | `pnpm run db:seed` |
| Full prep | `node scripts/e2e-prep.mjs` |
| API unit tests | `pnpm --filter @workspace/api-server run test` |
| HTTP smoke | `pnpm smoke:gate3` |
| API E2E | `pnpm test:e2e:api` |
| Dashboard E2E | `pnpm test:e2e` |
| Platform E2E | `pnpm test:e2e:platform` |

---

*Start at **http://localhost:5173/demo** if you only have five minutes.*
