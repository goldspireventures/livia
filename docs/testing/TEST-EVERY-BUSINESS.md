# Test every business on Livia (tenant tour)

Use this when you need to **validate the full product** before real signups: each salon, spa, medspa, etc. as its own owner with Liv inbox, bookings, and memory — plus the public booking page.

## One-time setup

```bash
pnpm dev:api
pnpm demo:provision   # seeds ~18 businesses + per-business owner logins
pnpm dev:dashboard
```

## Automated — all verticals (recommended before manual tour)

With API + dashboard running:

```powershell
pnpm test:e2e:verticals
```

Covers **9 vertical packs** (hair, beauty, allied-health, medspa, body-art, wellness, pet-grooming, fitness, automotive-detailing): public `/b/{slug}`, owner core routes, vertical-only routes, nav labels. Add `--visual` via `pnpm test:e2e:verticals:full` for screenshots under `e2e/visual-captures/full-audit/`.

Open **http://localhost:5173/demo** → **Set up full demo world**.

## How to tour businesses (what you asked for)

| Goal | What to do |
|------|------------|
| **See salon A as its owner** | On `/demo`, click **Open as owner** on that business row |
| **See spa B as its owner** | Sign out → **Open as owner** on spa B |
| **See medspa C** | Same — one click per business |
| **Public customer (no login)** | Click **Public booking** on that row → `/b/{slug}` |

Each business has a **dedicated owner login**:

- Email: `demo-owner-{slug}@livia.io` (e.g. `demo-owner-clarity-medspa-dublin@livia.io`)
- Password: `LIVIA_DEMO_PASSWORD` in `.env` (default `LiviaDemo2026!`)

That account has **only that business** in the location switcher — like a real owner after self-onboarding.

## Test real self-onboarding (beta users)

Demo tour ≠ production signup. To verify **new users see activity after signup**:

1. Open **http://localhost:5173/sign-up** with a **new email** (not `demo-*@livia.io`).
2. Complete onboarding → create a business.
3. For instant Liv activity in dev, run demo provision (separate tenant) or use onboarding seed if enabled.

Compare: demo provision pre-fills inbox, bookings, and Liv briefings so you can judge UX; a brand-new signup may start emptier until Liv runs.

## Role rehearsals (optional)

On `/demo`, expand **Staff & role rehearsals** for manager, front desk, multi-shop founder — useful for RBAC, not for “5 spas on the platform.”

## Quick reference

```
/demo                          → grid of all businesses
Open as owner                  → one tenant, full dashboard
Public booking                 → end customer, no Clerk
demo-owner-<slug>@livia.io     → manual /sign-in (demo form)
LiviaDemo2026!                 → password (unless .env overrides)
```
