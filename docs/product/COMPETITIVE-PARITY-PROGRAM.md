# Competitive parity program

**Status:** canonical (2026-06-21)  
**Audience:** founder, product, engineering, GTM, agents  
**Policy hub:** `lib/policy/src/competitive-parity.ts` · `integration-catalog.ts` · `import-formats.ts`  
**Build sequencing:** [`COMPETITIVE-PARITY-BUILD-PLAN.md`](./COMPETITIVE-PARITY-BUILD-PLAN.md)

---

## Purpose

Livia must **match table-stakes** capabilities of incumbent scheduling and salon-suite tools, **exceed** them on wedge features (channels, memory, recovery), and **own** differentiators (Liv operator, guest vault, EU posture) — across **all ten code verticals** and **every org shape** (solo → chain).

This document uses **generic incumbent categories** only. No third-party product names appear in policy exports, platform UI, or owner-facing copy.

---

## Incumbent categories (research taxonomy)

| Category | Typical operator | What they optimize for | Where they win | Where they stall |
|----------|------------------|------------------------|----------------|------------------|
| **solo_scheduling** | Solo pro, mobile artist | Deposits, intake, self-book, low price | Fast setup, policy enforcement, forms | No salon depth, no DM book, no memory |
| **salon_suite** | 2–20 staff salon/spa | POS, staff, inventory, commissions | Multi-staff, retail, reports | Chair-rental, voice, conversation marketing |
| **marketplace_booking** | Discovery-led shops | New clients via marketplace | Consumer app, SEO | Customer ownership, margin, brand |
| **fitness_studio** | Class + PT studio | Capacity, packs, waitlist | Class roster, memberships | Non-fitness verticals |
| **clinical_aesthetics** | Medspa, injectables | Consent, intake, compliance | Clinical gates | Beauty-only studios, price |
| **horizontal_pos** | Cross-vertical solo | Payments + book in one | POS integration | Vertical ritual, EU depth |
| **consult_first_vendor** | Event decor, creative | Enquire → quote → book | Quote workflow | Appointment-only businesses |

Research basis: 2026 owner surveys, review aggregation, and vertical excellence audits (`docs/product/vertical-excellence/`). Categories map to ~10 product archetypes per vertical without naming vendors.

---

## Livia parity model

```text
Table stakes  → match incumbents (book, pay, remind, menu, staff)
Wedge         → exceed incumbents (waitlist, memory, import, multi-shape)
Differentiator → own category (Liv channels, voice, vault, audit, EU)
```

**Score API:** `GET /api/businesses/{id}/competitive-parity` returns gap list + `scorePercent` from policy hub.

---

## Vertical × incumbent landscape

| Vertical | Primary incumbent categories | Sacred metric |
|----------|------------------------------|---------------|
| Hair & barbering | salon_suite, solo_scheduling, marketplace_booking | First book + stylist continuity |
| Beauty (full aisle) | solo_scheduling, salon_suite | Deposit book + fill-cycle memory |
| Wellness & spa | solo_scheduling, salon_suite, fitness_studio | Package ledger + room board |
| Body art | solo_scheduling, consult_first_vendor | Proof sign-off + deposit binds slot |
| Fitness | fitness_studio, solo_scheduling | Class waitlist + pack decrement |
| Medspa | clinical_aesthetics, salon_suite | Consent queue zero |
| Allied health | solo_scheduling, clinical_aesthetics | Plan cadence + prep SMS |
| Pet grooming | salon_suite, solo_scheduling | Pet profile + temperament |
| Automotive detailing | solo_scheduling, horizontal_pos | Vehicle continuity + bay board |
| Event vendors | consult_first_vendor, solo_scheduling | Enquire → quote → booked |

---

## Org-shape overlays

| Shape | Code tier | Extra parity requirements |
|-------|-----------|---------------------------|
| Solo | `solo` | Voice receptionist, magic CSV import, sub-2-min book |
| Owner + staff | `studio` | Multi-staff calendar, team import, inbox |
| Chair-rental host | `chair-host` | Renter data isolation, host rollup |
| Small chain | `chain` | Cross-location rollup, staged migration |
| Mid chain / franchise | `mid-chain`, `franchise` | Franchise rollup, policy inheritance |

Subvertical profiles (`lib/policy/src/subvertical-profiles.ts`) refine starter packs — lash vs nail vs mobile — without code forks.

---

## Capability matrix (summary)

Full list: `PARITY_CAPABILITIES` in `competitive-parity.ts`.

| Tier | Examples | Livia target |
|------|----------|--------------|
| Table stakes | self-book, deposits, reminders, multi-staff, CSV import | Match or exceed UX |
| Wedge | waitlist recovery, client memory, API migration, chair-rental | Ship per vertical program |
| Differentiator | DM/WhatsApp book, voice Liv, guest vault, EU GDPR | Own — not incumbent scope |

---

## Migration & magic setup

Owners switching tools need **zero manual re-entry**:

1. Paste CSV (clients, menu, team, appointments) — auto column detect (`import-formats.ts`)
2. Optional magic bundle during onboarding act `a11_migration`
3. Liv marks `a3_service_menu`, `a4_team`, `migrationImported` checklist
4. OAuth/API paths via generic integration catalog (platform-configured)

**Self-serve today:** all four CSV import kinds + Stripe + WhatsApp channels.  
**Platform connect:** scheduling API, salon-suite API, accounting OAuth — env-gated.

---

## Subvertical research depth (beauty example)

Beauty aisle sub-segments and incumbent gaps are documented in [`vertical-excellence/beauty.md`](./vertical-excellence/beauty.md). The same pattern applies to all vertical excellence specs:

- Sub-segment physics (unit, rhythm, failure modes)
- Operator day timeline
- Client journey expectations (2026)
- Honest repo audit + P0–P3 closure list

---

## Marketing & internal surfaces

- Marketing (`livia.io`): category claims only — people-business OS, not vendor comparisons
- Internal ops: competitive parity score per demo tenant via API
- No vendor names in UI strings — enforced by copy review + `migration-brokers-ui.ts` generic catalog

---

## Authority & updates

When shipping a parity capability:

1. Update `CAPABILITY_SHIP_STATUS` in `competitive-parity.ts`
2. Update vertical program doc § changelog
3. Update excellence spec § implementation status
4. Run `pnpm capability:check` + `pnpm vertical:doc-check`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Initial program — generic taxonomy, policy hub, universal CSV import, parity score API |
