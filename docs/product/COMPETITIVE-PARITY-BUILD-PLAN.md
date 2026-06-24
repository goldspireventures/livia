# Competitive parity — build plan

**Status:** canonical execution plan (2026-06-21)  
**Program:** [`COMPETITIVE-PARITY-PROGRAM.md`](./COMPETITIVE-PARITY-PROGRAM.md)  
**Policy hub:** `lib/policy/src/competitive-parity.ts`

This plan closes the gap between **incumbent table stakes** and **Livia 100×** — per vertical, subvertical, and org shape. Work is ordered so activation (first book) never regresses.

---

## Phase 0 — Foundation (shipped 2026-06-21)

| # | Deliverable | Surfaces |
|---|-------------|----------|
| 0.1 | `import-formats.ts` — CSV detect + normalize | policy |
| 0.2 | `integration-catalog.ts` — generic integration labels | policy → API → Settings |
| 0.3 | `competitive-parity.ts` — capability matrix + score | policy → API |
| 0.4 | Universal CSV import (clients, services, staff, appointments) | API + Settings + onboarding `a11` |
| 0.5 | Magic setup bundle (`POST …/import/magic-setup`) | API + onboarding + Settings UI |
| 0.5b | Incumbent migration atlas + fast-track onboarding | policy + docs + web/mobile |
| 0.6 | Onboarding side-effects (auto-complete acts on import) | API |
| 0.7 | Event vendors in vertical E2E matrix | demo + e2e |
| 0.8 | E2E `universal-import-api.spec.ts` | e2e |

**Gate:** `pnpm run typecheck` · import E2E green · no vendor names in owner UI

---

## Phase 1 — Table stakes closure (all verticals, 2–4 weeks)

Goal: any owner from any incumbent category can **book, pay deposit, get reminded** on day one.

| # | Work | Verticals |
|---|------|-----------|
| 1.1 | SMS reminder cadence (not email-only) | all |
| 1.2 | Per-service deposit rules UI | beauty, hair, medspa |
| 1.3 | Per-service patch-test flag + profile expiry | beauty, hair |
| 1.4 | Fill vs full set service kind + rebook interval | beauty |
| 1.5 | 1:1 appointment waitlist + cancel promote | all appointment verticals |
| 1.6 | Package/membership consumption UI polish | fitness, wellness |
| 1.7 | Sub-2-min book perf budget on `/book` | all |
| 1.8 | Mobile owner import parity | mobile onboarding `a11` |

**Org-shape notes:**

- **Solo:** prioritize voice + WhatsApp book (1.9 below)
- **Studio:** staff assignment on import + roster CSV
- **Chain:** location picker on public book (existing) + rollup smoke

---

## Phase 2 — Wedge (channels + memory, 4–8 weeks)

| # | Work | Impact |
|---|------|--------|
| 2.1 | WhatsApp book happy path (4–6 messages) | beats solo_scheduling |
| 2.2 | Instagram DM thread → inbox → book | beauty, hair |
| 2.3 | Client preference fields per vertical pack | memory wedge |
| 2.4 | Fill-cycle / rebook nudges (consent-gated) | beauty, hair |
| 2.5 | Waitlist SMS promote on cancel | revenue recovery |
| 2.6 | Guest `/my` relationship modules all verticals | guest wow |
| 2.7 | OAuth scheduling API import (generic) | migration |
| 2.8 | Parallel-run diff dashboard | switching anxiety |

---

## Phase 3 — Differentiators (8–16 weeks)

| # | Work |
|---|------|
| 3.1 | Liv voice receptionist (IE English first) |
| 3.2 | Liv R2 autonomous book in DM (policy audit) |
| 3.3 | Chair-rental host + renter onboarding |
| 3.4 | Chain intelligence rollup v2 |
| 3.5 | Cross-tenant benchmarks (k≥10 privacy floor) |
| 3.6 | Custom domain on guest book subdomain |

---

## Per-vertical build slices

Each slice lists **incumbent categories to beat**, **P0 shippables**, and **org-shape focus**.

### Hair & barbering

- **Beat:** salon_suite, solo_scheduling, marketplace_booking
- **P0:** stylist-scoped book, colour formula notes, walk-in queue, CSV import
- **Solo:** mobile buffer, voice after-hours
- **Studio:** senior-with-admin role, rota publish
- **Chain:** cross-shop stylist preference (read-only guest)

### Beauty (full aisle)

- **Beat:** solo_scheduling (primary), salon_suite
- **P0:** fill vs full, patch-test profile, category menu, deposit rules, CSV import
- **Subverticals:** lash (fill cycle), nail (combo services), wax (contraindication), PMU-light (consent depth)
- **Solo/mobile:** travel buffer, DM-first onboarding

### Wellness & spa

- **Beat:** solo_scheduling, salon_suite
- **P0:** room board, couples slot, package ledger, gift credit on `/my`
- **Chain:** day-spa package orchestration

### Body art

- **Beat:** solo_scheduling, consult_first_vendor
- **P0:** design proof desk, deposit binds slot, healing cadence
- **Studio:** artist pipeline, age gate

### Fitness

- **Beat:** fitness_studio
- **P0:** class capacity, waitlist promote (exists — polish), pack decrement
- **PT solo:** 1:1 block book + pack

### Medspa

- **Beat:** clinical_aesthetics, salon_suite
- **P0:** consent queue, intake e-sign, calm clinic preset
- **Compliance:** counsel gate on claims — no diagnosis copy

### Allied health

- **Beat:** solo_scheduling, clinical_aesthetics (lite)
- **P0:** plan cadence, assessment types, prep SMS — not full EHR

### Pet grooming

- **Beat:** salon_suite, solo_scheduling
- **P0:** pet card, temperament, vaccination note, mobile route buffer

### Automotive detailing

- **Beat:** solo_scheduling, horizontal_pos
- **P0:** vehicle on `/my`, bay board, drop-off flow

### Event vendors (Ring 2 — active)

- **Beat:** consult_first_vendor, solo_scheduling
- **P0:** enquire → quote → book, event-site, `/event-site` editor
- **Onboarding:** `a3` menu not hours; first quote = sacred metric variant

---

## Org-shape program

| Shape | Onboarding path | Migration | Liv posture |
|-------|-----------------|-----------|-------------|
| C1–C2 Solo | Self-serve 30–60 min | CSV magic setup | Voice + DM |
| C4 Owner+staff | Hybrid 2 weeks | CSV + concierge API | Inbox + floor |
| C5+ With manager | Concierge | Parallel run | Manager briefing |
| C10 Chair host | Concierge | Per-renter import | Host firewall |
| C7+ Chain | Concierge 4–6 wk | Staged per location | Rollup cockpit |

Reference: [`journeys/onboarding-paths.md`](../journeys/onboarding-paths.md)

---

## Integration rollout (generic)

| Priority | Integration kind | Mode | Owner experience |
|----------|------------------|------|------------------|
| P0 | Client/menu/team/appointment CSV | Self-serve | Paste in onboarding or Settings |
| P1 | Card payments | Stripe Connect | Wizard act `a9` |
| P1 | WhatsApp / SMS | Meta + Twilio | Act `a7` |
| P2 | Calendar OAuth | Google | Staff availability sync |
| P2 | Scheduling API read | Platform key | Concierge + auto poll |
| P3 | Accounting export | CSV / OAuth | Weekly settlement |
| P3 | Email marketing events | Webhook | Package expiring |

Catalog: `integration-catalog.ts` — labels never name vendors.

---

## Verification gates

Before claiming parity for a vertical:

```bash
pnpm run typecheck
pnpm vertical:check
pnpm propagation:check
pnpm test:e2e:verticals          # all demo verticals incl. event-vendors
pnpm --filter @workspace/e2e exec playwright test universal-import-api.spec.ts
```

Founder: walk `/onboarding` → `a11_migration` → paste sample CSV → confirm services/clients appear → public book → first deposit.

---

## Metrics

| Metric | Target |
|--------|--------|
| Parity score (`competitive-parity` API) | ≥85% table stakes shipped per vertical |
| Time to first book (with import) | <30 min owner wall time |
| Migration completion | ≥1 CSV kind imported in onboarding session |
| Vertical E2E smoke | 10/10 verticals green |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-21 | Initial build plan — Phase 0 shipped, Phases 1–3 sequenced |
