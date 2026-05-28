# Vertical product model

Livia is **one platform** with **vertical packs** — not one salon UI copy-pasted everywhere.

## Layers

| Layer | What it is |
|-------|------------|
| **Core** | Bookings, inbox, customers, staff, settings — shared engine |
| **Vertical pack** | Vocabulary (Patient vs Client), nav labels, Liv tone, booking guards (`@workspace/policy`) |
| **Vertical routes** | Extra screens when needed: `/medspa`, `/classes`, `/day-packages`, `/design-proofs` |
| **Demo seed** | Inbox + services + copy per vertical so previews feel honest |

## What changes per vertical today

- Sidebar: **Patients / Clinicians / Appointments** for allied-health; salon keeps Customers / Team / Bookings
- **Brands** hidden unless you own 2+ locations
- **Clinical hub** only for medspa; **Classes** only for fitness; **Care programmes** for allied-health + wellness
- Demo inbox threads use vertical-appropriate summaries (no balayage on a physio practice)

## What we still owe (product)

- Dedicated allied-health **Today** and **patient chart** flows (not only relabels)
- Hide salon-only rituals (e.g. colour consult pending reasons) per vertical in forms
- Onboarding path that seeds the right vertical pack on first signup
- Public booking + mobile **vertical themes** (web tokens live Phase A; B2C skin Phase B)

## Business-ready documentation

Operators: [`../business/OPERATOR-READY-PACK.md`](../business/OPERATOR-READY-PACK.md) and [`../business/templates/`](../business/templates/) (policies, leave, running late, team invite).

## How to test

See [TEST-EVERY-BUSINESS.md](./TEST-EVERY-BUSINESS.md) — open each business as owner from `/demo`, then walk inbox, staff detail, patients.
