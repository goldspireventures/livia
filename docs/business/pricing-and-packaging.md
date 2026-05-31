# Pricing and packaging — F9

**Status:** F9 (2026-05-07), people-business alignment 2026-05-31.  
**Category:** Pricing applies to **all appointment-led people businesses** — tiers map to org shape (solo, studio, chain), not hair-only. See [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](../product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md).  
**Marketing display:** € tiers on **livia-hq.com** (M2-A) must match this doc — [`marketing-vs-reality.md`](../audits/marketing-vs-reality.md).

## The pricing model

**Hybrid: per-business base + per-staff seat + outcome-share for voice.** Three components, each justified by F6 economics.

### Component 1 — Per-business base (the "Liv lives here" fee)

Covers the per-tenant runtime cost (ADR 0012), durable workflow execution (ADR 0013), audit log retention (ADR 0015), eval framework. This is the price of *having Liv at all*, regardless of staff count.

| Tier | Per business / month | Includes |
|---|---|---|
| **Solo** (C1, C2 — 1–2 chairs, no staff or apprentice only) | €79 | Liv runtime, voice line shared, mobile + cockpit, audit log |
| **Studio** (C4, C5, C6 — single shop with staff) | €149 | + WhatsApp Business, + dedicated voice number, + drift detection |
| **Chain** (C7, C8, C9 — multi-shop) | €249 / shop | + cross-shop rollup, + scoped roles per shop, + chain-level briefing |
| **Host** (C10 chair-rental) | €99 + €19 / renter / mo | + rent automation, + per-renter scoped data, + dispute mediation |
| **Multi-brand** (C13) | €99 / brand-shell + tier per shell | + portfolio rollup, + brand-wall guarantees |

### Component 2 — Per-staff seat (the "Liv works for you" fee)

Covers the per-persona runtime overhead (each staff member has their own Liv-relationship). Manager / Senior-w-admin / Staff / Receptionist seats. Owner seat included in base.

| Seat | Per seat / month |
|---|---|
| Manager (P3) | €15 |
| Senior-w-admin (P4) | €12 |
| Staff (P5) | €8 |
| Receptionist (P6) | €10 |
| Apprentice | €4 |

### Component 3 — Voice outcome share

Voice receptionist is the v1 wedge. We capture value when Liv recovers a missed-call booking. **Bookings recovered via voice that would otherwise be missed: 4% of booking value** (capped at €5/booking). Owner sees the recovery in the weekly digest; no surprise billing.

This is the only outcome-priced component. Everything else is fixed. We chose this because:
- F6 shows missed-call recovery is the dominant single-cell economic gain (~€7-15k/yr per shop).
- It's measurable end-to-end (call → booking → kept appointment → payment).
- 4% is meaningful for us, not extractive for them (a €40 cut yields €1.60).

## Worked examples (year 1)

| Cell | Components | Monthly | Annual | Year-1 Liv-value (F6) | ROI |
|---|---|---|---|---|---|
| **Conor (P2b solo, C2)** | Solo €79 + 1 apprentice €4 + voice ~€18 (recovers ~€450/mo) | **€101** | €1,212 | ~€30,000 | 25× |
| **Roisín (P2a, C5, 14 staff)** | Studio €149 + 1 mgr €15 + 1 sr-w-admin €12 + 12 staff €96 + voice ~€35 | **€307** | €3,684 | ~€18,000 | 5× |
| **3-shop chain Founder (P1, C7)** | Chain €249×3 + 3 mgrs €45 + ~30 staff €240 + voice ~€90 | **€1,122** | €13,464 | ~€55,000 | 4× |
| **Host (P2b × C10, 4 renters)** | Host €99 + 4 renters × €19 + voice ~€20 | **€195** | €2,340 | ~€34,000 | 14× |

## What's never an upsell

Per principle 6 (trust-amplification by default) + EU-anchored posture:

- **Security.** SSO, MFA, role hierarchy, scoped permissions — included in every tier.
- **GDPR posture.** DSR self-service, EU residency, audit log access — included in every tier.
- **Data export.** Day-1, full-fidelity export — included; Easy to Leave is in the contract.
- **Per-tenant phone number.** Included with Studio and above.
- **Mobile app for all personas.** Included.
- **Audit log access for Owners.** Included; the trust-amplification surface is non-negotiable.

## What IS an obvious upsell

- **Cross-tenant intelligence panel.** v1.5 add-on at €49/mo (after k≥10 peer-set forms). Optional.
- **Voice mode in additional locales/verticals** beyond the v1 wedge. Per-locale add-on at €29/mo when shipped.
- **Concierge migration** beyond the first 100 design-partner customers. €500–€2,500 one-shot depending on incumbent.
- **Custom integrations** beyond stock list. Quoted per-case.
- **White-label / multi-brand brand-shell beyond 3 brands.** Per-brand-shell pricing.

## Free trial / pilot story

**For first 100 customers (design-partner programme):** 12 months at 50% off + free concierge migration + direct line to founders + influence on roadmap. See `docs/business/design-partner-programme.md`.

**For customers 101–500 (founder-led sales):** 30-day free trial. Concierge migration included if incumbent is Phorest, Fresha, Booksy, Square. Self-serve trial otherwise.

**For customer 500+ (PLG + sales-assisted):** 14-day free trial self-serve; concierge migration as paid add-on.

## Annual vs monthly

- **Monthly:** list price.
- **Annual prepay:** -15%.
- **Annual prepay + 3-yr commit:** -22% (rare; only for chains).

**Lock-in posture:** ethical and explicit. Easy to leave is in the contract. Day-1 full-fidelity export. Annual prepayments refunded pro-rata on cancellation. We compete on the product, not the switching cost.

## Why this model and not the alternatives

- **Not pure per-seat (e.g., Acuity €20/mo/seat):** undervalues Liv's runtime fixed cost; creates incentive to under-provision seats and have staff share logins (the very leak ADR 0009 closes).
- **Not pure per-business flat (e.g., Phorest €80-200/shop):** undervalues per-staff Liv depth; the Senior-w-admin role + Manager scope + per-staff voice register pay for themselves but require seat fees to fund.
- **Not pure outcome (e.g., Fresha 1.5-2.5% payments):** misaligns incentives; we'd be motivated to push customers into payment-bearing flows even when ops-only is the right answer.
- **Not free + payments-fee (Fresha model):** the marketplace cut + payment fee model makes us depend on customer-acquisition we don't own; per Bet 5, marketplace exposure is not our model.

The hybrid model funds Liv's fixed cost (base), aligns with Liv's per-persona depth (seat), and captures real outcome value where it's measurable (voice).

## Open questions

- Is the 4% voice-share too high? Watch design-partner feedback Q1.
- Should chair-rental hosts pay per-renter or pass-through? Currently we charge the host; renters get a Liv-lite included.
- Annual vs monthly conversion rate at this discount curve — pending data.
