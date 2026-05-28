# Launch path 1–6 — execution checklist

**Status:** Living doc (2026-05-20)  
**Use with:** `GET /api/launch/readiness` (dev) · `docs/launch-plan.md` · `docs/audits/marketing-vs-reality.md`

This is the ordered path from “demo feels alive” to “Gate 3 declared.” Code items link to repo; **ops** items need founder action outside git.

---

## Path 1 — Demo + daily use feel real

| Step | Action | Verify |
|------|--------|--------|
| 1.1 | `pnpm dev:api` + `pnpm dev:dashboard` | Both up |
| 1.2 | Open http://localhost:5173/demo → **Set up full demo world** | ≥8 businesses (11 when fully provisioned), 6 Clerk users |
| 1.3 | Sign in as `demo-admin@livia.io` → **Queue** (/inbox) | ≥6 threads, 2+ OPEN |
| 1.4 | Sign in as `demo-founder@livia.io` → **Glance** (/chain) | 3 shops |
| 1.5 | Sign in as `demo-staff-senior@livia.io` → **My chair** | Next client card |
| 1.6 | Incognito `/b/aurora-studio` | Book flow + step pills |

**Code:** `POST /api/demo/provision` · `demo-inbox.seed.ts` · persona rituals (`persona-rituals.ts`)

---

## Path 2 — Money, comms, compliance (trust)

| Step | Action | Verify |
|------|--------|--------|
| 2.1 | Root `.env`: `STRIPE_SECRET_KEY`, price IDs, `CLERK_*`, `DATABASE_URL` | `GET /api/launch/readiness` not blocked |
| 2.2 | Settings → Billing → start checkout (owner) | Stripe session opens |
| 2.3 | `RESEND_API_KEY` + verify sender domain | Booking email received |
| 2.4 | `TWILIO_*` + provision shop number | Inbound SMS → Liv reply |
| 2.5 | Public chat + SMS: AI disclosure visible | First message + footer |
| 2.6 | **Ops:** EU residency ADR + deploy region (#57) | Documented |
| 2.7 | **Ops:** ToS / Privacy / DPA at livia.io/legal | Counsel sign-off |

---

## Path 3 — Mobile flagship

| Step | Action | Verify |
|------|--------|--------|
| 3.1 | Provision demo on web first (shared Clerk) | Same users on phone |
| 3.2 | `pnpm dev:mobile:device` | Tabs match persona (Glance, Queue, My day, …) |
| 3.3 | Manager: Inbox + Approvals tabs | Threads visible |
| 3.4 | Staff: My day only + bookings list | No owner chrome |

**Code:** `artifacts/livia-mobile/app/(tabs)/_layout.tsx` · ritual tab titles

---

## Path 4 — Internal ops (Livia Inc)

| Step | Action | Verify |
|------|--------|--------|
| 4.1 | `pnpm dev:internal` → http://localhost:5175 | Console loads |
| 4.2 | Paste `INTERNAL_OPS_SECRET` | Tenant search works |
| 4.3 | Open tenant → health card + deep links | Stripe/Clerk/booking links |
| 4.4 | **Future:** RBAC roles (support / eng / success) | Not required for salon Gate 3 |

---

## Path 5 — Gate 2 (closed beta)

From `docs/launch-plan.md` — **all** for 7 consecutive days:

- [ ] `marketing-vs-reality.md` zero `build-before-G2`
- [ ] TestFlight + Play internal testing live
- [ ] Resend + Twilio **in production**
- [ ] Sentry; zero P0 for 7 days
- [ ] **10 real shops**, each with ≥1 **real** customer booking (not demo seed)
- [ ] Design-partner NPS transcripts in `.local/research/design-partners/`

**Onboarding:** invite staff via Settings → Team; use `docs/demo-script.md` for narrative.

---

## Path 6 — Gate 3 (public launch)

- [ ] Zero `build-before-G3` (deposits/Connect #58, EU residency #57, Stripe billing live + **first paid sub**)
- [ ] App Store + Play **public**
- [ ] livia.io live (hero, pricing, signup, status, changelog)
- [ ] Status page live
- [ ] SOC 2 Type 1 kicked off (`docs/compliance/soc2-type1-kickoff-checklist.md`)
- [ ] €1k MRR pipeline
- [ ] 7 days zero P0 in prod

---

## Quick commands

```powershell
cd "C:\Users\eamon\Personal Projects\apps\Livia"
pnpm dev:api
# another terminal:
pnpm dev:dashboard
curl http://localhost:3001/api/launch/readiness
pnpm smoke:gate3
```

---

## When is Livia “launch ready”?

**Product path 1–4 done** + **Gate 2 passed** + **Gate 3 ops checklist green** + **marketing-vs-reality** has no blocking rows.

`GET /api/launch/readiness` is a **engineering snapshot**, not a substitute for Gate 2/3 sign-off.
