# Livia — Detailed build plan (EU, doc-gated)

**Status:** v1.0 (2026-05-21) — **canonical execution sequence**  
**Supersedes:** [`LIVIA-FINAL-EXECUTION-PLAN.md`](./LIVIA-FINAL-EXECUTION-PLAN.md) for task-level detail (phases unchanged)  
**Reads with:** [`LIVIA-DOCUMENTATION-READINESS.md`](./LIVIA-DOCUMENTATION-READINESS.md) · [`LIVIA-MASTER-BUILD-PLAN.md`](./LIVIA-MASTER-BUILD-PLAN.md) (kernel phases) · [`BUILD-BACKLOG.md`](./BUILD-BACKLOG.md)

---

## 0. Executive summary

| Question | Answer |
|----------|--------|
| Are all docs ready? | **No** — L2 EU spec + governance + policy + ADRs **yes**; L3 screen cards, L7 full ops, counsel-signed legal **no** |
| Can we start building? | **Yes** — Phase 0–2 approved with doc gates below |
| What is “done”? | G2: 10 EU design partners self-onboard, Liv on SMS+web, support path works, marketing audit green |

**Three parallel tracks:**

- **Track A — Product & GTM** (this doc Phases 0–8)  
- **Track B — Platform kernel** (MASTER-BUILD-PLAN Phases 1–9 where not already shipped)  
- **Track C — Reliability & ops** ([`LIVIA-RESILIENCE-OPS-AND-TRUST.md`](./LIVIA-RESILIENCE-OPS-AND-TRUST.md) Phases R0–R3)

Merge rule: **Track B before Track A** when the feature needs entitlements, events, or audit.  
**Track C** does not block product UI but **does block Gate 2** ops rows (Sentry 7d, drills, status page).

---

## 1. Documentation gates per phase

| Phase | Min doc level required | Doc deliverables closing in phase |
|-------|------------------------|-----------------------------------|
| **0** | L2 spec + L4 ticket schema | Readiness sign-off; OpenAPI `/support/tickets`; onboarding JSON schema |
| **1** | L2 livia.io §4 | `marketing-vs-reality` hero fix; new pages match spec |
| **2** | L2 onboarding §3 + L3 cards for onboarding routes | 5× `screens/*/onboarding.*.yaml` |
| **3** | L3 P0 routes + rules registry | 20 screen cards; vertical demo seed doc |
| **4** | L2 payments §6 | Stripe test playbook in `LOCAL_DEV.md` |
| **5** | L2 rollback §8 | `liv-was-wrong` UI acceptance |
| **6** | L7 support runbook + triage SOP | `feature-triage-sop.md`; portal support module |
| **7** | L2 EU voice | Twilio IE regulatory checklist |
| **8** | L6 audit + counsel legal | G2/G3 per `launch-plan.md` |

---

## 2. Baseline truth (2026-05-21 — refresh MASTER-BUILD §1)

| Area | Was “immature” in MASTER-BUILD | Now |
|------|-------------------------------|-----|
| Inngest | not integrated | **Integrated** — workflows + serve route |
| Audit | not invoked | **Partial** — human mutations |
| Entitlements | not enforced | **Partial** — voice, billing gates |
| Tenant ALS | not wired | Check `tenant-context` — verify in Phase 0 |
| Mobile parity | ~70% | ~79% owner per operating-cadence |
| S2–S4 CRUD | gaps | **Done** — clients, booking wizard, settings IA |
| Internal portal | shell | **Still shell** |
| Screen cards | — | **1 YAML** |
| Support tickets | — | **Built** — API + Help UI + internal queue |
| Internal portal | shell | **MVP** — tenant search + tickets |

---

## Phase 0 — Lock truth (Week 1)

### Engineering

| ID | Task | Exit criteria | Status |
|----|------|---------------|--------|
| 0.1 | Fix `livia-marketing` hero — no dental; EU verticals only | PR + audit row | ✅ |
| 0.2 | `business.onboardingState` JSON schema + migration | `@workspace/policy` + `005-onboarding-support.sql` | ✅ |
| 0.3 | OpenAPI: `POST /businesses/{id}/support/tickets` + Zod | Orval regen + `routes/support.ts` | ✅ |
| 0.4 | Verify `tenantContext` on all authenticated routes | Wired via `requireRole` → `resolveTenantContext` | ✅ existing |
| 0.5 | Refresh `LIVIA-MASTER-BUILD-PLAN.md` §1 baseline | Doc PR | ✅ |
| 2.1 | Onboarding wizard shell (early) | `onboarding-wizard.tsx` + acts A1–A12 | ✅ started |

### Documentation

| ID | Task | Exit |
|----|------|------|
| 0.D1 | Founder sign `LIVIA-DOCUMENTATION-READINESS.md` | Checkbox |
| 0.D2 | Link `BUSINESS-RULES-REGISTRY.md` from foundation README | Link |

**Phase 0 exit:** 0.1–0.4 merged; no new product UI except marketing hero.

---

## Phase 1 — livia.io (Weeks 1–2) ✅

| ID | Task | Status |
|----|------|--------|
| 1.1 | `/pricing` | ✅ |
| 1.2 | `/how-it-works` | ✅ |
| 1.3 | `/verticals/:slug` (hair, beauty, barber, tattoo, wellness) | ✅ |
| 1.4 | Footer + contact + changelog | ✅ |
| 1.5 | Analytics | ✅ Plausible via `VITE_PLAUSIBLE_DOMAIN` |
| 1.6 | Status link external | ✅ |

**Phase 1 exit:** Manual pass in [`REAL-WORLD-E2E-GUIDE.md`](../testing/REAL-WORLD-E2E-GUIDE.md) §1.

---

## Phase 2 — Self-onboarding wizard (Weeks 2–5)

| ID | Task | Surface | Depends |
|----|------|---------|---------|
| 2.1 | Wizard shell + progress | `onboarding.tsx` | 0.2 |
| 2.2 | Acts A2–A7 inline / preview | dashboard | ✅ |
| 2.3 | Act A6 Liv | dashboard | ✅ inline form |
| 2.4 | Act A8 test book link | dashboard | ✅ |
| 2.5 | Act A9 billing | dashboard | ✅ BillingControls |
| 2.6 | Act A12 checklist | dashboard + mobile | ✅ |
| 2.7 | 48h stuck email | cron + Resend | ✅ `onboarding-stuck?send=true` |
| 2.8 | Mobile continue + checklist | `onboarding-continue.tsx` | ✅ |
| 2.9 | Playwright `eu-owner-self-onboard` | `e2e/tests/` | ✅ |

**Doc deliverables:** `screens/hair.en-IE/web.onboarding.*.yaml` (acts A1–A12).

**Phase 2 exit:** ✅ Playwright + REAL-WORLD §2; inline acts; progress banner; Resend nudge cron; mobile `onboarding-continue`.

---

## Phase 3 — OS kernel & vertical parity (Weeks 4–8)

### 3A — Product (Track A)

| ID | Task | Notes |
|----|------|-------|
| 3.1 | Channel router SMS unified | WhatsApp deferred |
| 3.2 | Client timeline cross-channel | ✅ activity feed on customer detail |
| 3.3 | `verticalPack` → UI labels + validation | ✅ `vertical-pack-ui` + banner |
| 3.4 | Demo seeds: hair, beauty, barber, tattoo, wellness | ✅ spec `PER-VERTICAL-DEMO-SEED.md` |
| 3.5 | Screen cards: **20 routes** × 5 verticals | ⚠️ **6 YAML** (P0 routes); remainder Phase 3 |
| 3.6 | Booking wizard polish + a11y | axe on `/booking/new` |
| 3.7 | AI disclosure all surfaces | audit §5b |

### 3B — Platform (Track B — from MASTER-BUILD)

| ID | Task | If not done |
|----|------|-------------|
| 3.B1 | Entitlements enforced on all premium routes | grep `requireEntitlement` |
| 3.B2 | Meter events on voice recovery booking | metering-recorder |
| 3.B3 | Domain events publish on all booking writes | booking-events |
| 3.B4 | Eval CI gate on PR | `@workspace/eval` |

**Phase 3 exit:** ✅ core parity; screen cards 6/100+ — see `OPEN-ITEMS-DEFERRED.md` for remainder.

---

## Phase 4 — Payments (Weeks 8–10)

| ID | Task |
|----|------|
| 4.1 | Billing tab: Checkout + Customer Portal |
| 4.2 | Webhook idempotency tests |
| 4.3 | Connect Express onboarding UI |
| 4.4 | Public book optional deposit |
| 4.5 | Refund request UI → workflow |

**Doc:** Update `marketing-vs-reality` rows 2b/8b when Connect test E2E passes.

**Phase 4 exit:** BillingControls in settings ✅; Connect/deposit E2E needs Stripe test keys.

---

## Phase 5 — Rollback & trust (Weeks 10–11)

| ID | Task |
|----|------|
| 5.1 | Report Liv error — booking + conversation | ✅ Help + inbox |
| 5.2 | Inbox refund/cancel approvals |
| 5.3 | `liv-was-wrong` Inngest | ✅ triage workflow scaffold |
| 5.4 | Owner audit log viewer |

---

## Phase 6 — Feedback & internal ops (Weeks 11–13)

| ID | Task |
|----|------|
| 6.1 | Support tickets API + Help UI (web + mobile) |
| 6.2 | Internal portal: tenant search + health card |
| 6.3 | Internal portal: ticket queue |
| 6.4 | `feature-triage-sop.md` | ✅ |
| 6.5 | On-call Slack webhook |

**Phase 6 exit:** Help UI ✅; internal open tickets ✅; triage SOP in resilience doc. ✅ core

---

## Phase 7 — EU voice & locale (Weeks 4–14 parallel)

| ID | Task | Blocks G2? |
|----|------|------------|
| 7.1 | IE Twilio regulatory + number | No (SMS+web enough for G2) |
| 7.2 | GB copy pack | No |
| 7.3 | DE/FR UI strings externalised | No |
| 7.4 | Holiday calendars per jurisdiction | No |

**Blocks G3:** 7.1 if marketing claims voice at GA.

---

## Phase 8 — Launch gates

| Gate | Criteria | Doc |
|------|----------|-----|
| **G1** | Demo script 90s; Playwright smoke | `demo-script.md` |
| **G2** | 10 DPs; audit rows 3,5b ✅; Phases 1–6; 7d soak | `launch-plan.md` |
| **G3** | Legal published; EU residency ADR; Connect prod; App stores | `legal/README` |

---

## 3. Workstream calendar

```text
W1:     Phase 0 + Phase 1 start
W2:     Phase 1 done + Phase 2 start
W3-5:   Phase 2 + Phase 3.3-3.4 + Phase 7 parallel
W6-8:   Phase 3 complete + Phase 3B
W8-10:  Phase 4
W10-11: Phase 5
W11-13: Phase 6
W13+:   G2 soak (7 days) → G3 prep
```

---

## 4. RACI (solo founder default)

| Work | R | A | C | I |
|------|---|---|---|---|
| Product spec | Eng agent | Founder | — | — |
| Screen cards | Founder | Founder | Design | Eng |
| Code | Eng | Founder | — | — |
| Legal publish | Counsel | Founder | — | — |
| GTM DPs | Founder | Founder | — | — |
| Support runbook | Founder | Founder | — | Future hire |

---

## 5. Risk register

| Risk | Mitigation |
|------|------------|
| Build UI without L3 cards | Phase 3.5 gate per route |
| Legal TBD blocks surprise | G3-only; beta uses draft + DP agreement |
| MASTER-BUILD baseline stale | Phase 0.5 refresh |
| WhatsApp promised | Audit row 1 deferred — do not build until RFC |
| Scope creep US/JP | Complete Spec EU lock |

---

## Track C — Reliability (parallel)

| Phase | Work | Exit |
|-------|------|------|
| **R0** | Resilience master doc + ops index + logging guide | ✅ 2026-05-21 |
| **R1** | Fill DR RPO/RTO; Sentry `request_id`; RBAC smoke; staging env doc | ✅ doc + rbac-smoke |
| **R2** | Internal portal tenant dir + tickets UI + Liv kill switch | CS weekly |
| **R3** | Grafana tenant dashboards; status page; quarterly rollback drill | Gate 2 ops |

---

## 6. Immediate next 5 actions

1. Founder: sign **Documentation Readiness** (or comment corrections).  
2. **Phase 0.1** — marketing hero PR.  
3. **Phase 0.3** — support tickets OpenAPI stub.  
4. **Phase 2.1** — onboarding wizard shell.  
5. **Phase 3.5** — write 5 onboarding screen cards (unblocks 2.x UX quality).

---

## 7. Relationship to other plans

| Doc | Role |
|-----|------|
| `LIVIA-FINAL-EXECUTION-PLAN.md` | Phase summary (unchanged intent) |
| `LIVIA-MASTER-BUILD-PLAN.md` | Kernel depth, monetization phases |
| `LIVIA-MASTER-PLAN.md` | Commercial sprints A–J |
| `BUILD-BACKLOG.md` | Checkbox sync when phases exit |
| `launch-plan.md` | G1–G3 external ops |

**This document wins on sequencing conflicts.**
