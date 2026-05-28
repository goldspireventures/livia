# Engineering handoff — in-repo work complete for live onboarding

**Date:** 2026-05-22  
**Program:** [`SYSTEM-REALIGNMENT-PROGRAM.md`](./SYSTEM-REALIGNMENT-PROGRAM.md)  
**v2 engineering:** [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md) · **Your lane:** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) (only active checklist)

---

## Verdict

**Tenant onboarding (sign up → shop → services → team → Liv → public link → bookings) is ready for design partners and closed beta** on web + mobile, subject to your production env (Clerk, Postgres, optional Twilio/Resend/Stripe test).

Engineering has closed **P0–P2 in-repo** for the v1 realignment program. **v1.5 heartland + v2 expanded scope** are merged into the v2 execution program (Block A + B–H). Off-platform ship proof is founder-only — see [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md).

---

## What we shipped (this pass)

| Area | Change |
|------|--------|
| Booking | Full-page wizard at `/bookings/new`; dialog “quick book”; vertical-aware copy; skip Team when no assignees; bookings list pagination |
| Clients | Paginated list + load more (web) |
| Mobile | Service edit, staff profile + service assign, customer edit, booking actions (already present — matrix updated) |
| Docs | Final plan locked; alignment spine; this handoff |
| CI | `repo:health` audit step (informational) |

---

## How to onboard a real shop (engineering checklist)

1. `pnpm e2e:prep` (or fresh sign-up via Clerk)
2. Complete onboarding wizard (vertical picker → shop → services → team)
3. Settings → Liv, Communications, Policy, Billing (test mode OK)
4. Copy `/b/{slug}` — customer books + optional Liv chat on web
5. Owner/manager: bookings, inbox, clients, audit on web or mobile

**Runbook:** [`../testing/E2E-RUNBOOK.md`](../testing/E2E-RUNBOOK.md) · **First login:** [`../testing/FOUNDER-FIRST-LOGIN.md`](../testing/FOUNDER-FIRST-LOGIN.md)

---

## Your go-live checklist (not engineering)

See [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md):

- Counsel-signed legal pages linked in-app
- Stripe production + first paid subscription
- EU production region pinned
- App Store / Play public listing
- Live Twilio / Meta / Resend in prod
- `livia.io` marketing honest + live
- 10 real design-partner shops with real bookings

---

## Optional follow-ups (v1.5 — new program if reopened)

- WCAG axe pass on 10 routes (Phase 4.2)
- k6 load test on hot list endpoints (Phase 2.7)
- Mobile morning briefing + native public Liv chat
- WhatsApp/Instagram live inbound if marketed

---

## Sign-off

| Layer | Owner | Status |
|-------|-------|--------|
| In-repo P0–P2 | Engineering | **Complete** (2026-05-22) |
| UAT re-run | Founder + QA | Run `pnpm e2e:contextual-web` + Maestro when ready |
| G2/G3 | Founder | [`OPEN-ITEMS-DEFERRED.md`](./OPEN-ITEMS-DEFERRED.md) |
