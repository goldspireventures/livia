# Livia — Final Execution Plan (EU, get over the line)

> **⚠ Superseded (2026-05-31)** by [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) + [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md).

**Status:** v1.0 (2026-05-21) — archived summary  
**Prerequisite:** [`LIVIA-DOCUMENTATION-READINESS.md`](./LIVIA-DOCUMENTATION-READINESS.md) + [`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) signed off.  
**Goal:** Ship a **EU-ready, self-onboarding, OS-coherent** Livia that replaces tool sprawl for appointment businesses — with **livia.io** and **internal ops** at the same quality bar as the product.

**Definition of done (founder):** A new EU owner can discover Livia on **livia.io**, sign up, complete onboarding without a call, Liv handles inbound on at least one channel, staff run the day from mobile, and support/issues have a visible path — for **any v1 vertical** with vertical-appropriate seed, not only hair.

---

## Phase 0 — Lock truth (1 week, parallel)

| # | Deliverable | Owner | Exit |
|---|-------------|-------|------|
| 0.1 | Mark `marketing-vs-reality.md` rows: fix hero (remove dental from hero) | Product | Zero G2 blockers |
| 0.2 | EU jurisdiction table in policy seeds matches onboarding form | Eng | IE, GB, DE, FR, ES, IT, NL, PL |
| 0.3 | Feature ledger: in-app support + feature request API spec → ticket schema | Eng | OpenAPI or Zod in repo |
| 0.4 | Onboarding milestone JSON on `business` | Eng | Schema merged |

**No new CRUD screens until 0.1–0.4 done.**

---

## Phase 1 — livia.io at brand standard (2 weeks)

| # | Work | Artifact |
|---|------|----------|
| 1.1 | `/pricing` page — EUR tiers, seat fees, voice share, FAQ | `livia-marketing` |
| 1.2 | `/how-it-works` — OS + anti-silo + M1–M4 | same |
| 1.3 | `/verticals/*` — hair, beauty, barber, tattoo, wellness (EU copy) | same |
| 1.4 | Footer legal links + `/contact` | same |
| 1.5 | Plausible/PostHog events: `lead_submit`, `pricing_view` | same |
| 1.6 | Changelog + status embed (or link) | same |

**Gate:** Lighthouse mobile EU > 90 performance; claims audit pass.

---

## Phase 2 — Self-onboarding wizard (3 weeks)

| # | Work | Surfaces |
|---|------|----------|
| 2.1 | Acts A1–A12 wizard shell with progress % | Dashboard `onboarding.tsx` refactor |
| 2.2 | A3–A5 inline edit seeded services/staff/hours | Dashboard |
| 2.3 | A6 Liv setup step (tone, greeting, enable) | Dashboard |
| 2.4 | A8 public link test book (opens `/b/{slug}`) | Dashboard |
| 2.5 | A9 Stripe Checkout embed in wizard | Dashboard + billing |
| 2.6 | A12 go-live checklist (8 ticks) | Dashboard + mobile banner |
| 2.7 | Stuck-user email drip (48h) | api-server + Resend |
| 2.8 | Mobile: onboarding parity (acts subset) | Mobile onboarding |

**Gate:** Playwright path `eu-owner-self-onboard.spec.ts` green (IE hair solo).

---

## Phase 3 — OS kernel gaps (4 weeks)

| # | Work | Why |
|---|------|-----|
| 3.1 | Channel router: WhatsApp + SMS → same conversation | Anti-silo |
| 3.2 | Client profile: cross-channel timeline | Anti-silo |
| 3.3 | `verticalPack` drives labels + booking rules + settings hints | All verticals equal |
| 3.4 | Demo seed per vertical (login shows different menu) | Sales + onboarding proof |
| 3.5 | Screen cards: top 20 routes × 5 verticals (YAML) | Experience Bible Part IX |
| 3.6 | Booking wizard + staff/service validation (S2 done) — polish | Already started |
| 3.7 | Liv disclosure + audit on all AI surfaces | Compliance |

**Gate:** Experience Bible routes move from Scaffolded → Partial minimum for P0 routes.

---

## Phase 4 — Payments (2 weeks)

| # | Work |
|---|------|
| 4.1 | Subscription checkout + portal link in Settings → Billing |
| 4.2 | Webhook hardening + entitlement gate tests |
| 4.3 | Connect onboarding UX in Settings → Billing |
| 4.4 | Optional deposit on public book (policy %) |
| 4.5 | Refund ladder UI on booking detail |

**Gate:** Test Stripe test-mode E2E: subscribe → book with deposit → refund request.

---

## Phase 5 — Rollback & trust (2 weeks)

| # | Work |
|---|------|
| 5.1 | “Report Liv error” on booking + conversation |
| 5.2 | Inbox approval for refund/cancel |
| 5.3 | `liv-was-wrong` Inngest workflow wired |
| 5.4 | Audit log viewer (owner) |

---

## Phase 6 — Feedback & internal ops (2 weeks)

| # | Work |
|---|------|
| 6.1 | `POST /support/tickets` + Help UI (web + mobile) |
| 6.2 | Internal portal: Support queue + tenant card |
| 6.3 | Weekly triage export to feature ledger |
| 6.4 | Slack/email on-call for SEV1 |

---

## Phase 7 — EU voice & locale (parallel track, 4–8 weeks)

| # | Work |
|---|------|
| 7.1 | IE voice regulatory + Twilio IE number |
| 7.2 | GB text-first GTM |
| 7.3 | DE/FR copy packs (UI strings) |
| 7.4 | Holiday calendars per jurisdiction |

**Not blocking Phase 2–6 for IE text + web book.**

---

## Phase 8 — Launch gates (from `launch-plan.md`)

| Gate | When | Depends on |
|------|------|------------|
| **G1 Demo Day** | Locked | Phase 3.6 + demo script |
| **G2 Closed Beta** | 10 Dublin partners | Phases 1–6 + marketing truth |
| **G3 Public EU** | Self-serve PLG | Phase 7 IE voice optional |

---

## Workstream map (what runs in parallel)

```text
Week 1–2:   Phase 0 + Phase 1 (marketing)
Week 2–5:   Phase 2 (onboarding) + Phase 3.3–3.4 (packs/demo)
Week 5–9:   Phase 3 (kernel) + Phase 4 (payments)
Week 9–11:  Phase 5 + Phase 6
Week 4–12:  Phase 7 (voice) — parallel
Week 12+:   G2 soak → G3
```

---

## Explicitly out of this plan (EU phase)

| Item | Reason |
|------|--------|
| US / JP locale | User directive: EU only |
| In-house payroll | OS boundary |
| Dental/medical primary care | Regulated; partner later |
| Marketplace commission model | Not revenue model |

---

## Success metrics (90 days post G2)

| Metric | Target |
|--------|--------|
| Self-serve onboarding completion | > 70% A1→A8 |
| Median time to first booking | < 24h |
| Owners still using Phorest daily | < 20% of cohort |
| Support tickets per tenant/month | < 0.5 |
| NPS design partners | > 40 |

---

## Immediate next actions (this week)

1. **Review** [`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) — comment only on factual errors.  
2. **Approve** this execution plan or reprioritise phases.  
3. **Start Phase 0.1** — fix livia.io hero claims.  
4. **Start Phase 2.1** — onboarding wizard shell (biggest UX gap vs “automated self-onboarding”).

---

*When Phases 0–6 are complete, Livia crosses from “powerful scaffold” to “EU OS you can sell without apologising.”*
