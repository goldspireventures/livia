# Vertical programs — master index

**Status:** canonical (2026-06-05)  
**Purpose:** One row per vertical — business meaning, wow thesis, demo, program doc, GTM wave.  
**GTM authority:** [`GTM-VERTICAL-DEPTH-PROGRAM.md`](./GTM-VERTICAL-DEPTH-PROGRAM.md) — **all nine code verticals, one parity bar**  
**Innovation:** [`VERTICAL-INNOVATION-PROGRAM.md`](./VERTICAL-INNOVATION-PROGRAM.md)  
**Propagation:** [`DOC-PROPAGATION-CASCADE.md`](../engineering/DOC-PROPAGATION-CASCADE.md) · `pnpm vertical:doc-check`  
**Build sequencing:** [`LIVIA-VERTICALS-BUILD-PLAN.md`](./LIVIA-VERTICALS-BUILD-PLAN.md)

---

## How to read this index

| Column | Meaning |
|--------|---------|
| **Doc ID** | `VERTICAL_COVERAGE_REGISTRY` row |
| **GTM Wave** | Wave 1 = founder GTM lock (same exit checklist per vertical) |
| **Program** | Full L0–L8 dissection (playbook = L2+L3 only) |
| **Wow (operator)** | What makes the owner say “damn” |
| **Wow (guest)** | What makes P7 say “oouuu” on `/b` |

**Rule:** Change policy/registry → update program doc + spokes → `pnpm vertical:doc-check`.

**Create seed:** All verticals — empty studio by default; optional **`starterPack`** on `POST /businesses` (beauty also seeds mini store). Hub: [`VERTICAL-STARTER-PACK.md`](../engineering/VERTICAL-STARTER-PACK.md).

**Excellence (what “complete” means):** [`vertical-excellence/README.md`](./vertical-excellence/README.md) — market research + honest gap audit + P0–P3 per vertical (wellness excluded from 2026-06-03 pass).

---

## Code verticals (ship in product today)

| Doc | Vertical | GTM | Demo slug | Program | Operator wow | Guest wow |
|-----|----------|-----|-----------|---------|--------------|-----------|
| V1 | Hair & barbering | **Wave 1** | `luxe-salon-spa` | [HAIR](./HAIR-VERTICAL-PROGRAM.md) | Colour-day flight plan; stylist-scoped book; chair-rental firewall | Subdomain book; `/my` visit; rebook same stylist |
| V2 | Beauty (full aisle) | **Wave 1** | `bloom-beauty-dublin` | [BEAUTY](./BEAUTY-VERTICAL-PROGRAM.md) · [Innovation](./BEAUTY-INNOVATION-PROGRAM.md) | Inbox-first; fill cycle; patch-test per service; all sub-segments | Subdomain book; vertical memory; fill vs full |
| V3 | Wellness & spa | **Wave 1** | `harbour-wellness-cork` | [WELLNESS](./WELLNESS-VERTICAL-PROGRAM.md) · [North star](./WELLNESS-NORTHSTAR-PROGRAM.md) | Room board + package ledger + couples | Package on `/my`; session grid; gift credit |
| V4 | Body art | **Wave 1** | `ink-anchor-galway` | [BODY-ART](./BODY-ART-VERTICAL-PROGRAM.md) | Proof desk; pipeline; deposit binds slot | Proof on `/my`; healing check-in |
| V5 | Fitness | **Wave 1** | `peak-fitness-dublin` | [FITNESS](./FITNESS-VERTICAL-PROGRAM.md) | Class waitlist promote; pack decrement | Waitlist SMS; pack on `/my` |
| V6 | Medspa | **Wave 1** | `clarity-medspa-dublin` | [MEDSPA](./MEDSPA-VERTICAL-PROGRAM.md) | Consent queue zero; mandate hub | Intake + e-sign; calm clinic brand |
| V7 | Allied health | **Wave 1** | `motion-physio-cork` | [ALLIED-HEALTH](./ALLIED-HEALTH-VERTICAL-PROGRAM.md) | Plan cadence; assessment types | Prep SMS; follow-up from `/my` |
| V10 | Pet grooming | **Wave 1** | `paws-parlour-dublin` | [PET-GROOMING](./PET-GROOMING-VERTICAL-PROGRAM.md) | Pet-scoped day; temperament | Book Biscuit; pet card on `/my` |
| V-AD | Automotive detailing | **Wave 1** | `shine-studio-belfast` | [AUTOMOTIVE](./AUTOMOTIVE-DETAILING-VERTICAL-PROGRAM.md) | Bay board; vehicle continuity | Vehicle on `/my`; drop-off flow |

**Market shop (locale pack):** `copenhagen-havn-wellness` — wellness program + DK copy; see [WELLNESS](./WELLNESS-VERTICAL-PROGRAM.md) § Market.

---

## Partner / defer (honest — no pretend full stack)

| Doc | Label | Tier | Pack | Doc |
|-----|-------|------|------|-----|
| V8 | Dental | partner-only | allied-health | [PARTNER-ADJACENT](./PARTNER-AND-ADJACENT-VERTICALS.md) § Dental |
| V9 | Mental health | partner-only | wellness | [PARTNER-ADJACENT](./PARTNER-AND-ADJACENT-VERTICALS.md) § Mental health |
| V11 | Adjacent solo | defer | hair | [PARTNER-ADJACENT](./PARTNER-AND-ADJACENT-VERTICALS.md) § Adjacent |

---

## Ring 2 — documented before build

See [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) §3 and [PARTNER-ADJACENT](./PARTNER-AND-ADJACENT-VERTICALS.md) § Ring 2.

| Doc | Vertical | Tier | Program | Platform primitive |
|-----|----------|------|---------|-------------------|
| V12 | Event vendors & decor | **Ring 2** | [EVENT-VENDORS](./EVENT-VENDORS-VERTICAL-PROGRAM.md) | [CONSULT-FIRST-WORKFLOW](./CONSULT-FIRST-WORKFLOW-SPEC.md) |

**Active design partner:** solo event-decor operator — enquire → quote → booked (IG/WhatsApp leads).

---

## Playbooks (L2+L3 quick reference)

[`vertical-playbooks/README.md`](./vertical-playbooks/README.md) — links screen cards only; **program docs are authority** for completion.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-10 | V12 event vendors Ring 2 program + consult-first workflow spec; design-partner scope |
| 2026-06-05 | GTM Wave 1 lock — nine verticals one bar; innovation program; subdomain + `/my` |
| 2026-06-01 | Full vertical program set + build plan |
| 2026-06-03 | Vertical excellence specs (all code verticals except wellness) |
