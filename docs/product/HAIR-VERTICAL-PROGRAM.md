# Hair vertical — platform program (V1)

**Status:** program complete · **execution:** Phase V1 heartland  
**Registry:** V1 · **heartland** · demo `luxe-salon-spa` (`owner-luxe@livia.io`)  
**Also:** `aurora-studio`, `conors-cut-co`, chain scenarios  
**Reads with:** [`vertical-playbooks/hair.md`](./vertical-playbooks/hair.md) · [`DOC-PROPAGATION-CASCADE.md`](../engineering/DOC-PROPAGATION-CASCADE.md)

---

## L0 — What Livia means for hair

Hair & barbering is Livia’s **origin wedge** (IE GTM) but the product is **people-business OS** — not “salon software” as a category ceiling.

| Principle | Hair expression |
|-----------|-----------------|
| **Physics** | Chair time, colour blocks, stylist preference, regulars memory |
| **Liv** | Reminders, pending confirms, inbox triage — never invents colour formulas |
| **Org** | Chair-rental: host must not see renter client PII |
| **Not** | Retail SKU warehouse; medspa consent stack |

**One sentence:** *Livia is the flight deck for a busy shop — who’s in the chair next, what needs confirming, and a `/b` link that books the right stylist at midnight.*

### Wow — operator

| Moment | Why it lands |
|--------|----------------|
| **Colour-day briefing** | Owner sees long blocks + pending deposits before doors open |
| **Deposit-backed calendar** | No-shows drop when colour services require pay-to-hold (industry norm 2026) |
| **Stylist-scoped memory** | Notes follow client across visits without front-desk oral handoff |
| **24/7 capture** | ~half of bookings happen outside hours — link-in-bio → `/b` |
| **Chair-rental firewall** | Renters run their book of business without host seeing PII |

### Wow — guest (P7)

| Moment | Why it lands |
|--------|----------------|
| **Pick your stylist** | Not anonymous “next available only” unless tenant wants it |
| **Book at 11pm** | Same skin as Instagram — **Luxe**, not Livia |
| **Visit token** | Tomorrow’s appointment: time, place, who, one-tap directions |
| **Reschedule link** | SMS → `/visit/{token}` — no account creation |

---

## L1 — Platform capability

| Layer | Status | Notes |
|-------|--------|-------|
| `VERTICAL_PACKS` / vocabulary | ✅ | client, stylist, chair |
| Booking guards | ✅ | hair-specific guards in `booking-guards.ts` |
| Guest surfaces | ✅ | storefront, visit, pay |
| Continuity SMS | ✅ | confirm + remind ladder |
| Wedge story | ✅ | `wedge-demo-stories.ts` hair beats |
| Chair-rental org | ✅ | lifecycle / membership patterns |

**Gaps:** service-level deposit rules UI; formula notes field prominence on client detail (R1.1).

---

## L2 — Presentation

Default preset: **`hair-warm-chair`** (`warm-chair` CSS). Alt: clean-salon, barber-bold, platform-default.

| Item | Status |
|------|--------|
| Web `data-presentation` | 🟡 warm-chair CSS added; full target PNGs pending |
| Settings + `/b` preview | ✅ mechanism shared |
| Demo Luxe preset on seed | ✅ via `applyDemoPublicBranding` |

---

## L3 — Personas

| Persona | Hair home |
|---------|-----------|
| Owner | Ritual dashboard — today’s colour weight, pending confirms |
| Manager | Approvals queue, floor bookings |
| Staff | **My Day** — next client + notes (P0 mobile uses Luxe) |
| Receptionist | Bookings + inbox |

---

## L4 — Surfaces

| Surface | Hair-specific |
|---------|----------------|
| W2 `/demo/wedge/hair` | ✅ |
| W4 `/dashboard`, `/bookings`, `/inbox` | ✅ density |
| W4 `/staff`, `/customers` | ✅ |
| W5 `/b/luxe-salon-spa` | ✅ P0 northstar uses bloom for some cards — **use Luxe for hair UAT** |
| W5 `/pay/:token` | ✅ deposits |

**Fine details**

- Long colour services: duration + buffer in service catalog  
- Walk-in: policy flag — do not promise walk-in queue in R1 unless seeded  
- Stylist preference on public book: optional step, not forced  
- SMS: three-touch ladder (confirm, 24h, 2h) per industry best practice  

---

## L5 — Demo & UAT

| Item | Value |
|------|-------|
| Canonical demo | `luxe-salon-spa` |
| Owner login | `owner-luxe@livia.io` |
| Founder UAT | [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md) Luxe section |

---

## L6 — CI

- `demo-live-day.spec.ts` — luxe  
- `public-booking-quality.spec.ts`  
- `all-verticals-smoke`  

---

## L7 — If Livia were 100% dedicated to hair (reasonable scope)

| Bet | Scope |
|-----|--------|
| Colour formula vault | Structured fields + photos — not AI formulation |
| Developer / bleach timing alerts | Service duration templates |
| Retail attach at checkout | R2 — inventory light |
| Instagram portfolio → `/b` hero | Brand import |
| No-show scoring | Policy-driven deposit suggestions |

**Out of scope:** POS inventory, payroll, competitor migration tools.

---

## L8 — Completion (heartland)

Founder **yes** on Luxe UAT + hair wedge + `/b` book with stylist step + mobile staff my-day smoke.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Full program doc |
