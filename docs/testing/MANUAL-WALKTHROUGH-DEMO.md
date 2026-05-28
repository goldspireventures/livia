# Manual walkthrough — full demo world

**Preferred script:** [`FIRST-DEMO-WALKTHROUGH.md`](./FIRST-DEMO-WALKTHROUGH.md) (terminals, monetisation talk track, highlight reel).

Use this checklist after `pnpm demo:provision` (API on `:3001`, dashboard on `:5173`).

## Prep (once)

```bash
pnpm db:migrate:sql && pnpm db:push
pnpm dev:api          # terminal 1
pnpm dev:dashboard    # terminal 2
pnpm demo:provision     # terminal 3 — or use /demo → Set up full demo world
```

Password (dev): `LIVIA_DEMO_PASSWORD` in `.env`, default `LiviaDemo2026!`

## 1. Demo gateway (`/demo`)

- [ ] Click **Set up full demo world** — toast mentions 18+ businesses
- [ ] **Live showcases** grid shows verticals + London / Berlin / Paris
- [ ] Open `/b/london-rose-spa` in new tab — public booking loads

## 2. Founder (`demo-founder@livia.io`)

- [ ] Lands on **Chain** — Aurora shops + activity
- [ ] **Liv moments** strip on dashboard (pending booking / handoff / pulse)
- [ ] Switch business → **Rose Spa London** — timezone/currency feel UK
- [ ] Switch → **Studio Neun Berlin**, **Belle Vue Paris**
- [ ] **Inbox** — OPEN thread + HANDED_OFF (refund)
- [ ] **Bookings** — today column has live appointments
- [ ] **Settings → Liv** — tool catalog toggles save
- [ ] **Customer** → Liv memory panel has demo notes

## 3. Owner (`demo-owner@livia.io`)

- [ ] Single shop **Conor's Cut** — dashboard, not chain
- [ ] **My Day** path for staff personas (separate cards on `/demo`)

## 4. Manager / reception / staff

- [ ] **Manager** → inbox first
- [ ] **Receptionist** → bookings first
- [ ] **Senior staff** → my-day

## 5. Visual regression (optional)

```bash
pnpm test:e2e:full
```

Screenshots: `e2e/visual-captures/` and `e2e/visual-captures/web/<persona>/`.

## What is intentionally not in demo

- Counsel-signed medspa consent per country (copy is demo-only)
- Production voice marketing (Twilio path exists; eval gate for claims)
- SOC2 enterprise tier marketing
