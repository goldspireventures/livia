# Livia — appointment-business platform (not salon-only)

**Status:** canonical product framing (2026-05-22) · updated 2026-05-31  
**Category authority:** [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md)

## What we build

**One OS** for any business that runs on **appointments + people + conversations + policy**:

| Vertical | Examples | Liv vocabulary |
|----------|----------|----------------|
| `hair` | Salon, barbershop | Client, service, shop |
| `beauty` | Nails, lashes, brows | Client, treatment, studio |
| `body-art` | Tattoo, piercing | Client, session, studio |
| `wellness` | Massage, holistic | Guest, session, studio |
| `fitness` | PT, pilates | Member, session, studio |
| `medspa` | Aesthetics clinic | Patient, treatment, clinic |
| `allied-health` | Physio, dental hygiene | Patient, appointment, practice |

**Code source of truth:** `lib/policy/src/verticals.ts` + `lib/policy/src/vocabulary.ts`  
**UI:** `verticalPackUi()` in dashboard and mobile (imports `businessVocabulary`).

## Architecture rules

1. **Never hardcode "salon"** in tenant product copy — use `businessVocabulary()` or neutral "business / location / shop".
2. **Routes are the same** for every vertical; only data packs, policy, and copy change.
3. **Onboarding** must ask vertical (already in web + mobile wizards).
4. **Demo world** includes multiple verticals: `bloom-beauty-dublin`, `harbour-wellness-cork`, `ink-anchor-galway` + hair/barber shops.
5. **Live feel:** `ensureLiveDayForBusiness` + `POST /api/businesses/:id/simulate-live-day` for empty calendars.

## Demo public booking URLs

After `POST /api/demo/provision`:

- `/b/aurora-studio` — hair
- `/b/conors-cut-co` — barber
- `/b/bloom-beauty-dublin` — beauty
- `/b/harbour-wellness-cork` — wellness
- `/b/ink-anchor-galway` — body-art

## What is still wedge-scoped (honest)

- **Voice locale** v1: English-IE first (not every EU language day one).
- **Liv tool registry** still growing — OS spec in `LIV-OPERATING-SYSTEM.md`.
- **Medspa / allied-health** adjacency — policy packs exist; counsel for clinical claims stays G3.

Salon is a **wedge vertical**, not the **product definition**.
