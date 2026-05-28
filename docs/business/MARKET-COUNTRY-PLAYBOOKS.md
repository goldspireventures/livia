# Market & country playbooks — who we serve, how Liv wins

**Status:** Canonical (2026-05-26)  
**Audience:** founder, product, GTM, engineering  
**Code truth:** `@workspace/policy` → `JURISDICTION_PACKS`, `resolveChannelPack`, `resolvePolicies`  
**Execution:** [`../product/OPERATION-SOLIDIFY.md`](../product/OPERATION-SOLIDIFY.md)

---

## How to use this doc

Livia is **cross-border by design**. Every business row carries `country`, `currency`, `locale`, `timezone`; Liv reads **`resolvePolicies(tenant)`** — not hardcoded `if (Ireland)`.

This file answers, **per jurisdiction**:

1. **Who** we target first (configuration × vertical).  
2. **Which channels** customers and owners actually use.  
3. **Why** Livia beats incumbents *in that market*.  
4. **How** new vs experienced operators need different support.  
5. **What engineering must honour** (policy pack + channels + holidays + disclosure).

When product or marketing disagrees with code, **`lib/policy` wins** after an RFC.

---

## Operator maturity axis (all countries)

| Segment | Profile | Livia / Liv must deliver |
|---------|---------|-------------------------|
| **New / solo starter** | First chair, side-hustle, scared of tech | Guided onboarding acts, plain copy, “first booking in 10 minutes”, Liv explains next step, mobile-first |
| **Working owner** | 2–6 staff, still on the floor | Today + inbox + voice/WA recovery, quick book on phone, no spreadsheet |
| **Mature owner + manager** | 8–20 staff, front desk | Rota, approvals, policy editor, audit, peer insights |
| **Founder / multi-site** | 2–5 locations or brands | Chain Glance, one login, portfolio Liv line, cross-shop alerts |
| **Chair-host / franchise** | Renters or franchisees | Host rent, franchise links, separate tenant boundaries |

Same binary: **R1–R2** for new starters (Liv asks more); **R3** for mature shops (Liv acts inside policy).

---

## Channel matrix (policy-driven)

From `lib/policy/src/channels.ts` — UI and onboarding **must** only offer channels where `resolveChannelPack(jurisdiction)` is true. Production guards hide WhatsApp without BSP credentials.

| Jurisdiction | SMS | Web chat | WhatsApp | Instagram | Messenger | Voice (v1) |
|--------------|-----|----------|----------|-----------|-----------|------------|
| **IE** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ IE regulatory |
| **GB** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DE** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 DE number |
| **ES** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| **IT** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| **NL** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| **PL** | ✅ | ✅ | ✅ | — | ✅ | 🟡 |
| **FR** | ✅ | ✅ | ✅* | ✅* | ✅* | 🟡 |
| **SE / DK / NO / FI** | ✅ | ✅ | 🟡 expand | 🟡 | 🟡 | v1.5 |

\*FR channel flags aligned in policy (2026-05-26); Meta provisioning still per-tenant.

**v1 build rule:** WhatsApp + Instagram + Messenger are **product-complete** (webhook, inbox, disclosure, continuity). If BSP not configured, UI shows **“Connect in Settings”** — never silent failure or marketing lie.

---

## Country playbooks

### Ireland (IE) — wedge & proof market

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P0** — Gate 2, design partners, “ten Dublin shops” |
| **Target businesses** | C2 solo barber/hair; C4 owner+staff salon; C7 Aurora-scale 2–5 shop founder |
| **Top verticals** | Hair, barber, beauty, nails, wellness, tattoo |
| **Owner channels** | WhatsApp-heavy owners; SMS fallback; voice for after-hours |
| **Customer channels** | IG DMs (beauty), WhatsApp (younger), SMS (rural), voice (50+) |
| **Incumbents** | Phorest, Booksy, Square, pen-and-paper |
| **Liv wedge** | Answers phone; one inbox; Irish-English tone; audit trail |
| **New starter** | Conor archetype — Liv is the team; onboarding to first real booking |
| **Experienced** | Manager + seniors — rota, borrow staff, peer insights |
| **Regulatory** | DPC, CCPC; EU AI Act disclosure; Twilio IE number |
| **Sub-locales** | Dublin urban vs rural (voice + degraded mode) — see `modality-and-locale-overview.md` |

### United Kingdom (GB)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** — post–Gate 2 expansion |
| **Target** | C4/C5 single-shop; London multi-cultural staff; chair-rental pockets |
| **Verticals** | Hair, barber, beauty, medspa (counsel), physio |
| **Channels** | WhatsApp + SMS; IG strong in beauty |
| **Incumbents** | Fresha, Phorest, Timely, Treatwell ecosystem |
| **Liv wedge** | PECR-aware SMS; UK disclosure copy in pack; GBP native |
| **New starter** | Mobile-first; GDPR + UK GDPR same posture |
| **Experienced** | Multi-site founders near M25 |

### Germany (DE)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** |
| **Target** | C2–C5; **Kosmetik** studios; barber; wellness |
| **Channels** | **WhatsApp default**; formal DE continuity templates exist in policy |
| **Incumbents** | Shore, Timify, local Buchungssystem |
| **Liv wedge** | Formal Sie tone in DE pack; holiday calendar DE; data residency story |
| **New starter** | High trust bar — clear AGB + AI disclosure in German |
| **Experienced** | Appointment density; strict cancel windows |

### France (FR)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** |
| **Target** | Beauty institutes, hair, nails, spa |
| **Channels** | IG + Messenger; WhatsApp growing in beauty |
| **Incumbents** | Planity, Treatwell |
| **Liv wedge** | FR disclosure + booking terms in pack; salon politeness in Liv tone |
| **Note** | Planity strong — win on **colleague + continuity**, not calendar alone |

### Spain (ES) & Italy (IT)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** |
| **Target** | Beauty, hair, barber, tattoo |
| **Channels** | **WhatsApp essential** — customer expectation |
| **Incumbents** | Fresha, local players |
| **Liv wedge** | WA-first inbox; ES/IT Liv greetings in jurisdiction pack |

### Netherlands (NL)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** |
| **Target** | Hair, beauty, wellness, pet grooming (urban) |
| **Channels** | WhatsApp + IG |
| **Incumbents** | Salonized, Fresha |
| **Liv wedge** | English-friendly NL market; iDEAL via Stripe later |

### Poland (PL)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P1** |
| **Target** | Hair, beauty, barber; price-sensitive C2/C4 |
| **Channels** | WhatsApp + Messenger; SMS |
| **Incumbents** | Booksy, local |
| **Liv wedge** | PLN in pack; PL disclosure strings |

### Nordics (SE, DK, NO, FI)

| Dimension | Detail |
|-----------|--------|
| **Priority** | **P2** — text packs + policy ready; GTM when IE/GB/DE proof exists |
| **Target** | Hair, wellness, physio |
| **Channels** | SMS + web; WhatsApp adoption rising |
| **Liv wedge** | Localized disclosure; SEK/DKK/NOK/EUR |

---

## Vertical × country notes (data-driven seeds)

Each vertical demo shop must set `country` + `vertical` + `locale` so Liv, holidays, and channels differ. See [`PER-VERTICAL-DEMO-SEED.md`](../product/PER-VERTICAL-DEMO-SEED.md).

| Vertical | IE emphasis | EU expansion note |
|----------|-------------|-------------------|
| Hair / barber | Voice + Phorest displacement | WA in ES/IT/DE |
| Beauty | IG DMs | FR Planity battle |
| Wellness | Packages, day plans | NL, Nordics spa |
| Body art | Design proof workflow | Consent language |
| Medspa | Counsel-gated campaigns | FR/DE high regulation |
| Pet grooming | Dublin urban | NL cities |
| Allied health | Physio Cork seed | DE Heilpraktiker caution |
| Fitness | Class sessions | Studio chains |

---

## Research & validation cadence

| Activity | Owner | Output |
|----------|-------|--------|
| Design-partner interviews | Founder | `.local/research/design-partners/{slug}.md` |
| Weekly competitive read | Founder | 1-pager in `.local/research/competitive/` |
| Channel adoption check | CS | % bookings with `sourceConversationId` by channel |
| Country launch gate | Product | This doc updated + policy pack + demo seed + E2E |

---

## Hand-offs

- Engineering jurisdiction table: `lib/policy/src/jurisdictions.ts`  
- Channel overrides: `lib/policy/src/channels.ts`  
- Messaging spec: [`CHANNELS-EU-MESSAGING.md`](../product/CHANNELS-EU-MESSAGING.md)  
- Build program: [`OPERATION-SOLIDIFY.md`](../product/OPERATION-SOLIDIFY.md)
