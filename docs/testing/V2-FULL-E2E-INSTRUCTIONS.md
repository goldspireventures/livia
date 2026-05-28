# v2 full E2E — external + internal

**When:** After engineering marks [`V2-SURFACE-MATRIX.md`](../product/V2-SURFACE-MATRIX.md) green (or known skips).  
**Spine:** [`E2E-RUNBOOK.md`](./E2E-RUNBOOK.md) · **Founder lane (not eng blockers):** [`../product/FOUNDER-SHIP-LANE.md`](../product/FOUNDER-SHIP-LANE.md)

---

## Four surfaces (entire Livia v2)

| Surface | URL | Who |
|---------|-----|-----|
| **livia.io** (marketing) | http://localhost:5174 | Prospects, waitlist |
| **Livia external** (tenant) | http://localhost:5173 | Shop owners, staff — Clerk auth |
| **Livia internal** (ops) | http://localhost:5175 | Livia Inc — `INTERNAL_OPS_SECRET` |
| **API** | http://localhost:3001 | All clients |

Public customer booking: http://localhost:5173/b/{slug}

**Map:** [`../product/LIVIA-FULL-SURFACE-MAP.md`](../product/LIVIA-FULL-SURFACE-MAP.md)

---

## One-time prep

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
node scripts/e2e-prep.mjs
```

Apply SQL migrations (all v1.5 + v2):

```powershell
pnpm run db:migrate:sql
```

---

## Terminals (keep 1–4 running)

```powershell
# T1 API
pnpm dev:api

# T2 External dashboard
pnpm dev:dashboard

# T3 Internal portal (v2)
pnpm dev:internal

# T4 Public site (livia.io)
pnpm dev:marketing
```

---

## Automated layers

```powershell
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
pnpm test:e2e:platform
pnpm test:e2e:marketing
```

**Internal** (requires `INTERNAL_OPS_SECRET` in root `.env`):

```powershell
$env:INTERNAL_OPS_SECRET = "your-secret"
pnpm --filter @workspace/e2e exec playwright test internal-gate
```

---

## Manual external checklist (demo)

1. http://localhost:5173/demo — open **founder**, **owner**, **manager**, **staff**, **receptionist** doors.
2. Per persona verify: **Today**, **Bookings**, **Customers**, **Inbox**, **Settings** (tabs: shop, Liv, comms, policy, billing).
3. v2 routes (shell loads; content may be empty without tier/vertical):
   - `/host` (chair-host tier)
   - `/brands`, `/chain`
   - `/rota`, `/hiring`
   - `/classes` (fitness vertical)
   - `/design-proofs` (body-art)
   - `/franchise` (franchise/mid-chain tier)
4. `/bookings/new` — full wizard completes.
5. `/b/luxe-salon-spa` — public book flow.
6. Mobile (optional): `pnpm dev:mobile:device` — Today briefing, More → Host/Brands when tier allows.

---

## Manual internal checklist (v2)

1. http://localhost:5175 — paste `INTERNAL_OPS_SECRET`.
2. **Tenants** — search, open health card, deep links, Liv assist.
3. **Platform** — tenant count, deploy version, integration flags.
4. **Voice & locales** — locale table matches policy packs (SE/DK/NO/FI/GB).

---

## Visual audit (optional — deletes when done)

```powershell
pnpm e2e:contextual-web
# Review e2e/visual-captures/ then remove:
Remove-Item -Recurse -Force e2e\visual-captures\*
```

---

## Pass criteria

- All Playwright suites: **0 failed** (skips OK with documented reason).
- No 500 on routes in `dashboard-gate.spec.ts` + `internal-gate.spec.ts`.
- External: every persona door loads primary nav; actions match labels (book, merge client, class enroll).
- Internal: three tabs functional; no tenant PII in franchise rollup API (aggregates only).

---

## After v2 ship (founder only)

[`FOUNDER-SHIP-LANE.md`](../product/FOUNDER-SHIP-LANE.md) — legal, Stripe prod, stores, paying cohort proof.
