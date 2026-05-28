# Demo exploration — full Livia before manual onboarding

Use this to **explore every surface** with seeded data, then do a **real signup** path separately.

## Prep (once per machine)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run db:migrate:sql
pnpm demo:provision
```

Start surfaces (separate terminals):

```powershell
pnpm dev:api          # :3001
pnpm dev:dashboard    # :5173
pnpm dev:internal     # :5175
pnpm dev:marketing    # :5174
```

Automated sanity:

```powershell
pnpm run smoke:demo
pnpm run smoke:platform
pnpm run stress:flood
pnpm --filter @workspace/e2e run test:demo-owner
```

## Password

`LiviaDemo2026!` (or `LIVIA_DEMO_PASSWORD` in `.env`)

## URLs

| Surface | URL |
|---------|-----|
| **Demo gateway** | http://127.0.0.1:5173/demo |
| **Sign-in** | http://127.0.0.1:5173/sign-in |
| **Real signup** | http://127.0.0.1:5173/sign-up |
| **Internal ops** | http://127.0.0.1:5175 |
| **Marketing** | http://127.0.0.1:5174 |
| **API health** | http://127.0.0.1:3001/api/healthz |

## Demo gateway (:5173/demo)

1. **Set up full demo world** (idempotent).
2. **Businesses** — filter as you type; grouped by vertical; **Open as owner** = one tenant only.
3. **Public booking** — customer view per slug.
4. **Staff & role rehearsals** — RBAC personas below.

### Per-tenant owner (18 shops)

Email pattern: `demo-owner-{slug}@livia.io`  
Example: `demo-owner-clarity-medspa-dublin@livia.io` → lands on `/dashboard` for that shop only.

### RBAC personas (shared password)

| Persona | Email | Lands on | Explore |
|---------|-------|----------|---------|
| Founder (multi-shop) | `demo-founder@livia.io` | `/chain` | Chain rollup, multi-brand |
| Single owner | `demo-owner@livia.io` | `/dashboard` | Conor's Cut only |
| Manager | `demo-admin@livia.io` | `/inbox` | Approvals, conversations |
| Senior staff | `demo-staff-senior@livia.io` | `/my-day` | Stylist day |
| Junior staff | `demo-staff-junior@livia.io` | `/my-day` | Second shop |
| Reception | `demo-frontdesk@livia.io` | `/bookings` | Calendar-first |
| Customer | (no login) | `/b/aurora-studio` | Public booking + AI footer |

### Scenario logins (one story each)

| Email | Story |
|-------|--------|
| `demo-chain-ie@livia.io` | Aurora chain only |
| `demo-solo-ie@livia.io` | Solo barber IE |
| `demo-uk@livia.io` | London Rose Spa |
| `demo-de@livia.io` | Berlin Studio Neun |
| `demo-fr@livia.io` | Paris Belle Vue |

## Vertical showcase slugs

| Vertical | Slug |
|----------|------|
| Hair flagship | `aurora-studio`, `aurora-mews`, `aurora-galway` |
| Beauty | `bloom-beauty-dublin` |
| Wellness | `harbour-wellness-cork` |
| Body art | `ink-anchor-galway` |
| Pet grooming | `paws-parlour-dublin` |
| Medspa | `clarity-medspa-dublin` |
| Allied health | `motion-physio-cork` |
| Fitness | `peak-fitness-dublin` |
| Real-world IE | `stoneybatter-cuts`, `dublin-barber-collective`, `dundrum-hair-studio`, `dundrum-serenity-spa` |
| Markets | `london-rose-spa`, `berlin-studio-neun`, `paris-belle-vue` |

## What is seeded

- Inbox threads + bookings + audit trail (Aurora + verticals)
- Liv memory, signals, morning briefings
- **Onboarding 100%** on all demo businesses (no wizard trap)
- **Platform legal** auto-recorded for all `demo-*@livia.io` (Clerk + DB created if missing)
- **Support tickets** (internal queue + tenant can file via Help)
- Live-day / expanded bookings per shop

## Internal ops (:5175)

1. Paste `INTERNAL_OPS_SECRET` from repo `.env`.
2. **Support** tab — open triaged tickets (auto-seeded on unlock if thin).
3. **Tenants** — filter as you type.
4. **Observability** — platform metrics; auto-runs **Ensure demo ops data** when demo is thin.
5. Buttons: **Sync demo identities**, **Ensure demo ops data**, **Run stress probes**.

If you see **Not found** on Observability: API not on :3001, wrong ops secret, or route blocked — fix env and refresh.

## Tenant dashboard — areas to click

| Area | Best login |
|------|------------|
| Dashboard home / vertical modules | `demo-owner-{slug}@livia.io` |
| Inbox / Liv | `demo-admin@livia.io` or owner |
| Bookings / calendar | `demo-frontdesk@livia.io` |
| My Day | `demo-staff-senior@livia.io` |
| Chain / franchise | `demo-founder@livia.io` |
| Help → support ticket | any owner (creates tenant-side ticket) |
| Settings / channels / billing | owner |
| Public booking | `/b/{slug}` incognito |

## Real manual onboarding (after demo tour)

Incognito · non-`demo-*` email:

1. http://127.0.0.1:5173/sign-up  
2. http://127.0.0.1:5173/legal-acceptance  
3. http://127.0.0.1:5173/onboarding — complete acts through go-live  

Optional dev skip: `LIVIA_SKIP_LEGAL_GATE=1` in `.env` (do not use for investor demos).

## Repair commands

```powershell
pnpm demo:provision
# Internal API (with ops secret):
# POST /api/internal/ops/demo/ensure-ready
# POST /api/internal/ops/demo/backfill-legal
```

See also: [FOUNDER-RETEST.md](./FOUNDER-RETEST.md), [FIRST-DEMO-WALKTHROUGH.md](./FIRST-DEMO-WALKTHROUGH.md).
