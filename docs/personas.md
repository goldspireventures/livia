# Livia personas

**Status:** v1 (2026-05-06) — anchors ADR 0010 (multi-tenant + persona model) and ADR 0011 (mobile flagship).

This document is the canonical roster of humans Livia serves. Every product decision, every UI gate, every demo story should be traceable to one of these cards. If a feature doesn't sit clearly inside one persona's day, ask whether it should ship at all.

These cards are grounded in the ten Dublin design partners we are recruiting — barber, nails, lashes, tattoo, dental, podiatrist, physio, brow bar, lash lift, men's grooming. They are not invented composites.

---

## The hotel principle (experience tenet)

> A great hotel doesn't show its presidential-suite guest a smaller version of the standard-room key card. It builds a different ritual: the unmarked side entrance, the butler's introduction, the welcome champagne, the stationery already engraved with your name. **Same building. Different ritual.**

Livia is the same building for every persona. It must not be the same *experience.* This is the bar:

1. **Different first frame.** A STAFF signs in and the screen says "Good morning, Lara — three booked, one chair waiting." An OWNER signs in and the screen says "€1,240 booked today across 14 chairs." Same data layer; different opening line. *Never* the same dashboard with rows hidden.
2. **Different ritual.** The Founder's Sunday-evening ritual is a glance across three shops + an inbox triage. The Senior Stylist's morning ritual is "who's first, am I running on time, do I have coffee." The Manager's ritual is "what landed overnight, who needs me first." Each ritual gets its own purpose-built surface, not a filter on the OWNER cockpit.
3. **Different copy.** The voice doc (`docs/brand/voice.md`) lists the tone *for* each persona. STAFF copy is colleague-warm ("nice one — that's Mary's third visit"). OWNER copy is operator-direct ("3 cancellations this week — usual rate is 1"). Manager copy is steward-attentive. Customer copy is concierge-soft.
4. **Different motion.** The OWNER cockpit can afford richer dashboards-as-canvas animation. STAFF surfaces should feel as light as iMessage — instant, no ceremony. The persona dictates the motion budget, not the engineer.
5. **Different empty state.** A junior STAFF with an empty day should see "Your chair is open — here's how walk-ins work" hero, not "No data." The Founder with a quiet Tuesday should see "Quiet morning — Liv is handling 3 inbound DMs in the background," not the same blank state.
6. **Different memorable moment.** Each persona should have one "I cannot believe my software does this" moment. We name them in `docs/mobile-roadmap.md`. They are not the same moment for everyone.

This is the difference between a role-gated app (boring, defensive) and a purpose-built experience (memorable, premium). It's also the difference between Aurora and Aurum — the brand split (ADR 0007) was always about giving moments their own register; the persona split is the same idea applied to humans.

The hotel principle is the lens every product decision in this document is judged against. If a screen for STAFF is "the OWNER screen with bits hidden," it has failed the principle and must be rebuilt.

---

## P1 · The Founder (multi-business owner)

- **Real-world example:** Aoife runs three salons across Dublin and Galway under one brand. She has 18 staff total.
- **Tenant axis:** OWNER membership at ≥ 2 businesses.
- **Role axis:** OWNER (per business).
- **Primary device:** phone (95%), laptop on Sunday evenings.
- **Jobs to be done:**
  - Glance at all three shops' day in under 30 seconds.
  - Triage the AI inbox across shops.
  - Approve manager requests (refunds, schedule changes, deposit waivers).
  - Handle escalations from staff.
- **Surfaces touched:** Today (cockpit per shop), Inbox, Bookings, Customers, Settings → AI, Settings → Plan/Billing, Demo gateway.
- **Surfaces NOT touched (today):** day-to-day staff scheduling, individual chair availability, walk-in walk-out logging.
- **Data scope:** Each business in isolation. **No cross-business consolidated view in v1** — she switches with the tenant switcher. She accepts this as a cost of clean GDPR posture.
- **Demo story:** "Aurora Studio" + "Aurora Mews" + "Aurora Galway." Same brand, three businesses, three sets of staff and customers. The demo proves the tenant switcher.

## P2 · The Single-shop Owner

- **Real-world example:** Conor runs one barber shop in Stoneybatter. He has two chairs and one part-time receptionist.
- **Tenant axis:** OWNER at exactly 1 business.
- **Role axis:** OWNER.
- **Primary device:** phone (90%), laptop for AI training.
- **Jobs to be done:**
  - Run his own chair (he's a working owner).
  - Take inbound DMs and SMS through Liv.
  - See the day's revenue at a glance.
  - Configure the AI's tone and the public booking page once a quarter.
- **Surfaces touched:** Today, Bookings, Customers, Inbox, Settings → AI (rarely), public booking page (once a quarter).
- **Surfaces NOT touched:** anything multi-business; advanced reports.
- **Data scope:** his single business. The tenant switcher is hidden because he has 1 membership.
- **Demo story:** "Conor's Cut Co." Solo OWNER. The default sign-in gets you here.

## P3 · The Manager (ADMIN role)

- **Real-world example:** Niamh manages the floor at Aoife's flagship while Aoife is on the road. She does everything except billing and inviting other admins.
- **Tenant axis:** ADMIN at one business (could be ADMIN at more than one for a chain manager — supported but rare).
- **Role axis:** ADMIN.
- **Primary device:** phone (80%), tablet at the front desk for multi-staff scheduling.
- **Jobs to be done:**
  - Reschedule, refund, cancel on behalf of any staff.
  - Onboard new staff (invite + initial settings).
  - Step into a STAFF view to verify what a junior actually sees ("am I sending Sarah the right slate?").
  - Run the daily wrap-up.
- **Surfaces touched:** Today, Bookings, Customers, Inbox, Settings → AI, Staff (invite/edit), Persona switcher (peeks as STAFF).
- **Surfaces NOT touched:** Settings → Plan / Billing / Delete business.
- **Data scope:** the single business she manages. Persona switcher is one of her core tools.
- **Demo story:** Niamh at "Aurora Studio." Demonstrates the impersonation flow + audit log.

## P4 · The Senior STAFF (top earner)

- **Real-world example:** Lara is the top stylist at Aurora Studio. Her clients book her by name; she earns 40% of the shop's revenue.
- **Tenant axis:** STAFF at 1 business (could be 2 if she chair-rents at a second salon — supported).
- **Role axis:** STAFF.
- **Primary device:** phone, exclusively. She doesn't own a laptop.
- **Jobs to be done:**
  - See *her* day, not the shop's day. Next client, in how many minutes.
  - Mark her own bookings done / no-show.
  - View her own clients (history, preferences, spend with her).
  - Check her own week's earnings — but **never** the shop total.
  - Get a push when her next client confirms or cancels.
- **Surfaces touched:** My Day (the entire app, basically), Bookings (filtered to her), Clients (her clients only), Profile.
- **Surfaces NOT touched:** Settings, AI configuration, Inbox (until v1.1), Communications, the shop cockpit, anyone else's slate.
- **Data scope:** scoped to her `staff.id` by `requireRole("STAFF")`. She physically cannot reach colleagues' data — query-layer enforcement (per ADR 0009).
- **Demo story:** "Lara Byrne, Senior Stylist." Sign in as her, land on My Day with three booked + one waiting.

## P5 · The Junior STAFF / Walk-in handler

- **Real-world example:** Mo is six weeks into a barber apprenticeship. He takes walk-ins, assists Conor, and doesn't yet have his own client base.
- **Tenant axis:** STAFF at 1 business.
- **Role axis:** STAFF.
- **Primary device:** phone.
- **Jobs to be done:**
  - See what's been assigned to him today (often nothing pre-booked).
  - Convert a walk-in into a booking (write his own slate).
  - Build a personal client base over time.
- **Surfaces touched:** My Day (often empty), Walk-in flow, his client list (small).
- **Surfaces NOT touched:** Same as P4.
- **Data scope:** same query-layer enforcement.
- **Demo story:** "Mo Healy, Junior Barber." Empty state magic — proves we handle "your day is open" gracefully, not as a failure.

## P6 · The Receptionist / Front-desk

- **Real-world example:** Síobhan runs the front desk at Aurora Studio four days a week. She books for everyone, takes phone calls, handles cash.
- **Tenant axis:** Modelled as **ADMIN** (one membership). She needs cross-staff visibility.
- **Role axis:** ADMIN, but with a "front-desk" preset that hides AI training, Plan/Billing, and brand settings from her default view.
- **Primary device:** tablet at the desk, phone on the move.
- **Jobs to be done:**
  - Schedule across all staff in one calendar view.
  - Handle inbound phone calls — log them as bookings.
  - Take walk-ins and route them to the right chair.
  - Field "can I move my appointment?" requests on behalf of customers.
- **Surfaces touched:** Bookings (multi-staff calendar), Customers, Inbox, light Settings.
- **Surfaces NOT touched:** AI training, Plan, Billing, Brand. Hidden via a "front-desk preset" on the ADMIN role rather than a new role (per ADR 0009 deferral).
- **Data scope:** the single business. No cross-tenant.
- **Demo story:** "Síobhan at Aurora Studio." Demonstrates multi-staff scheduling.

> Note: a true `FRONT_DESK` role (with finer-grained permissions than ADMIN minus billing) is deferred per ADR 0009. v1 ships a UI preset over ADMIN.

## P7 · The End Customer

- **Real-world example:** Mary books a deep clean at Aurora Studio every six weeks. She'd rather DM than call.
- **Tenant axis:** N/A — customers are not tenants of the app.
- **Role axis:** N/A — customers are not Clerk users.
- **Primary device:** phone (Instagram DM, SMS, or `livia.io/b/aurora-studio`).
- **Jobs to be done:**
  - Book without phoning.
  - Reschedule without guilt.
  - Get a sensible reply at 22:00 when the salon is closed.
- **Surfaces touched:** Public booking page, the chat widget, SMS thread, email confirmations.
- **Surfaces NOT touched:** the dashboard. She never sees Livia's product.
- **Data scope:** her own row in `customers` (per business). She has GDPR rights against the controller (the salon).
- **Demo story:** "Book a slot at Aurora Studio." Demo viewer plays the customer side from the public URL.

---

## How these compose

| Persona | Tenant axis | Role axis | Can impersonate? | Default mobile tab |
|---|---|---|---|---|
| P1 Founder | N businesses | OWNER each | Yes (any STAFF in current biz) | Today |
| P2 Single-shop Owner | 1 business | OWNER | Yes (any STAFF) | Today |
| P3 Manager | 1 (sometimes N) | ADMIN | Yes (any STAFF) | Today |
| P4 Senior STAFF | 1 (sometimes 2) | STAFF | No | My Day |
| P5 Junior STAFF | 1 | STAFF | No | My Day |
| P6 Receptionist | 1 | ADMIN + FE preset | Yes | Bookings (multi-staff) |
| P7 Customer | n/a | n/a | n/a | n/a — uses public page |

---

## Appendix A — Current state audit (where the model leaks today)

This is the snapshot that motivated ADR 0010 and ADR 0011.

| # | Symptom | File / surface | Captured in |
|---|---|---|---|
| 1 | Web silently picks `businesses[0]`; no switcher anywhere. Founder cannot reach business B. | `artifacts/livia-dashboard/src/components/auth-guard.tsx:59` | ADR 0010 — first-class `currentBusinessId` |
| 2 | Persona switcher is web-only; mobile `_layout.tsx` only branches on real role. | `artifacts/livia-mobile/app/(tabs)/_layout.tsx:172-179` | ADR 0010 — persona switcher contract |
| 3 | Mobile theme defaults to light when `useColorScheme()` returns `null` in some places, dark in others. Demo viewers see two palettes on one screen. | `artifacts/livia-mobile/app/(tabs)/_layout.tsx:51` | ADR 0011 — theme rule |
| 4 | Mobile parity is ~30% of OWNER daily-use surfaces. No Inbox, no Settings, no AI config, no create flows for customers / staff / services. | `artifacts/livia-mobile/app/(tabs)/more.tsx`, missing screens | ADR 0011 — parity target ≥ 70% |
| 5 | Zero native goodies in production: no push, biometrics, widgets, Live Activities, offline, camera, location. | mobile codebase | ADR 0011 — N1-N8 |
| 6 | No demo gateway → every demo starts on an empty owner cockpit. Founder cannot show the persona range without account-juggling. | n/a | `docs/demo-gateway.md` |
| 7 | Persona impersonation is shipped but **not audited** — no `audit_log` table. Liability without the log. | `artifacts/api-server/src/lib/auth.ts` | `docs/policy/impersonation-audit.md` |
| 8 | `currentBusinessId` storage key on mobile is the legacy `livia_current_business_id`; web has no equivalent. Inconsistency between platforms. | `artifacts/livia-mobile/contexts/BusinessContext.tsx:23` | ADR 0010 — unify to `livia.currentBusinessId` |

The follow-on build tasks proposed at the end of Task #59 close every row above.
