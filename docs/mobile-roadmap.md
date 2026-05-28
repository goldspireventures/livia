# Mobile roadmap — to flagship and back

**Status:** v1 (2026-05-06) — **Phases B–C are v1, not deferred** per [`product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) Track 3.

> **Canonical bar:** Mobile is the **flagship** operator surface. “Edit on web” is the exception, not the default. Target **≥ 90%** owner daily surfaces on device before Gate 2 declare.
**Anchors:** ADR 0008 (motion + materiality), ADR 0011 (mobile is the flagship), `docs/personas.md` (the hotel principle), `docs/demo-gateway.md`.

This roadmap takes the mobile app from "30% parity, zero native goodies, ambiguous theme" (where it is today) to "the surface Livia is alive in" (the north star locked in ADR 0011). It is phased so each phase is independently demoable and each phase delivers at least one wow moment.

## Parity audit (2026-05-06)

Score: **6 / 14 OWNER daily-use surfaces present on mobile ≈ 43%.** STAFF: **2 / 4 = 50%.** Native goodies: **0 / 8.** All three numbers are what we are measured against weekly.

### OWNER daily-use surfaces (target ≥ 70% on mobile)

| # | Surface | Web today | Mobile today | Phase to land on mobile |
|---|---|---|---|---|
| 1 | Today / cockpit | ✅ | ✅ | shipped |
| 2 | Bookings list + detail | ✅ | ✅ | shipped |
| 3 | Customers list + detail | ✅ | ✅ | shipped |
| 4 | Staff list | ✅ | ✅ (read-only) | shipped |
| 5 | Services list | ✅ | ✅ (read-only) | shipped |
| 6 | Public booking preview | ✅ | ✅ | shipped |
| 7 | Inbox (Liv conversations) | ✅ | ❌ | Phase B |
| 8 | Settings → AI | ✅ | ❌ | Phase B (read + tone toggle only; full training stays web) |
| 9 | Settings → Communications | ✅ | ❌ | Phase B |
| 10 | Settings → Brand | ✅ | ❌ | web-only (deliberate) |
| 11 | Settings → Plan / Billing | ✅ | ❌ | web-only (deliberate) |
| 12 | Customer create | ✅ | ❌ | Phase B |
| 13 | Service create / edit | ✅ | ❌ | Phase B |
| 14 | Staff invite | ✅ | ❌ | Phase B |

After Phase B: 11 / 14 = **79%**. ≥ 70% target met.

### STAFF surfaces (target 100% on mobile)

| # | Surface | Mobile today | Phase |
|---|---|---|---|
| 1 | My Day | ✅ | shipped |
| 2 | My customers | ✅ (within My Day) | shipped |
| 3 | My week summary | ❌ | Phase A |
| 4 | Privacy → Who viewed my day | ❌ | Phase D (depends on impersonation audit table) |

### Native goodies (target ≥ 4 / 8 by Gate 2, ≥ 6 / 8 by Gate 3)

Tracked as ADR 0011 N1-N8. Phasing below.

## The wow moments (one per persona)

Each phase has to deliver at least one. They are also the demo-gateway cues per `docs/demo-gateway.md`. The hotel principle is operational here: the moment is *for the persona*, never generic.

1. **Lara (Senior STAFF)** — Live Activity on her lock screen counts down to her next client. One swipe → "I've started." (Native: Live Activities · Phase C.)
2. **Aoife (Founder)** — She wakes up Sunday and the home-screen widget stack shows three shops as three cards: revenue today, next booking, inbox count. (Native: widgets · Phase C.)
3. **Mo (Junior STAFF)** — His empty My Day morphs into a "pick up walk-ins" hero with one-tap to start a walk-in flow + Face-ID to confirm a sale. (Native: biometrics · Phase B.)
4. **Niamh (Manager)** — She switches into Lara's persona for 90 seconds; an audit-log toast confirms "Lara will see this in her weekly digest." Transparency as a feature. (Native: in-app + push · Phase D.)
5. **Conor (Single-shop Owner)** — Mid-haircut, his phone vibrates with a soft tier-2 haptic + push: "Liv just booked Mary M. for €60 next Tuesday." (Native: push + haptics · Phase B.)
6. **Síobhan (Receptionist)** — Multi-staff calendar in landscape on the front-desk iPad, one tap to drop a walk-in onto the right chair. (Adaptive layout · Phase D.)
7. **Mary (End Customer)** — She opens the booking page over a poor 3G signal in a back garden and Liv still replies in 1 second because the chat is offline-first. (Native: offline reads on the public surface · Phase C.)

## Phases

### Phase A — Foundation (closes the strategy loop)

Goal: nothing new for the user yet — fix what's already broken so the rest of the roadmap stands on stable ground.

- A1. Web business switcher in the AppLayout (closes ADR 0010 gap on web; founders can finally reach all their shops).
- A2. Mobile sticky business chip in every tab header + standardise the storage key to `livia.currentBusinessId` with a one-shot migration.
- A3. Theme audit + lock to ADR 0011 rule (default dark when `useColorScheme()` is null; CI grep guard against direct `useColorScheme()` reads outside `useColors()`).
- A4. STAFF "My week" summary card on My Day (closes the STAFF surface gap).
- A5. Remove the dead persona-switch UI references on mobile and replace with a clear "View as staff (web only)" affordance for Phase D.

Phase A delivery = the platform is honest about its model. No regressions; no new product surface.

### Phase B — Parity to ≥ 70% + first push

Goal: cross the parity threshold + ship the first native goody so the demo has a concrete wow.

- B1. Inbox (Liv conversations) on mobile — list + thread view + take-over.
- B2. Settings on mobile — sectioned surface with AI tone toggle, Communications (Twilio number, Resend domain status), Privacy. Heavy AI training remains web-only.
- B3. Customer create + edit on mobile.
- B4. Service create + edit on mobile.
- B5. Staff invite on mobile (POST `/businesses/:bid/invitations`).
- B6. **N1 Push notifications** wired end-to-end (Expo + APNs + FCM): booking made, booking cancelled, inbox waiting. Per-business push token registration.
- B7. **N2 Biometrics** gate before Settings, before viewing revenue, before approving refunds.
- B8. **N8 Haptics audit** — codify the tier system across the app.

Phase B delivery = parity ≥ 79% + 3 of 8 native goodies + the Conor and Mo wow moments are real.

### Phase C — The flagship moments

Goal: ship the visual / continuous-presence moments that make the app a flagship rather than a companion.

- C1. **N3 Live Activities (iOS)** — countdown to next booking on the lock screen + Dynamic Island.
- C2. **N4 Widgets (iOS + Android)** — My Day glance + revenue today.
- C3. **N5 Offline reads** — last-fetched cockpit, today's bookings, today's customers, last 30d inbox usable offline. Writes queue with conflict UI.
- C4. **N6 Camera** — attach before/after photos to a customer note.
- C5. Demo gateway full implementation (depends on `audit_log` table + the demo seed).

Phase C delivery = 7 of 8 native goodies + Aoife and Lara wow moments + a real demo we can hand to a stranger.

### Phase D — Transparency + adaptive

Goal: ship the audit + transparency surfaces that turn impersonation into a defensible feature; adaptive layouts for tablets.

- D1. `audit_log` table + middleware writes (also unblocks the demo gateway in production).
- D2. STAFF Privacy surface — "Who viewed my day this week" + the weekly digest push.
- D3. Manager-side audit toast when entering persona view ("Lara will see this in her weekly digest").
- D4. Adaptive multi-staff calendar in landscape for the front-desk persona (iPad-class).
- D5. **N7 Location** — opt-in geofenced check-in for staff arriving at the shop.

Phase D delivery = the impersonation switcher graduates from internal-eyes-only to design-partner-ready + the receptionist has a real tablet workflow.

## Sequencing

- Phase A is mandatory before Phases B, C, D and should compress into ~2 weeks (it's mostly shipped logic + audit + cleanup).
- Phase B unblocks the bulk of demo value and should be prioritised over C if scheduling is tight.
- Phase C is the flagship reveal — sequenced before public launch (Gate 3).
- Phase D depends on `audit_log` (built in D1) so it must come last unless we extract D1 into Phase B.

## How parity is re-scored

Every Monday operating cadence (`docs/operating-cadence.md`) re-runs the parity table. Numbers go in the cockpit page of the cadence agenda. We do not declare Gate-2 passed until OWNER ≥ 70% AND STAFF = 100% AND ≥ 4 of 8 native goodies are in TestFlight.

## What is **not** on this roadmap

- Apple Watch / watchOS — post-Gate-3.
- Android Wear / Wear OS — post-Gate-3.
- Tablet-first adaptive layout beyond D4 — post-Gate-3.
- AI training editor on mobile — web-only forever (ADR 0011).
- Stripe billing portal on mobile — web-only forever (ADR 0011).

## EU/IRE residency

Push tokens, widget data caches, offline write queues, audit log entries — all live in the EU/Ireland region or on-device only. No mobile-side data crosses regions.
