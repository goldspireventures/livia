# v2 expanded scope — business + product (canonical augmentation)

**Status:** Active (2026-05-22) — augments [`../roadmap/v2-scope.md`](../roadmap/v2-scope.md); does not replace it.  
**Execution:** [`V2-EXECUTION-PROGRAM.md`](./V2-EXECUTION-PROGRAM.md) · **Build:** [`V2-EXECUTION-PROGRAM.md`](./V2-EXECUTION-PROGRAM.md) (v1.5 engineering = Block A) · **Your lane:** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)

---

## Why expand v2 (not just “ship the old v2 doc”)

Original v2 was **verticals + UK + Nordics + class/tattoo**. That is correct but **under-monetises** three forces already in the codebase:

1. **UK is the natural second market** after IE (language adjacency, Phorest/Treatwell displacement) — v2 should lead with UK *scale*, not treat it as a footnote beside Nordics.
2. **Fitness + body art** are where incumbents are weakest on *AI + ops unity* (Mindbody = classes only; tattoo = no design-proof in booking SW).
3. **Franchise + mid-chain (C8/C11)** are the expansion revenue layer (per-shop × royalty) — v1.5 opened small chain (C7); v2 must own **5–9 shops** and **franchisor** economics.

This document locks an **expanded v2** that is still shippable as one version name, with explicit business bets and product surfaces.

---

## Expanded promise (one sentence)

> **v2 makes Livia the default OS for appointment businesses in the UK and Nordics** — with **first-class fitness classes, tattoo design-proof, and wellness intake**, **mid-chain and franchise operations**, and **locale-native Liv** (text + voice where ready) — while **IE heartland depth** continues to compound.

---

## Business expansion (GTM, packaging, markets)

### Market sequencing (revised)

| Wave | Markets | Wedge ICP | Why now |
|------|---------|-----------|---------|
| **W1** | UK nationwide (GB pack) | Solo/studio hair & beauty; small chain C7→C8 | Same language family; Treatwell marketplace fatigue; v1.5 GB groundwork |
| **W2** | Nordics bundle (SE + DK) | Fitness studios, wellness, premium hair | High digital maturity; Bokadirekt/Easypractice gaps on AI |
| **W3** | NO + FI (text-first) | Same as W2; FI voice gated | Completes “Nordics” story without blocking W1–W2 |

**Business rule:** No DACH/FR/IBERIA in v2 (stays v3). No US (ever in 5-yr plan).

### New commercial packaging (v2 catalogue)

| SKU | Price signal | Who | v2 addition |
|-----|--------------|-----|-------------|
| **Studio Pro** | Studio base + vertical add-on | Fitness / body-art studios | Bundles `vertical_pack_fitness` or body-art + class/tattoo workflows |
| **Mid-chain** | €249/shop + **€39 ops seat** | C8 (5–9 shops) | Cross-shop promote, brand-voice consistency, ops rollup |
| **Franchise** | €199/franchisee/mo + **royalty reporting** | C11 franchisor | Scoped franchisor dashboard; no customer PII across franchisees |
| **Nordics locale pack** | +€29/mo per locale | Any tier | `sv-SE`, `da-DK`, `nb-NO`, `fi-FI` text; voice add-on when eval passes |
| **Migration concierge** | €750–€2.5k one-shot | Mindbody / Vagaro / Timely | Positioned at fitness + UK beauty (not only Phorest) |
| **Public API alpha** | Included for design partners | Integrators | Read-only; webhook parity; no SLA |

### GTM motions (new vs original v2)

1. **UK displacement playbook** — “customer belongs to the salon, not the marketplace” (Treatwell/Fresha contrast).
2. **Fitness design-partner pod** — 5 studios × 3 class types each; success = waitlist + package credits live 30 days.
3. **Tattoo pod** — 3 studios × design-proof → deposit → session without email ping-pong.
4. **Franchise lighthouse** — 1 franchisor × 5–15 franchisees; royalty rollup is the renewal hook.
5. **Nordics founder community** — Stockholm + Copenhagen cohorts jointly (shared peer-set, shared Liv voice casting budget).

### Revenue thesis (why expanded v2 matters)

| Lever | Year-2 target signal |
|-------|----------------------|
| ARPU lift from vertical add-ons | +€20–30/mo per fitness/body-art tenant |
| Mid-chain / franchise seat expansion | 2× shops per founder account vs v1.5 C7 |
| UK market TAM unlock | 3× addressable shops vs IE-only |
| Migration one-shots | Fund 2 FTE concierge motions |
| Peer insights (locale-specific sets) | €49/mo × opt-in ≥35% in v2 cohorts |

---

## Product expansion (what we build)

### Vertical depth (beyond “templates exist”)

| Vertical | v2 must ship | Expanded vs baseline v2 |
|----------|--------------|-------------------------|
| **Body art** | Design-proof → approve → deposit → session; healing follow-up DMs; allergy intake | Parental-consent stub for minors; portfolio attach on booking |
| **Fitness** | Class capacity, waitlist, roster check-in, package credit ledger | Unified calendar **mode toggle** (1:1 + class); no-show charge hook |
| **Wellness** | Longer sessions + intake forms | Shared intake framework with body art (not separate silos) |

### Configurations (org shapes)

| Config | v2 depth |
|--------|----------|
| **C8 Mid-chain** | Ops rollup, cross-shop staff promote workflow, chain-level Liv tone policy |
| **C11 Franchise** | Franchisor ↔ franchisee link; royalty rollup; brand-mandated promo cascade |
| **C12 Partnership** | `partner-vote` full workflow (graduate from v1.5 scaffold) |

### Platform capabilities (pulled forward or deepened)

| Capability | v2 target |
|------------|-----------|
| **Unified booking surface** | One calendar; `appointment` vs `class` on service/session |
| **Intake framework** | JSON schema forms; pre-appointment gate for body-art + wellness |
| **Package credits** | Ledger per customer; public balance; burn on book |
| **Per-locale Liv** | Character lead + golden corpus per Nordic locale; UK voice production |
| **Public API alpha** | Read-only partner API + scoped keys (design partners) |
| **Internal voice ops** | `livia-internal` locale cast / prompt version review |
| **Payments** | Klarna/Trustly stubs for Nordics where Stripe alone is thin |

### Explicitly **not** in expanded v2 (still v3+)

Medspa informed-consent at regulatory depth, DACH/FR/IBERIA locales, enterprise SSO self-serve, full white-label partner portal, BYOK, US, marketplace booking, pet vertical (see v2.5 candidate below).

### v2.5 candidate (post-v2, pre-v3) — optional lane

If v2 ships early: **pet grooming** (appointment + vaccination reminder) as a lightweight eighth vertical — only if 3 design partners commit. Not in v2 execution program until RFC.

---

## Acceptance criteria (expanded)

Original v2 criteria in `v2-scope.md` **still apply**, plus:

8. **UK:** ≥10 paying GB-jurisdiction tenants, 30 days, NPS ≥40 in cohort.  
9. **Mid-chain:** ≥2 C8 customers (5+ shops) on mid-chain billing.  
10. **Franchise:** ≥1 franchisor with ≥5 franchisees on royalty rollup.  
11. **Public API alpha:** ≥3 design partners consuming read API 30 days without incident.  
12. **Brand wall + franchise wall:** combined 30-day audit, zero cross-tenant leak.

---

## Strategic risks (honest)

| Risk | Mitigation |
|------|------------|
| v1.5 incomplete while v2 starts | [`V1.5-TO-V2-BRIDGE.md`](./V1.5-TO-V2-BRIDGE.md) — hard gates |
| Class + 1:1 calendar UX complexity | Mode toggle + shared slot engine; no duplicate calendars |
| Locale quality drift | No Nordic voice until eval ≥ v1 IE bar |
| Franchise PII | Franchisor sees aggregates only — same bar as chair-rental host |

---

## Read order

1. [`V2-EXECUTION-PROGRAM.md`](./V2-EXECUTION-PROGRAM.md)  
2. [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) (off-platform only)  
3. [`V2-SURFACE-MATRIX.md`](./V2-SURFACE-MATRIX.md)  
4. [`../roadmap/v2-scope.md`](../roadmap/v2-scope.md) (baseline ledger)
