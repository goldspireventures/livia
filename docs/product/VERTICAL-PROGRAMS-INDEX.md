# Vertical programs — master index

**Status:** canonical (2026-06-01)  
**Purpose:** One row per vertical — business meaning, wow thesis, demo, program doc, tier.  
**Propagation:** [`DOC-PROPAGATION-CASCADE.md`](../engineering/DOC-PROPAGATION-CASCADE.md) · `pnpm vertical:doc-check`  
**Build sequencing:** [`LIVIA-VERTICALS-BUILD-PLAN.md`](./LIVIA-VERTICALS-BUILD-PLAN.md)

---

## How to read this index

| Column | Meaning |
|--------|---------|
| **Doc ID** | `VERTICAL_COVERAGE_REGISTRY` row |
| **Tier** | GTM honesty — not engineering completeness |
| **Program** | Full L0–L8 dissection (playbook = L2+L3 only) |
| **Wow (operator)** | What makes the owner say “damn” |
| **Wow (guest)** | What makes P7 say “oouuu” on `/b` |

**Rule:** Change policy/registry → update program doc + spokes → `pnpm vertical:doc-check`.

---

## Code verticals (ship in product today)

| Doc | Vertical | Tier | Demo slug | Program | Operator wow | Guest wow |
|-----|----------|------|-----------|---------|--------------|-----------|
| V1 | Hair & barbering | heartland | `luxe-salon-spa` | [HAIR](./HAIR-VERTICAL-PROGRAM.md) | Colour-day flight plan; deposit-backed calendar; chair-rental privacy | Book favourite stylist at 11pm; one-tap reschedule; visit page with name + time |
| V2 | Beauty & nails | heartland | `bloom-beauty-dublin` | [BEAUTY](./BEAUTY-VERTICAL-PROGRAM.md) | Inbox-first lash/DM triage; patch-test discipline without spreadsheets | Studio-branded `/b`; fill-cycle reminders; no account wall |
| V3 | Wellness & spa | beta-full | `harbour-wellness-cork` | [WELLNESS](./WELLNESS-VERTICAL-PROGRAM.md) | Room utilisation + voucher liability in one calm home | Gift-ready packages; quiet booking; visit prep for couples rooms |
| V4 | Body art | beta-full | `ink-anchor-galway` | [BODY-ART](./BODY-ART-VERTICAL-PROGRAM.md) | Proof approve desk; deposit binds slot; consult→session pipeline | Approve design on phone; pay deposit once; healing SMS link |
| V5 | Fitness | beta-full | `peak-fitness-dublin` | [FITNESS](./FITNESS-VERTICAL-PROGRAM.md) | Class fill + waitlist auto-notify; PT block utilisation | Join waitlist in two taps; clear class vs PT path |
| V6 | Medspa | beta-full | `clarity-medspa-dublin` | [MEDSPA](./MEDSPA-VERTICAL-PROGRAM.md) | Consent queue before clinical time; mandate hub | Consent on book; deposit; calm clinic brand |
| V7 | Allied health | beta-full | `motion-physio-cork` | [ALLIED-HEALTH](./ALLIED-HEALTH-VERTICAL-PROGRAM.md) | Plan rebook cadence; audit-friendly notes | Assessment vs follow-up clarity; prep SMS |
| V10 | Pet grooming | beta-full | `paws-parlour-dublin` | [PET-GROOMING](./PET-GROOMING-VERTICAL-PROGRAM.md) | Pet-scoped day; temperament visible at chair | Book **Biscuit** not just owner; handling notes |
| V-AD | Automotive detailing | beta-full | `shine-studio-belfast` | [AUTOMOTIVE](./AUTOMOTIVE-DETAILING-VERTICAL-PROGRAM.md) | Bay utilisation; vehicle continuity on return | Package picker; drop-off visit instructions |

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

---

## Playbooks (L2+L3 quick reference)

[`vertical-playbooks/README.md`](./vertical-playbooks/README.md) — links screen cards only; **program docs are authority** for completion.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Full vertical program set + build plan |
