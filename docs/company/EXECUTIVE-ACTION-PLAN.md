# Executive action plan — founder vs AI-assisted execution

**Status:** Canonical (2026-05-26)  
**Reads with:** [`EXECUTIVE-MULTI-HAT-REVIEW.md`](./EXECUTIVE-MULTI-HAT-REVIEW.md)  
**Purpose:** Turn the multi-hat review into a **sequenced plan** with clear ownership: what you must do yourself, what you can delegate to engineering hires, and what **Cursor / AI agents** can accelerate without replacing judgment calls.

---

## How to use this plan

1. **Start with §1 North-star OKRs** — if a task doesn’t serve an OKR, defer it. **Weekly dashboard:** [`NORTH-STAR-DASHBOARD.md`](./NORTH-STAR-DASHBOARD.md).
2. **Work phases in order** — Phase 0 before Phase 1. Do not pursue Gate 3 ops while Gate 2 proof is false.
3. For each task, check **Owner** column:
   - **Founder** — requires your identity, relationships, legal signature, or prod account ownership.
   - **Hire** — delegate when role exists (CS contractor first).
   - **AI-assisted** — Cursor/agent can draft, implement, audit, or test; you review and merge.
   - **Hybrid** — AI produces draft; founder approves or performs external step.

4. **Weekly**: Monday ops (30 min) using §6 scorecard template.

---

## §1 North-star OKRs (next 90 days)

| OKR | Key result | Primary owner |
|-----|------------|---------------|
| **O1 — Wedge proof** | 10 design-partner shops with ≥1 **real** (non-demo) customer booking/week | Founder + CRO |
| **O2 — Liv is real** | ≥40% of partner interviews use “Liv” by name unprompted (path to 60% by month 6) | Founder + CS |
| **O3 — Commercial truth** | Gate 2 criteria met for 7 consecutive days (see `launch-plan.md`) | Founder + COO |
| **O4 — Wedge product** | Owner **Tuesday ritual** demoable on **mobile** + voice recovery in weekly digest | Product + Eng (AI-assisted) |
| **O5 — Promise integrity** | Zero `build-before-G2` rows in `marketing-vs-reality.md` | Founder + CMO |
| **O6 — Support ready** | Support L1 covering queue 9–17 IE; **blocking first response <4h**; ticket ack email live | Founder + Support |

**Explicitly NOT OKRs for days 1–90**

- DACH launch, medspa consent, enterprise SSO, peer insights panel, Product Hunt, SOC 2 Type 2, franchise proofs P8–P9.

---

## §2 Phase map

```text
Phase 0 (days 1–30)   Focus + pipeline + prod keys skeleton
Phase 1 (days 31–60)  Gate 2 engineering + partner onboarding wave 1
Phase 2 (days 61–90)  Gate 2 declare + first paid / LOA + ritual metrics
Phase 3 (post-90)     Gate 3 prep (legal, stores, public marketing)
Phase 4 (6–12 mo)     Scale motion + v1.5 bets + second hire
```

---

## §3 Phase 0 — Focus & pipeline (days 1–30)

### 3.1 CEO / strategy (Founder)

| ID | Task | Done when |
|----|------|-----------|
| F-01 | Publish internal **scope moratorium** (email to self + future hires): v3 blocks N/M only; no new vertical routes without signed partner | Written note in `.local/` or RFC |
| F-02 | Lock **external narrative**: “colleague your salon hires” — update pitch deck / intro email | One-pager consistent with `livia-positioning.md` §6 |
| F-03 | **Weight design-partner slots 1–3** (C2 P2b hair); pause outreach on slots 8–10 until slots 1–3 live | CRM stages updated |
| F-04 | Begin **15 warm conversations → 10 signed** partner letters | 10 signed |
| F-05 | Monthly **competitive read** (Fresha Concierge, Phorest Ivy) — 30 min | Notes in `.local/competitive/` |

### 3.2 COO / ops (Founder → contractor)

| ID | Task | Owner | Done when |
|----|------|-------|-----------|
| O-01 | Stand up **partner tracker** (Notion/Sheet): slot, persona, vertical, stage, first booking date | Hybrid | Sheet live |
| O-02 | **Monday ops ritual** — scorecard §6 | Founder | 4 consecutive Mondays |
| O-03 | Recruit **fractional CS/onboarding** (0.5 FTE, 3-month min) — **success only**, not ticket queue | Founder | Contract signed |
| O-03b | Recruit **Support L1** (0.5 FTE min) — internal portal queue, `support@livia.io`, daily triage | Founder | Contract signed |
| O-04 | Prod **secrets inventory**: Stripe, Twilio, Clerk, Inngest, Meta, Anthropic — what exists vs missing | Hybrid | Checklist |
| O-05 | **support@livia.io** shared inbox + link to internal portal | Founder | Inbox live |
| O-06 | **Daily support standup** (15 min) — open tickets, SLA risk, Liv incidents | Support L1 | 5 days/week |

### 3.3 Customer Support — facilities (Phase 0)

| ID | Task | Owner | Done when |
|----|------|-------|-----------|
| SUP-01 | Publish [`CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) | AI + Founder | Reviewed |
| SUP-02 | Train Support L1 on `support-runbook.md` + internal portal (`pnpm dev:internal`) | Founder | L1 can close a demo ticket |
| SUP-03 | **10 canned replies** from triage macros in operating model | Hybrid | In ops doc |
| SUP-04 | Partner letter **SLA paragraph** (blocking 4h / annoying 2bd) | Founder | In design-partner offer |
| SUP-05 | Ticket **ack email** (Resend) on create | AI-assisted | E-10 merged + Resend dev test |
| SUP-06 | Escalation tree poster: L1 → L2 (founder) → Eng on-call | Hybrid | In operating model |

### 3.4 Legal / compliance (Founder)

| ID | Task | Done when |
|----|------|-----------|
| L-01 | Engage **counsel** for IE package (ToS, Privacy, Cookie, DPA) | Engagement letter |
| L-02 | Provide counsel **product truth packet**: `marketing-vs-reality.md`, `regulatory-and-legal.md`, ai-disclosure samples | Sent |
| L-03 | **Do not** market medspa, WhatsApp, or EU residency until rows cleared | Audit clean |

### 3.5 AI-assisted (Cursor) — Phase 0

| ID | Task | AI can | You must |
|----|------|--------|----------|
| A-01 | **Competitive battlecard** v2 (Livia vs Ivy vs Concierge) — structural diff, not feature fluff | Draft full doc in `docs/business/` | Approve messaging; no false claims |
| A-02 | **Partner interview script** + weekly notes template | Draft | Conduct interviews |
| A-03 | **CRM/partner tracker** structure as markdown template | Draft | Fill with real names |
| A-04 | Audit **v1-scope vs repo** — list routes/modules outside Hair wedge | Report in `docs/audits/` | CEO decides cuts |
| A-05 | **Pricing one-pager** reconciling F9 hybrid vs Gate 3 tiers for sales | Draft | Sign pricing for partners |
| A-06 | Update `FOUNDER-SHIP-LANE.md` cross-links to this action plan | PR | ✅ Done |
| A-07 | Support ack email (`support-ticket-notifications.service.ts`) | PR | ✅ Done — needs `RESEND_API_KEY` to send |

---

## §4 Phase 1 — Gate 2 build & onboard (days 31–60)

### 4.1 Engineering wedge (AI-assisted + founder review)

Priority order — **stop other feature work** until these exit:

| ID | Workstream | AI-assisted scope | Founder / hire |
|----|------------|-------------------|----------------|
| E-01 | **Booking continuity** (v3 Block N, scenario 01) | Implement + E2E per `V3-REAL-WORLD-SCENARIOS.md` | Prioritise in PR review |
| E-02 | **Mobile owner Tuesday** — briefing slim OR today dashboard ritual | UI + API wiring | Test on device with partner |
| E-03 | **Manager queue** — Liv acted / needs you | Inbox UI split | Demo feedback |
| E-04 | **Voice path hardening** — prod Twilio IE, disclosure, audit transcript | Code + tests | **Prod Twilio account** (founder) |
| E-05 | **Inngest prod** + reminder workflows verified | Config templates, runbooks | Prod keys + deploy approval |
| E-06 | **Weekly digest** — recovered booking € + sourceConversationId | Implement/enrich | Verify with real partner data |
| E-07 | **Booksy/Phorest import** path — highest GTM ROI integration | CSV/import service hardening | Partner export files |
| E-08 | Sentry release tags + pino logging on wedge routes | Wire | Dashboard access |
| E-09 | Playwright smoke: sign-in, public book+chat, inbox, settings AI | Expand suite | CI green |
| E-10 | **Support ticket ack email** on create (Resend, ticket id, SLA text) | Implement + test | `RESEND_*` prod when live |

### 4.2 Product / design (AI-assisted)

| ID | Task | AI-assisted | Founder |
|----|------|-------------|---------|
| P-01 | Wedge **screen polish pass** (≤12 screens) — loading/empty/error | Implement per PRODUCT-GRADE-BAR | Visual sign-off |
| P-02 | **axe** on critical routes in CI | Add to workflow | Accept CI time cost |
| P-03 | Motion M1.1 tokens — inbox + public next-steps | Shared constants | Brand check |
| P-04 | **Liv was wrong** basic apology card (Bet 5 minimum) | UI + workflow hook | Copy tone approval |
| P-05 | Remove/defer **demo-only** claims from any in-app copy | Audit pass | — |

### 4.3 Customer success (Founder + CS hire — not Support)

**Handoff:** Success never owns ticket SLAs. If a partner reports a bug on a call, Success creates or asks them to use **Report issue**; Support owns resolution.

| ID | Task | Owner | Done when |
|----|------|-------|-----------|
| C-01 | Onboard partners **1–3** with OPERATOR-READY-PACK | CS + Founder | Policies + voice live |
| C-02 | **Week 0–2 playbook**: day 0 setup, day 7 voice test, day 14 first recovery | Hybrid doc | 3 partners through |
| C-03 | Weekly **30 min interviews** — record with consent | Founder | Transcripts in `.local/research/` |
| C-04 | **Office hours** — first cohort call | Founder | Calendar recurring |
| C-05 | Staff introduction — `team-on-livia.md` sent to each shop | CS | All staff invited |

### 4.4 GTM (Founder)

| ID | Task | Done when |
|----|------|-----------|
| S-01 | Run **full demo script** on `/demo` with 3 friendly owners before partners | Feedback incorporated |
| S-02 | **Migration dry-run**: one Phorest OR Fresha export imported | Time-to-value logged |
| S-03 | Slots **4–6** outreach only if 1–3 stable | — |

### 4.5 Marketing (Hybrid)

| ID | Task | AI-assisted | Founder |
|----|------|-------------|---------|
| M-01 | `livia.io` **staging** copy — honest, no WA/IG until built | Draft pages | Deploy + DNS when ready |
| M-02 | “How we comply” EU AI page draft | Draft | Counsel review |
| M-03 | **marketing-vs-reality** row for any new claim | Add rows | Monday review |

### 4.6 Off-platform prod (Founder only)

| ID | Task | Source |
|----|------|--------|
| X-01 | TestFlight accepted | `FOUNDER-SHIP-LANE` #4 |
| X-02 | Play internal testing | #4 |
| X-03 | Resend domain verified | launch-plan Gate 2 |
| X-04 | Twilio IE number per shop (pilot) | #6 |
| X-05 | Inngest cloud prod app | E-05 |
| X-06 | Stripe **test → prod** billing keys; first test checkout | #3 |

---

## §5 Phase 2 — Declare Gate 2 & measure wedge (days 61–90)

### 5.1 Gate 2 declaration checklist

Copy from `launch-plan.md` + `marketing-vs-reality.md` Phase 9:

- [ ] 7 consecutive days zero P0 (Sentry)
- [ ] 10 shops, real bookings each
- [ ] TestFlight + Play internal live
- [ ] Reminders firing in prod (Inngest)
- [ ] AI disclosure on chat/SMS/voice verified in QA
- [ ] Partner transcripts stored
- [ ] No `build-before-G2` audit rows

**Founder**: declare Gate 2 in writing; update `launch-plan.md` Last reviewed.

### 5.2 Measurement sprint

| ID | Metric | How | Owner |
|----|--------|-----|-------|
| MTR-01 | Liv-by-name % | Code partner interview transcripts | Founder |
| MTR-02 | Recovered bookings / shop / month | Digest + audit IDs | CS |
| MTR-03 | Time to first recovery | Onboarding tracker | CS |
| MTR-04 | Mobile DAU owners | Analytics (PostHog/Plausible) | Eng |
| MTR-05 | Voice CSAT vs baseline | Partner survey month 3 path | CS |

### 5.3 First revenue (Founder)

| ID | Task | Done when |
|----|------|-----------|
| R-01 | At least **1 paid subscription** OR signed LOA at list/50% partner rate | Invoice |
| R-02 | Decide **voice outcome share** on or off for cohort 1 | Written policy |
| R-03 | **Case study draft** (1 partner, anonymised option) | Hybrid AI draft, partner approval |

### 5.4 AI-assisted — Phase 2

| ID | Task |
|----|------|
| A-10 | **Eval report** from traces — refund/booking regression summary |
| A-11 | **Gate 2 evidence pack** — auto-compile checklist status from docs + test results |
| A-12 | **Investor/partner update** memo from metrics (not for public without review) |
| A-13 | Internal **Platform Kernel** diagram doc for onboarding |
| A-14 | Post-partner-onboarding **RFC template** for failures |

---

## §6 Phase 3 — Gate 3 prep (days 91–180)

**Do not start Phase 3 until Gate 2 declared** unless parallel legal work (L-01).

### Founder-only (cannot delegate to AI)

| Area | Tasks |
|------|-------|
| Legal | Signed ToS, Privacy, DPA on `livia.io/legal/*` |
| Payments | Stripe Connect prod; first real deposit + tip (#58) |
| Stores | App Store + Play **public** approval |
| Infra | EU residency ADR + production region pin (#57) |
| Sales | First **€1k MRR pipeline** (launch-plan Gate 3) |
| Compliance | SOC 2 Type 1 kickoff (engagement letter) |
| Partners | Graduate design partners toward standard pricing |

### AI-assisted — Phase 3

| Area | Tasks |
|------|-------|
| Engineering | Deposit flows, Connect onboarding UX, Lighthouse fixes |
| Marketing | livia.io v1, changelog, status page copy |
| Docs | SOC2 control mapping draft, support runbook expansion |
| QA | Full E2E runbook execution, UAT certification doc updates |
| Audit | marketing-vs-reality G3 rows; changelog sync |

### Hire-triggered (post Gate 2)

| Role | Trigger | First responsibilities |
|------|---------|------------------------|
| CS/onboarding lead | Phase 0 O-03 | Partner cadence, migration, office hours — **not** ticket queue |
| Support L1 | Phase 0 O-03b | Internal portal queue, ack emails, canned replies, SLA tracking |
| Engineer #2 | Gate 2 + funding or revenue | Mobile + workflows, on-call rotation |
| Fractional counsel | Already in Phase 0 | G3 legal pages |

---

## §7 Phase 4 — Scale (6–12 months)

| Theme | Founder | AI-assisted | Hire |
|-------|---------|-------------|------|
| GTM | UK partner 3+ (P5 proof); shadow sales hire | Outreach scripts, case studies | SDR shadow |
| Product | Bet 3 trust ratchet UI if metrics allow | Build promotion ceremony | — |
| Product | Bet 4 audit diary voice | Narrator templates | — |
| Engineering | v1.5 scope only (chair-rental proof P1) | Per V2/V1.5 matrices | Eng team |
| Company | Seed raise if metrics hit investor table §13 | Data room index, metric decks | — |
| Brand | Liv Mark prep (Bet 6) if NPS supports | Design specs | — |

**Kill / pivot triggers** (from `livia-bets.md`):

- Month 6: Liv-by-name <60% → re-evaluate character public frame.
- Month 3 voice: CSAT below baseline → defer voice marketing.
- Bet 3: <30% owners promote past Rung 2 at 6 months → redesign ratchet.

---

## §8 What Cursor / AI can help with (standing capabilities)

Use AI agents for **high-leverage, reversible** work. Always run `pnpm typecheck` before declaring done.

### Strong fit (do regularly)

| Category | Examples |
|----------|----------|
| **Implementation** | Wedge features, E2E tests, bug fixes, OpenAPI ripple + codegen |
| **Audits** | marketing-vs-reality scans, v1-scope drift, security/RBAC smoke, dependency review |
| **Documentation** | Battlecards, runbooks, interview templates, ADRs, changelog, onboarding updates |
| **Refactoring** | N+1 fixes, design tokens, mobile parity for specified screens |
| **Integrations** | Import parsers (Booksy CSV), webhook hardening, Inngest workflow fixes |
| **Eval / AI** | Scenario suites, prompt store changes, tool-boundary tests |
| **CI/devops** | GitHub Actions, Sentry wiring, playwright expansion |
| **Content drafts** | Blog, FAQ, compliance pages — **founder + counsel approve** |

### Moderate fit (you review carefully)

| Category | Examples |
|----------|----------|
| **Pricing / contract language** | Draft only — counsel signs |
| **Architecture expansion** | RFC drafts — you accept/reject ADR |
| **New vertical packs** | Only with signed partner + CEO moratorium lifted |
| **Sales emails** | Personalise; you send from your account |

### Poor fit (do not delegate to AI)

| Category | Why |
|----------|-----|
| Design-partner recruitment | Trust + relationship |
| Counsel negotiations | Privileged |
| Prod account creation / billing keys | Security + identity |
| Partner pricing exceptions | Judgment |
| Public launch declaration | Accountability |
| Hiring decisions | Human |
| Press / investor meetings | You |
| Recorded partner interviews | Consent + rapport |

---

## §9 What you must do yourself (founder checklist)

Non-exhaustive but **cannot** be offloaded to AI or async agents:

1. **Warm intros** to 10 Dublin shops — design-partner programme.
2. **Sign** design-partner letters, DPAs, and eventually customer contracts.
3. **Counsel relationship** — brief, review, approve legal pages.
4. **Production accounts**: Stripe, Apple/Google developer, Twilio, Meta BSP, hosting region, Inngest.
5. **Deploy approval** to production with real customer data.
6. **Weekly partner calls** (at least weeks 1–12 for cohort 1).
7. **Gate 2 / Gate 3 declaration** — written accountability.
8. **Category-shaping calls**: pricing changes, scope moratorium exceptions, bet kills.
9. **First 90-second demo** to every serious prospect until repeatable.
10. **Hire** CS contractor and later engineers — interviews, offers.
11. **Fundraising conversations** if pursued — narrative from proof, not repo size.
12. **Incident commander** for SEV1 until on-call rotation staffed.

---

## §10 Weekly scorecard (Monday, 30 min)

Copy into ops note each week:

```text
Week of: ___________

Partners live (real bookings): __ / 10
Partners signed not live: __
Gate 2 blockers open: __
marketing-vs-reality reds: __
P0 incidents (7d): __
Liv-by-name (interviews this week): __ %
Recovered bookings (total): __
Founder hours on sales: __
Founder hours on CS: __
Engineering: wedge PRs merged (list): 
Support: open tickets __ | blocking __ | SLA breaches __ | oldest blocking age __
Top partner quote: 
Top risk: 
One decision made: 
```

---

## §11 Suggested Cursor engagement model

To get maximum value without chaos:

1. **One active wedge epic at a time** — e.g. “Phase 1 E-01 booking continuity only.”
2. **Reference docs in prompt**: `EXECUTIVE-ACTION-PLAN.md` + `v1-scope.md` + relevant scenario spec.
3. **Require PR discipline**: PRODUCT-GRADE-BAR + surface sweep (even if “N/A” per surface).
4. **Monday**: ask agent for `marketing-vs-reality` diff vs `livia-marketing` copy.
5. **Friday**: ask agent for gate checklist status from tests + audit doc.

**Sample prompts** (save in `.local/cursor-playbook.md` if useful):

- “Implement V3 scenario 01 booking continuity per V3-REAL-WORLD-SCENARIOS; no new routes outside bookings/inbox/chat.”
- “Audit all marketing claims on artifacts/livia-marketing against docs/audits/marketing-vs-reality.md; propose copy edits only.”
- “Mobile owner today ritual: match persona P2b; morning briefing slim; link to audit.”
- “Draft Phorest vs Livia battlecard for sales; structural differences only; cite docs.”

---

## §12 Success definition (90 days)

You win Phase 0–2 if:

| Criterion | Target |
|-----------|--------|
| Gate 2 | Declared |
| Design partners with real bookings | 10 |
| External narrative | Single colleague line |
| Tuesday ritual | Demoable on mobile to strangers |
| marketing-vs-reality | Zero G2 blockers |
| Founder burnout signal | CS contractor absorbing ≥50% onboarding hours |
| Fundraise optional | Credible seed deck with 3 partner quotes + € recovery logs |

You **do not** need by day 90: DACH, medspa, enterprise SSO, Product Hunt, 250 tenants, or full v3 scope ledger.

---

## §13 Document links (quick navigation)

| Doc | Use |
|-----|-----|
| [`EXECUTIVE-MULTI-HAT-REVIEW.md`](./EXECUTIVE-MULTI-HAT-REVIEW.md) | Why — full hat analysis |
| [`NORTH-STAR-DASHBOARD.md`](./NORTH-STAR-DASHBOARD.md) | Monday OKR + Gate 2 pass/fail |
| [`FOUNDER-SHIP-LANE.md`](../product/FOUNDER-SHIP-LANE.md) | Off-platform gate tasks |
| [`launch-plan.md`](../launch-plan.md) | Gate 2/3 criteria |
| [`marketing-vs-reality.md`](../audits/marketing-vs-reality.md) | Promise integrity |
| [`design-partner-programme.md`](../business/design-partner-programme.md) | Partner mix |
| [`V3-EXECUTION-PROGRAM.md`](../product/V3-EXECUTION-PROGRAM.md) | Blocks N/M only (90d) |
| [`v1-scope.md`](../roadmap/v1-scope.md) | Wedge ledger |
| [`OPERATOR-READY-PACK.md`](../business/OPERATOR-READY-PACK.md) | Onboarding |
| [`CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) | Support SLAs, escalation, facilities |
| [`support-runbook.md`](../operations/support-runbook.md) | Triage checklist |
| [`INTERNAL-SUPPORT-LIFECYCLE.md`](../operations/INTERNAL-SUPPORT-LIFECYCLE.md) | Ticket states + API |

---

## Changelog

- 2026-05-26: Initial action plan paired with executive multi-hat review.
- 2026-05-26: O6 Support OKR; SUP-* Phase 0; split CS vs Support hires; E-10 ack email.
