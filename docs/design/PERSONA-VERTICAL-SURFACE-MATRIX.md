# Persona × vertical × surface matrix

**Status:** canonical (2026-05-29)  
**Parent:** [`EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md)  
**Companion:** [`SURFACE-AND-BREAKPOINTS.md`](./SURFACE-AND-BREAKPOINTS.md) · [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](./PRESENTATION-PRESETS-AND-ROLLOUT.md)

This document is the **full routing table** for tenant M1 visual surfaces.  
Personas: P1 Founder, P2 Owner, P3 Manager, P4 Staff, P6 Reception, P7 Customer.  
(P2a inherits P2; P5 inherits P4 with restricted actions.)

**Legend**

| Column | Meaning |
|--------|---------|
| **Home module** | Primary UI block on ritual home route |
| **Phone** | Layout on `<640px` / native app |
| **Tablet** | `640–1023px` / ≥600dp native |
| **Desktop** | `≥1024px` |
| **Alt pattern** | Optional pattern from design exploration |

---

## P1 — Founder (multi-shop)

| Vertical | Home route | Home module | Phone | Tablet | Desktop | Alt pattern |
|----------|------------|-------------|-------|--------|---------|-------------|
| hair | `/chain` | Shop KPI + alerts | Stacked shop cards | 2-col cards | 3-col + rollup table | Briefing Paper |
| beauty | `/chain` | Inbox rollup cross-shop | Cards + DM count badge | 2-col | Table + drill | Exception Only |
| body-art | `/chain` | Pipeline rollup / studio | Cards: proofs pending | 2-col pipeline summary | Kanban rollup | Fleet Cards |
| wellness | `/chain` | Location session fill | Shop cards | 2-col | Grid + packages | Briefing Paper |
| fitness | `/chain` | Class fill + waitlist | Shop cards | 2-col | Week capacity grid | Exception Only |
| medspa | `/chain` | Compliance + mandate rollup | Alert stack per shop | Split alerts \| detail | Hub compliance dashboard | Briefing Paper |
| allied-health | `/chain` | Follow-up chain health | Shop cards | 2-col | Recall table | Exception Only |
| pet-grooming | `/chain` | Day queue cross-location | Cards | 2-col | Roster table | Fleet Cards |
| auto-detailing | `/chain` | Bay utilisation rollup | Cards | 2-col | Bay timeline | Exception Only |

**Mobile native:** Glance tab — not full desktop parity. Tap shop → switch tenant → Today.

---

## P2 — Owner

| Vertical | Home route | Home module | Phone | Tablet | Desktop | Alt pattern |
|----------|------------|-------------|-------|--------|---------|-------------|
| hair | `/dashboard` | Flight plan + running late | Briefing + 3 KPI chips | 2×2 KPI + proposals | KPI strip + Liv hub | Always-On Counter |
| beauty | `/dashboard` | Inbox-forward + cycle | Briefing + inbox count | Split briefing \| threads | Inbox + cycle modules | Quiet Ledger (EOD) |
| body-art | `/dashboard` | **Pipeline board** | Stage list → cards | 2-col kanban | Full kanban | Platform Default pipeline |
| wellness | `/dashboard` | Session timeline + packages | Today list | Timeline + package CTA | Week room view | Spa calm modules |
| fitness | `/dashboard` | Class roster + waitlist | Next class + waitlist # | Roster + capacity | Week grid + waitlist panel | Gym bold |
| medspa | `/dashboard` | Medspa hub + mandates | Mandate alert stack | Alert \| procedure | Hub + audit strip | Clinical calm |
| allied-health | `/dashboard` | Follow-up chain | Today appointments | Chain list | Plan adherence view | Clinic standard |
| pet-grooming | `/dashboard` | Pet queue + pickup | Today grooms list | Day list wide | Bulk roster editor link | Playful paw |
| auto-detailing | `/dashboard` | Bay timeline | Bay status cards | Timeline | Multi-bay Gantt-lite | Bay industrial |

---

## P3 — Manager

| Vertical | Home route | Home module | Phone | Tablet | Desktop | Alt pattern |
|----------|------------|-------------|-------|--------|---------|-------------|
| hair | `/inbox` | Floor + rebook queue | Thread list → detail | List \| thread | 3-pane inbox | Escalation Desk |
| beauty | `/inbox` | DM priority queue | Same | Split pane | 3-pane | Approval Conveyor |
| body-art | `/inbox` + stations | Proof queue + stations | Proof list → fullscreen | **Proof split** | Pegboard + queue | Timeline River |
| wellness | `/inbox` | Room conflicts | List | Split | Calendar + inbox | Escalation Desk |
| fitness | `/inbox` | Roster borrow + class | List | Roster \| thread | Week roster borrow | Timeline River |
| medspa | `/inbox` | Mandate queue | Stack | Split | Mandate + audit | Escalation Desk |
| allied-health | `/inbox` | Intake + reschedule | List | Split | Chain editor link | Escalation Desk |
| pet-grooming | `/inbox` | Day schedule conflicts | List | Day \| detail | Roster | Front Desk Mode |
| auto-detailing | `/inbox` | Bay conflicts | List | Bay \| thread | Timeline | Escalation Desk |

---

## P4 — Staff

| Vertical | Home route | Home module | Phone | Tablet | Desktop | Alt pattern |
|----------|------------|-------------|-------|--------|---------|-------------|
| hair | `/my-day` | Next chair + snippet | **Floor Glance** hero | Hero + list | Chair list (rare) | Card Stack |
| beauty | `/my-day` | Station + patch-test flag | Floor Glance | Hero + notes | Station list | Quick Thread |
| body-art | `/my-day` | **Session block** + checklist | Single 4h block hero | Hero + prep | Same as phone | Quick Thread |
| wellness | `/my-day` | Session + buffer | Floor Glance | Hero | List | — |
| fitness | `/my-day` | Class / PT block | Next session hero | Roster chip | List | Card Stack |
| medspa | `/my-day` | Consent prep checklist | Hero + checklist | Split prep \| client | List | — |
| allied-health | `/my-day` | Patient slot + intake | Floor Glance | Hero + intake link | List | — |
| pet-grooming | `/my-day` | Pet card + behaviour | Pet hero card | Hero + notes | List | — |
| auto-detailing | `/my-day` | Vehicle package card | Bay job hero | Hero | List | — |

**Native mobile:** primary surface; web `/my-day` acceptable for managers preview only.

---

## P6 — Reception

| Vertical | Home route | Home module | Phone | Tablet | Desktop | Alt pattern |
|----------|------------|-------------|-------|--------|---------|-------------|
| hair | `/bookings` | Floor calendar | Day list + FAB | Simplified grid | Full calendar | Front Desk Mode |
| beauty | `/bookings` | Inbox + book | List | Split | Calendar + inbox | The Thread |
| body-art | `/bookings` | **Proof desk** | Queue → detail | **Queue \| sketch** | Split + context rail | Approval Conveyor |
| wellness | `/bookings` | Arrivals + rooms | List | Arrivals split | Room calendar | Front Desk Mode |
| fitness | `/bookings` | Class check-in | List | Check-in grid | Roster | Front Desk Mode |
| medspa | `/bookings` | Arrival + consent | Stack | Arrival \| consent | Hub handoff | The Thread |
| allied-health | `/bookings` | Check-in desk | List | Split | Slot grid | Front Desk Mode |
| pet-grooming | `/bookings` | Pickup + day | List | Day board | Calendar | Front Desk Mode |
| auto-detailing | `/bookings` | Bay intake | List | Bay board | Timeline | Front Desk Mode |

---

## P7 — Customer (public `/b`)

| Vertical | Flow type | Phone | Tablet | Desktop | Alt pattern |
|----------|-----------|-------|--------|---------|-------------|
| hair | Staff-forward book | Single col steps | 2-col services | Centered column | Shop Window |
| beauty | Treatment + staff | Same + patch gate | 2-col | Centered | Menu Steps |
| body-art | **Consult request** | Upload + age gate | 2-col refs | Centered | Text Liv |
| wellness | Session + room | Standard wizard | 2-col | Centered | Shop Window |
| fitness | Class book | Capacity chips | 2-col classes | Centered | Text Liv |
| medspa | Consult + consent | Consent inline | 2-col | Centered | Menu Steps |
| allied-health | Assessment slot | Intake short | 2-col | Centered | Shop Window |
| pet-grooming | Pet on profile | Pet picker step | 2-col | Centered | Shop Window |
| auto-detailing | Vehicle size package | Package cards | 2-col | Centered | Menu Steps |

**Rules:** Livia branding minimal; tenant logo + preset skin; locale footer from jurisdiction pack.

---

## Body-art reference flow (end-to-end)

Canonical example of business-first design — all personas, one vertical:

```text
P7 /b: Request consult → upload refs → age gate
  → P6: Proof desk approve sketch
  → P2: Pipeline moves to APPROVED → deposit
  → P4: Session day prep checklist
  → M2: Aftercare SMS (same thread)
```

Same flow in **all four presets**; only chrome changes (Studio Dark vs Platform Default).

---

## Implementation map

| Concern | File |
|---------|------|
| Persona routes | `artifacts/livia-dashboard/src/lib/persona-rituals.ts` |
| Vertical home module id | `lib/policy/src/vertical-ritual-homes.ts` *(Phase 6)* |
| Surface morph | `artifacts/livia-dashboard/src/components/layout/surface-adaptive/` |
| Mobile tabs | `artifacts/livia-mobile/app/(tabs)/` |
| Public flow | `artifacts/livia-dashboard/src/components/booking/`, `public-booking/` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-29 | Initial full matrix from UX working session |
