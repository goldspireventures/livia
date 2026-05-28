# See Livia for the first time — demo walkthrough

Your script for a founder demo: **five terminals**, **one password**, **18 pre-loaded businesses**.  
Estimated time: **45–60 minutes** if you hit every persona; **20 minutes** for the highlight reel.

---

## 0. One-time prep (PowerShell)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm install
pnpm run db:migrate:sql
pnpm run db:push
pnpm demo:provision
pnpm gate:production-ready
```

| Item | Value |
|------|--------|
| Demo password | `LiviaDemo2026!` (or `LIVIA_DEMO_PASSWORD` in `.env`) |
| API | http://127.0.0.1:3001 |
| Dashboard | http://127.0.0.1:5173 |
| Marketing | http://127.0.0.1:5174 |
| Internal ops | http://127.0.0.1:5175 |
| Mobile (LAN) | Expo prints `exp://YOUR_LAN_IP:8083` |

Confirm demo world:

```powershell
curl http://127.0.0.1:3001/api/demo/status
```

Expect `"provisioned": true` and a list of business slugs.

### Automated smoke (30 seconds)

```powershell
pnpm run smoke:demo
pnpm run db:migrate:sql   # if gate tests fail on tenant_attestation
```

| Check | Command | Pass |
|-------|---------|------|
| API health | `curl http://127.0.0.1:3001/api/healthz` | `200` |
| Demo world | `curl http://127.0.0.1:3001/api/demo/status` | `"provisioned": true`, 18 slugs |
| Public booking API | `curl http://127.0.0.1:3001/api/public/businesses/aurora-galway` | `200` + `services[]` |
| Dashboard shell | open http://127.0.0.1:5173/demo | page loads |
| Marketing | open http://127.0.0.1:5174/pricing | pricing + Europe link |

---

## Terminal 1 — API

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:api
```

Leave running. Health: http://127.0.0.1:3001/api/health

---

## Terminal 2 — Dashboard (tenant app)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:dashboard
```

Open: http://127.0.0.1:5173/demo

---

## Terminal 3 — Marketing (livia.io local)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:marketing
```

Open: http://127.0.0.1:5174

**Show:** Home → **Pricing** (all tiers + revenue streams) → **Europe** (markets & languages) → **Deutsch** → waitlist form → **See it in action** (links to `/demo`).

---

## Terminal 4 — Internal ops (optional, 2 min)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:internal
```

Open: http://127.0.0.1:5175 — paste `INTERNAL_OPS_SECRET` from root `.env`.

Search `aurora` → open tenant card.

---

## Terminal 5 — Mobile (optional)

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:mobile:device
```

Scan QR in Expo Go · sign in `demo-owner@livia.io` / `LiviaDemo2026!`

---

## Act 1 — Demo gateway (2 min)

URL: http://127.0.0.1:5173/demo

1. **Set up full demo world** (if not already provisioned).
2. Scroll **Live showcases** — note verticals + cities (Dublin, London, Berlin, Paris).
3. Open persona cards — each uses demo password sign-in (skips Clerk friction).

**Say:** “This is the full EU craft economy in one database — not a single fake salon.”

---

## Act 2 — Founder multi-brand (10 min)

Sign in: **demo-founder@livia.io** / `LiviaDemo2026!`

| Step | Where | What to show |
|------|--------|----------------|
| 1 | `/chain` or dashboard | Aurora group + **Rose Spa London**, **Studio Neun Berlin**, **Belle Vue Paris** |
| 2 | Dashboard | Liv moments strip (pending / handoff) |
| 3 | `/inbox` | OPEN thread + HANDED_OFF (refund scenario) |
| 4 | `/bookings` | Today column, running late if shown |
| 5 | `/settings?tab=liv` | Tool catalog per vertical |
| 6 | `/settings?tab=billing` | Plans €79 / €149 / €249 / €99 host + add-ons |
| 7 | `/settings?tab=comms` | Channel wizard (WhatsApp / IG priorities by jurisdiction) |

**Say:** “Monetisation is subscription + seats + capped voice outcome share — no commission on appointments.”

---

## Act 3 — Single-shop owner (5 min)

Sign out → **demo-owner@livia.io**

| Step | Where | What to show |
|------|--------|----------------|
| 1 | `/dashboard` | **Conor's Cut** — solo barber, not chain nav |
| 2 | `/my-day` | Staff-centric day view |
| 3 | `/b/` slug | Public booking (incognito): http://127.0.0.1:5173/b/conors-cut-dublin |

---

## Act 4 — Vertical spotlight (8 min)

Pick **three** public booking URLs (incognito):

| Slug | Vertical | Talk track |
|------|----------|------------|
| `aurora-studio` | Hair / flagship | AI footer, booking flow |
| `clarity-medspa-dublin` | Medspa | Consent + procedure copy |
| `paws-parlour-dublin` | Pet grooming | Pet-aware vocabulary |
| `ink-anchor-galway` | Body art | Design proofs link in product |
| `motion-physio-cork` | Allied health | Longer sessions / policies |

Full slug list: `GET http://127.0.0.1:3001/api/demo/status`

---

## Act 5 — Manager, reception, staff (5 min)

From `/demo`, open:

| Persona | Email | Lands on |
|---------|-------|----------|
| Manager | demo-admin@livia.io | Inbox-first |
| Reception | demo-frontdesk@livia.io | Bookings-first |
| Senior staff | demo-staff-senior@livia.io | My Day |

**Say:** “RBAC is real — same business, different home routes and tabs.”

---

## Act 6 — Customer on the phone (3 min)

Incognito: http://127.0.0.1:5173/b/aurora-studio

1. Book a service · see jurisdiction footer + AI disclosure.
2. (Optional) Trigger inbound simulate from Settings → Communications if configured.

---

## Act 7 — Real signup path (optional, 15 min)

Incognito · **non-demo** email:

1. http://127.0.0.1:5173/sign-up
2. http://127.0.0.1:5173/legal-acceptance
3. http://127.0.0.1:5173/onboarding — A1 attestation + A7 channels + A12 test booking

Requires beta invite if `LIVIA_BETA_SIGNUP_MODE=invite` in `.env`.

---

## Highlight reel (20 min)

If short on time, only do:

1. Marketing pricing + Europe pages (:5174)
2. `/demo` → founder → inbox → bookings → billing tab
3. One medspa public book + one hair public book
4. Mobile push (one notification)

---

## Monetisation cheat sheet (say out loud)

| Stream | Price |
|--------|-------|
| Solo | €79/mo + voice 4% capped |
| Studio | €149/mo + €15/seat |
| Chain | €249/shop + €15/seat |
| Host | €99/mo + €19/renter |
| Peer insights add-on | €49/mo |
| Migration concierge | €500–€2,500 quoted |
| Stripe Connect | Pass-through to shop (deposits) |

Closed beta: **free** · pricing locks at public launch.

---

## Languages & Europe (30 sec)

- **Dashboard:** English UI.
- **Liv + public booking:** IE, GB, DE, FR, ES, IT, NL, PL jurisdiction packs — currency, footer, localized greetings.
- **Marketing:** English + `/de` landing.

Details: http://127.0.0.1:5174/europe

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 / empty dashboard | Re-run `pnpm demo:provision` |
| Port in use | Kill old node on 3001 / 5173 |
| Demo password fail | Match `.env` `LIVIA_DEMO_PASSWORD` |
| Mobile cannot reach API | Same Wi‑Fi; use `dev:mobile:device` LAN URL |
| Legal gate blocks onboarding | `LIVIA_SKIP_LEGAL_GATE=1` in `.env` for local only |

---

## Reference

| Doc | Topic |
|-----|--------|
| [MANUAL-WALKTHROUGH-DEMO.md](./MANUAL-WALKTHROUGH-DEMO.md) | Checklist per persona |
| [BETA-ONBOARDING-FLOW.md](../product/BETA-ONBOARDING-FLOW.md) | Legal + beta gates |
| [pricing-and-packaging.md](../business/pricing-and-packaging.md) | Economics deep dive |
| [FULL-STACK-LOCAL-RUNBOOK.md](./FULL-STACK-LOCAL-RUNBOOK.md) | Ports & env |
