# Geographic expansion — F9

**Status:** F9 (2026-05-07).

## Sequence

**Ireland (Dublin → Cork → Galway → nationwide) → UK → Nordics → DACH → France → Iberia.**

Each gate has language, currency, payments, regulatory, and competitive implications. Sequence is chosen to maximise wedge depth before we dilute focus.

| Gate | Trigger | Year (target) | Why |
|---|---|---|---|
| 1. Ireland (Dublin) | Design-partner programme launch | 2026 H2 | Home market; Founder network; English-IE wedge. |
| 2. Ireland (nationwide) | 100 paying customers in Dublin | 2027 H1 | Same locale; same regulatory; proven wedge. |
| 3. UK (London → Manchester → Glasgow) | 250 paying IE customers; UK localisation ready | 2027 H2 | Same language (close enough); largest near-market; same Phorest dominance to displace. |
| 4. UK (nationwide) | 500 UK + 500 IE customers | 2028 | Continuation. |
| 5. Nordics (Stockholm → Copenhagen → Oslo → Helsinki) | UK proven; Nordic localisation | 2028–2029 | Tech-sophisticated market; English fluency high; Aurora aesthetic resonates. |
| 6. DACH (Berlin → Munich → Zurich → Vienna) | Nordics proven; German Liv voice work | 2029 | Largest EU market; dental/medspa expansion lever. |
| 7. France (Paris → Lyon → Marseille) | DACH proven; French Liv voice work | 2030 | Premium beauty market; brand-aware customers. |
| 8. Iberia (Madrid → Barcelona → Lisbon) | France proven; ES + PT voice | 2030 | Hair + beauty volume; Treatwell-displacement opportunity. |

## Localisation depth per market

**Liv's voice in French is not Liv's voice in English with a translation layer.** Per ADR 0008 and the brand-of-Liv work, Liv's character must be re-cast per language with a native-speaker character lead. The cost is real (≥€60k/locale to do well) and we plan for it.

| Locale layer | Approach |
|---|---|
| **UI strings** | i18n; managed translation pipeline. |
| **Liv text voice** | Per-locale character lead + style guide + golden corpus. NOT machine translation. |
| **Liv voice (audio)** | Per-locale TTS provider selection + voice casting + accent preferences (e.g., RP vs Estuary in UK; Hochdeutsch vs Schwyzerdütsch in CH-DE). |
| **Cultural register** | Per-locale "Tuesday morning briefing" tone calibration with design partners in market. |
| **Currency, dates, phone formats** | Standard i18n. |
| **Regulatory** | Per-market section in `regulatory-and-legal.md`. |
| **Payments** | Stripe per-country support; payout currencies; per-country VAT. |

## Per-market competitive map (one-liner each)

| Market | Dominant incumbent | Their weakness we exploit |
|---|---|---|
| **Ireland** | Phorest | Voice; mobile-first; chair-rental; under-35 owner; multi-brand. |
| **UK** | Phorest, Treatwell, Fresha | Voice; multi-shop without marketplace cut; Senior-w-admin role. |
| **Nordics** | Bokadirekt (SE), Easypractice (DK), Booksy (general) | Voice in local language; per-character agent; pan-Nordic chain support. |
| **DACH** | Treatwell (some), Fresha, local incumbents (Salonkee, Shore) | Voice in German; medspa-friendly posture; chair-rental hosts. |
| **France** | Treatwell-FR (strong); Planity | Customer-belongs-to-salon; non-marketplace; per-character voice. |
| **Iberia** | Treatwell, Fresha; local incumbents | Voice in ES/PT; small-chain Founder support. |

## Per-market gating questions

Before opening any new market, we answer:

1. **Is there a local design-partner cohort?** (≥3 partners pre-committed.)
2. **Is the Liv voice for this locale ready to ship at quality?** (Character lead + golden corpus + 200-case eval set.)
3. **Are the regulatory + payments + currency prerequisites done?**
4. **Does the closest incumbent leave a wedge ≥€20k/yr per cell?** (Per F6 economics framework, applied per market.)
5. **Do we have the ops capacity to support the cohort without dropping IE/UK quality?**

If any answer is no, we don't open. Patience is a feature.

## What we explicitly don't do

- **No US expansion** in the 5-year plan. EU-anchored is part of the brand. US incumbents (Square, Mindbody, Vagaro, Booksy) own that geography; we don't dilute.
- **No emerging-market expansion** (LATAM, MENA, APAC). Same reasoning — focus.
- **No vertical-led expansion that bypasses geographic readiness.** We don't open Berlin medspas before Berlin hair salons just because medspas pay more.

## What this earns us

A defensible expansion sequence where each gate funds the next; Liv stays Liv (not a translated chatbot); the brand stays European; the focus stays narrow long enough to be deep.

## Open questions

- Should we open Ireland → UK at customer 100 instead of 250? (Watch design-partner velocity; revisit Q3.)
- Nordics-first vs UK-first — is the Nordic tech-sophistication advantage worth jumping the language-adjacency? (Currently no; revisit if UK proves harder than expected.)
