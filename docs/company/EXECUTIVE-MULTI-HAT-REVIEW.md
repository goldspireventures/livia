# Executive multi-hat review — Livia Inc

**Status:** Canonical strategic review (2026-05-26)  
**Audience:** Founder, future leadership, board advisors  
**Purpose:** Deep assessment of Livia as **company** and **product** from thirteen senior leadership lenses (including Customer Success **and** Customer Support as separate functions)  
**Evidence base:** In-repo docs (`docs/LIVIA-ALIGNMENT.md`, `livia-bets.md`, `livia-positioning.md`, `launch-plan.md`, audits, ADRs), codebase surface area, and external market research (Fresha AI Concierge, Phorest Front Desk AI / Ivy, EU AI Act, salon software market sizing, May 2026).  
**Companion:** [`EXECUTIVE-ACTION-PLAN.md`](./EXECUTIVE-ACTION-PLAN.md) — who does what (founder vs AI-assisted execution).

**This document does not supersede** foundation docs (F7–F10). It interprets them under competitive pressure and execution reality.

---

## How to read this document

Each section follows the same structure:

| Block | Contents |
|-------|----------|
| **Mandate** | What this role is accountable for |
| **Current state** | Honest assessment grounded in repo + market |
| **What’s working** | Strengths to protect |
| **Gaps & risks** | Failure modes with severity |
| **Recommendations** | 90-day / 12-month / 24-month |
| **Metrics they’d own** | How you’d know this hat is winning |
| **Dependencies** | Other hats that must move first |

Severity legend: **P0** company-threatening · **P1** wedge-blocking · **P2** scale-blocking · **P3** optimisation

---

## Executive synthesis (all hats)

### The one-paragraph truth

Livia has **category-grade strategy** and **platform-grade engineering ambition** packaged as a **pre-revenue company** entering a market where incumbents have already shipped **named AI receptionists** (Fresha Concierge, Phorest Ivy). The unfakeable bet remains valid — **colleague not tool**, audit-as-trust, EU posture, structural niches (chair-rental, multi-brand, Senior-w-admin) — but the **proof window** is measured in quarters, not years. The company’s existential task is not more architecture; it is **ten Dublin shops** that would miss Liv if you turned her off, with **measurable recovered revenue** and **>60% “Liv-by-name”** in unprompted speech.

### Strategic tension map (unresolved by design — CEO must decide)

| Tension | Pole A | Pole B | CEO decision required |
|---------|--------|--------|-------------------------|
| Narrative | “Operating system for EU appointment businesses” | “The colleague your salon hires” | **Pick one external line**; keep the other internal |
| Scope | `V3-EXECUTION-PROGRAM` — whole product, DACH, medspa | `v1-scope` — Hair, English-IE, four configurations | **Freeze v3 breadth** until wedge metrics exist |
| Surface | API/kernel ahead (honest in alignment doc) | Mobile flagship (ADR 0011) | **Mobile-first wedge rituals** for 90 days |
| Pricing | F9 hybrid (€79–€249 + seats + 4% voice) | ~~Launch-plan Gate 3 (€49/€99/€149)~~ **Retired 2026-06-02** — [`PRICING-RECONCILIATION-2026-06-02.md`](../business/PRICING-RECONCILIATION-2026-06-02.md) | **One customer-facing price story** ✓ |
| Partners | Design-partner mix spans C2–C13 (10 cells) | Wedge = P2b solo Hair C2 | **Weight slots 1–3**; treat 6–10 as signal-only until paid |

### Consolidated scorecard (subjective, May 2026)

| Dimension | Score (1–5) | Note |
|-----------|-------------|------|
| Vision & category thesis | 5 | `livia-bets.md` is investor-grade |
| Documentation & governance | 5 | ADRs, audits, kill criteria rare at this stage |
| Product surface completeness (wedge) | 3 | CRUD largely ✅; rituals uneven |
| Production / commercial readiness | 2 | Founder lane: Stripe prod, 10 shops, legal |
| Competitive differentiation (live) | 3 | Depth exists; market noise rising fast |
| Organizational capacity | 2 | Founder bus factor explicit |
| GTM proof | 1 | Design partners specified; field evidence off-repo |
| Customer support readiness | 3 | Intake + internal queue exist; no dedicated support hire, no email/CRM loop |

---

## 1. Founder & CEO

### Mandate

Set category, capital allocation, narrative, and the **non-negotiable wedge**. Hire slowly. Say no. Own design-partner relationships and counsel relationships. Be the person who can narrate the 90-second demo and the 20-year gravitational pull without conflating them.

### Current state

**Strengths**

- Founding story (`docs/company/founding-story.md`) is coherent: why now (LLM threshold + incumbent bolt-ons + EU regulation), why us (Tuesday walks, eval-before-second-engineer), why Ireland.
- Ten bets with **kill criteria** (`livia-bets.md`) — unusual discipline; Bet 1’s 60% Liv-by-name threshold is the right kind of falsifiable claim.
- Public honesty: `LIVIA-ALIGNMENT.md` admits API ahead of UI; `marketing-vs-reality.md` gates launches — rare integrity.
- Operating principles (F10): category-shaping vs tactical decision classes, kill-switch culture, disagree-and-commit.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Category compression** | P0 | Fresha Concierge + Phorest Ivy ship “name your AI receptionist” and 24/7 booking — your language, their distribution |
| **Scope gravity** | P0 | Repo contains v3-scale surface (medspa, enterprise SSO, partner API, franchise, payroll, design proofs) while v1-scope says Hair-only |
| **Proof gap** | P0 | Gates defined; `FOUNDER-SHIP-LANE.md` items (10 real shops, Stripe prod, legal) are off-platform and gating |
| **Narrative split** | P1 | Alignment doc = OS; positioning doc = colleague — confuses hires, partners, press |
| **Design-partner sprawl** | P1 | Programme targets 10 configurations; wedge is C2 P2b solo — risks diluted learning |
| **Outcome pricing before measurement** | P2 | 4% voice share requires end-to-end attribution (`sourceConversationId`, digest) — partial in engineering |

**Recommendations**

**90 days**

1. Declare **company OKR**: 10 design-partner shops with ≥1 real customer booking/week each; ≥3 paying or signed LOA by day 90.
2. **External narrative lock**: “Livia is the colleague your salon hires. Her name is Liv.” — OS language only in data room / engineering README.
3. **Scope moratorium**: No new vertical surfaces unless tied to a signed design partner in that cell; v3 program runs only blocks N/M (booking continuity, alive UX) until Gate 2.
4. **Weekly CEO scorecard** (15 min): Liv-by-name % (interviews) · recovered bookings (voice/SMS) · marketing-vs-reality reds · SEV count · partner pipeline.
5. **Competitive briefing** monthly: Fresha Concierge, Phorest Ivy — update battlecard; demo first 90 seconds must show audit + cap ladder, not “we have AI.”

**12 months**

- First **case studies** with euro outcomes (conservative; no fear-based €30k ads per sales motion).
- Decide **outcome pricing** default vs optional tier based on measurement, not thesis.
- First hire profile: **CS/onboarding lead** before second senior engineer (bus factor).

**24 months**

- Category defined in market (“colleague” or lose to “AI front desk”).
- Seed/Series A narrative: wedge proof + expansion cells (chair-rental, multi-brand) with separate ARPA stories.

**Metrics**

| Metric | Target (90d) | Target (12mo) |
|--------|----------------|---------------|
| Design partners live (real bookings) | 10 | 30+ |
| Liv-by-name in partner interviews | Track → 60% by month 6 | ≥60% |
| MRR / committed ARR | First paid sub | €10k+ MRR pipeline |
| Partner NPS (informal) | ≥8/10 for wedge cell | Published case studies |
| Marketing-vs-reality G2/G3 blockers | 0 reds at Gate 2 | 0 at Gate 3 |

**Dependencies**

COO for gate execution · CRO for partner recruitment · GC for legal · CPTO for ritual delivery on mobile

---

## 2. President / COO

### Mandate

Turn strategy into **operating rhythm**: gates, lanes, promise integrity, incident posture, design-partner cadence, and separation of “platform-ready” vs “public launch.” Reduce founder bus factor on repeatable ops.

### Current state

**Strengths**

- `launch-plan.md`: five lanes, three gates with explicit acceptance — executable operating system.
- `operating-cadence.md` + F10 principles: async standups, weekly eng demo, Monday promise integrity.
- `STARTUP-KILLERS-AND-MITIGATIONS.md` mapped to phases — use in ops reviews.
- Founder ship lane cleanly splits in-repo vs off-platform (`FOUNDER-SHIP-LANE.md`, `OPEN-ITEMS-DEFERRED.md`).
- `marketing-vs-reality.md` with gating power and Phase 9 re-audit discipline.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Gate 2 not declared** | P0 | Reminders largely resolved in code; prod Inngest/Twilio/Meta + 10 shops still founder |
| **Single operator** | P0 | Killers doc: founder bus factor — no CS/on-call backstop for partners |
| **v3 “whole product every release”** | P1 | Block R release rule is right at scale; expensive pre-revenue |
| **Design-partner ops undefined in repo** | P1 | Programme doc exists; CRM, interview storage (`.local/`) not operationalised |
| **SOC2 / status page** | P2 | Gate 3 items — correct deferral if G2 not passed |

**Recommendations**

**90 days**

1. **One weekly ops doc** (30 min Monday): gate status · marketing-vs-reality · partner count · prod blockers · SEVs.
2. **Gate 2 definition of done** pinned on wall: TestFlight + Play internal + 10 shops + 7-day zero P0 + rows 3/5b ✅ + partner transcripts.
3. **Partner operating system**: slot tracker, weekly interview template, exit interview RFC template — even if spreadsheet-first.
4. **Fractional ops hire** (contract): Twilio/Meta prod provisioning, partner onboarding checklists, status page — founder sells.
5. **Reduce release sweep scope pre-G2**: PR rule “wedge surfaces only” until Gate 2 passed; full Block R after.

**12 months**

- CS lead owns partner cadence; founder joins monthly not weekly for stable accounts.
- Quarterly foundation audit (F10) on calendar with pre-read.

**Metrics**

| Metric | Target |
|--------|--------|
| Gate 2 passed (binary) | By target date |
| Partner weekly interview completion | 100% weeks 1–12 |
| Mean time to acknowledge SEV1 | <15 min |
| Marketing-vs-reality open blockers | 0 at gate |
| Onboarding time to first real booking | <14 days |

**Dependencies**

CEO for partner intros · Founder lane for Stripe/legal · Engineering for prod cron/Inngest

---

## 3. CFO / Head of Finance

### Mandate

Unit economics, pricing integrity, cash runway, billing truth, and **value-based price anchoring** (not cost-plus). Model scenarios: Fresha price war, voice outcome share failure, chair-rental pass-through.

### Current state

**Strengths**

- `pricing-and-packaging.md`: hybrid model (base + seat + 4% voice cap) with worked ROI examples (Conor 25×, chain 4×) — credible for SMB SaaS.
- Ethical lock-in posture: easy to leave, no security upsell — reduces churn risk from resentment.
- Stripe architecture separated (Billing vs Connect) in killers doc — correct PCI/commercial split.
- Design-partner 50% Y1 — clear CAC subsidy with extraction (interviews, case studies).

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Pricing story fracture** | ~~P1~~ **Resolved 2026-06-02** | F9 locked; legacy tiers retired | Reconcile Stripe products at Gate 3 |
| **Voice outcome unproven** | P1 | 4% of booking value requires attribution chain; if digest lies, trust dies |
| **Fresha economic warfare** | P1 | Free + payments + marketplace on solo cell — cannot win on price |
| **Scope burn** | P1 | Every vertical pack = support + eval cost not in financial model |
| **No published actuals** | P2 | Pre-revenue; model exists, field validation missing |

**Recommendations**

**90 days**

1. **Customer-facing simplification**: Marketing shows **Studio from €149/mo** (or Solo €79) with “details in contract”; internal model stays hybrid.
2. **Voice outcome pilot**: First 3 partners on **fixed fee only**; add outcome share only when weekly digest shows recovered € with audit IDs.
3. **Cell-level unit economics**: Track CAC hours (founder time) per partner; kill cells that take >40h onboarding before value.
4. **Cash model**: 18-month runway sheet with hire scenarios (CS vs engineer) — CEO decision input.

**12 months**

- Annual prepay -15% conversion tracking.
- Chair-rental pass-through decision (host pays vs renter) from partner 7–8 data.

**Metrics**

| Metric | Target |
|--------|--------|
| Gross margin per tenant (model vs actual) | >70% SaaS target |
| Voice outcome billing disputes | 0 |
| LTV:CAC (founder-led) | >3:1 by partner 10 |
| Net revenue retention (cohort 1) | >90% at month 12 |

**Dependencies**

CRO for pipeline · Product for attribution · GC for contract terms · CEO for pricing changes (category-shaping)

---

## 4. VP Product

### Mandate

Persona×configuration depth, ritual quality (Tuesday morning, Manager queue, voice wedge), kill criteria for bets, and **ruthless scope** against `v1-scope.md`. Own `marketing-vs-reality` product rows.

### Current state

**Strengths**

- Personas v2 + hotel principle — serious UX tenet.
- Depth table (`livia-positioning.md`) with R1–R5 rungs — roadmap tied to trust, not features.
- Demo sequence (`sales-motion.md`) — correct story order.
- `LIVIA-IDEA-TO-REALITY.md` — honest CRUD/UX gap analysis.
- Surface matrix (2026-05-22): core entities largely ✅ web; mobile partial.
- v1 workflow ledger: book, refund ladder, no-show, time-off, digest, liv-was-wrong — aligned with bets.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Ritual ≠ shipped** | P0 | Morning briefing ⏸ mobile; “Tuesday morning” not proven E2E on flagship |
| **v1-scope vs v3 build** | P0 | v1 says Hair-only; repo builds medspa, fitness, DE packs |
| **Trust ratchet UI deferred** | P2 | Bet 3 v1.5 — OK if v1 ships rung behaviour without promotion theater |
| **Manager queue under-marketed** | P1 | Differentiator vs Ivy; must be first-class in demo |
| **Public chat mobile ⏸** | P2 | Customer experience gap on flagship for staff, not owner wedge |
| **Cross-tenant intelligence** | P3 | Correctly deferred; don’t sell early |

**Recommendations**

**90 days — North-star rituals (ship or cut from demo)**

1. **Owner Tuesday (mobile)**: 07:30 briefing or honest slim version — 3 decisions, tap to audit.
2. **Voice recovery path**: Missed call → booking → appears in digest with € estimate.
3. **Manager queue**: Inbox split — Liv acted / needs you — cap-bound refund visible.
4. **Liv was wrong**: Basic apology card shipped (Bet 5 v1.5 minimum for partners).
5. **Booking continuity** (v3 Block N): Scenario 01 — web DM → booked — **soul of Phase 1** per v3 program.

**Cut / defer from wedge**

- Peer insights, enterprise SSO, partner API, medspa consent, DACH campaigns — until G2 + 10 partners.
- Morning briefing on web-only if mobile ships slim version.

**12 months**

- Trust ratchet promotion UI (Bet 3) when >30% partners would promote.
- Audit diary voice (Bet 4 v1.5).

**Metrics**

| Metric | Target |
|--------|--------|
| % partners using mobile ≥4 days/week | >50% |
| Time to first recovered booking | <21 days |
| Manager queue actions/week (mgr personas) | >5 |
| Bet 1 Liv-by-name | 60% by month 6 |
| Feature retire candidates identified | Quarterly |

**Dependencies**

Design for ritual UX · Engineering for mobile · CAIO for eval · CRO for demo feedback

---

## 5. VP Engineering / CTO

### Mandate

Platform kernel reliability, tenant safety, contract (OpenAPI), workflow durability, observability, and **shipping wedge surfaces** without expanding domain surface area. Protect eval + audit moat.

### Current state

**Strengths**

- Monorepo discipline: Drizzle schema, OpenAPI codegen, ADRs, tenant AsyncLocalStorage, audit chain.
- Workflow engine (Inngest): booking-reminder, no-show, liv-was-wrong, booking-continuity, waitlist, etc.
- Entitlements gate, metering, partner auth scaffolding — enterprise-shaped.
- Graceful transport degradation — production thinking.
- CI: typecheck graph, codegen guard, brand guards (legacy codename / Olivia).
- Phase 9 audit: reminders, billing API, rate limits, batch cockpit — engineering closed many G2 items.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **UI parity debt** | P1 | Idea-to-reality: web ahead of mobile; staff edit thin on mobile |
| **Prod config gap** | P0 | Inngest/Twilio/Meta/Stripe prod = founder lane |
| **Scope surface area** | P1 | 40+ route modules — support burden |
| **“Conductor” under-documented** | P2 | Kernel map in idea-to-reality — onboard friction |
| **Internal portal spec’d not built** | P2 | Doc graph, RBAC for Livia Inc ops |
| **Dependency on env** | P1 | Features “degrade” — partners may hit silent partial product |

**Recommendations**

**90 days**

1. **Wedge engineering OKR**: Mobile owner path + voice + Manager queue + booking continuity — no new route modules outside that list without CEO RFC.
2. **Prod hardening sprint** (with founder keys): Inngest prod, reminder path, voice IE, Sentry release tags.
3. **Integrations priority**: Booksy/Phorest import path > medspa procedures.
4. **SLO dashboard**: API p95, workflow failure rate, Liv tool error rate — internal ops first.
5. **Document Platform Kernel** (one diagram) in `docs/engineering/` — link from onboarding.

**12 months**

- `lib/design-system` extraction (launch-plan E7).
- Dependency-cruiser / boundary lint.
- SOC2 controls mapped to code paths.

**Metrics**

| Metric | Target |
|--------|--------|
| CI green on main | 100% |
| P0 incidents / 7d rolling | 0 at Gate 2 |
| OpenAPI drift | 0 |
| Mobile wedge E2E green | Smoke on PR |
| Workflow completion rate | >99% |

**Dependencies**

Founder for prod secrets · Product for scope · COO for release policy pre-G2

---

## 6. VP Design / Head of Product Design

### Mandate

Aurora-Midnight craft, persona rituals, mobile flagship (ADR 0011), WCAG, motion discipline, and **Liv presence without chatbot chrome**. Brand bible adherence.

### Current state

**Strengths**

- ADR 0004 marketing as brand bible; 0007 aurora tokens; 0008 mobile motion.
- `PRODUCT-UX-SYSTEM.md`, experience spec v3 — motion and alive UX direction.
- Persona rituals in code (`persona-rituals.ts`).
- Demo gateway spec — experience designed for sales, not accidental.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **No UX quality program** | P1 | Idea-to-reality: rogue colours, no systematic axe |
| **Mobile flagship gap** | P0 | Policy edit 🟡; briefing ⏸; public chat ⏸ |
| **Web flat vs mobile motion** | P2 | Inconsistent “alive” promise |
| **Character in UI** | P1 | Liv voice in audit/briefing not consistent everywhere |
| **Booking flows “not beautiful”** | P2 | Founder-felt gap — conversion risk on public `/b` |

**Recommendations**

**90 days**

1. **Wedge screen list** (≤12 screens): owner today, inbox, audit, booking detail, public book, settings AI — Figma or in-code polish pass each.
2. **axe on critical routes** in CI (idea-to-reality target).
3. **Motion M1.1** shared tokens — one subtle stagger on inbox + public next-steps (v3 Block M).
4. **Liv typography** on audit + apology cards — diary voice preview (Bet 4).
5. **Responsive matrix** for owner cockpit — tablet in salon use.

**Metrics**

| Metric | Target |
|--------|--------|
| Lighthouse dashboard/public | ≥90 Gate 3 |
| WCAG violations on wedge paths | 0 critical |
| Design partner “feels premium” | Qual ≥4/5 |

**Dependencies**

Product for ritual definition · Engineering for implementation

---

## 7. CMO / VP Marketing

### Mandate

Category creation, `livia.io` truth, brand-of-Liv, competitive positioning vs “AI receptionist” noise, and **proof-led content** (not feature lists).

### Current state

**Strengths**

- Positioning line defensible: colleague, not platform.
- Manifesto + bets — rich narrative source.
- Marketing-vs-reality audit culture — trust weapon.
- EU AI disclosure centralised — compliance marketing possible.
- Phorest Irish origin — you can own “operator-first” not “chain dashboard.”

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Category noise** | P0 | Fresha “world’s most recommended AI-powered booking platform” + Concierge |
| **Ivy copies your playbook** | P0 | Named AI, introduced as team member — Phorest 9k salons |
| **livia.io gate** | P1 | Not live at Gate 3; beta needs honest staging |
| **SEO commodity trap** | P2 | “AI salon software” unwinnable |
| **Medspa/vertical claims** | P1 | Must not outrun `marketing-vs-reality` |

**Recommendations**

**90 days**

1. **Content pillars**: (a) audit transparency (b) chair-rental/multi-brand (c) EU trust — not generic AI.
2. **Competitive pages** (internal): Livia vs Ivy vs Concierge — structural diff table.
3. **Partner co-marketing** prep for month 6 — template only, no blast before proof.
4. **“How we comply”** EU AI Act page — informational, counsel-reviewed.
5. **Hold Product Hunt** until Gate 3 + one killer case study.

**12 months**

- Liv Mark / consumer pull (Bet 6) — only if salon base exists.

**Metrics**

| Metric | Target |
|--------|--------|
| Inbound demo requests / month | Track from G3 |
| Marketing site conversion to trial | Benchmark post-launch |
| Share of voice “colleague” vs “AI receptionist” | Qual tracking |
| Claim audit reds | 0 |

**Dependencies**

GC for legal copy · Product for truth · CRO for demo conversion data

---

## 8. CRO / VP Sales & Revenue

### Mandate

Design-partner pipeline, demo-to-pilot conversion, migration from incumbents, and **cell-appropriate ICP** discipline. Never fear-based selling.

### Current state

**Strengths**

- `design-partner-programme.md`: 10-slot mix, mutual fit, exit terms — ethical.
- `sales-motion.md`: buyer vs influencer map, demo script, never-do list.
- Operator ready pack — reduces blank-policy onboarding cliff.
- Wargame scenarios 1–2 with pre-decided moves.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Zero public logos** | P0 | Case studies month 6 planned — need month 1 signal |
| **Phorest home market** | P0 | Irish incumbent with Ivy — wedge must be structural |
| **Migration unproven** | P1 | Booksy import in tree; concierge motion not repeatable |
| **10-cell partner mix** | P1 | Spreads founder attention; slots 1–3 should dominate |
| **Fresha free tier** | P1 | Solo price-sensitive — avoid or own “no marketplace cut” story |

**Recommendations**

**90 days**

1. **Pipeline reality**: 15 conversations → 10 signed partners — track in CRM.
2. **Lead with slots 1–3** (C2 P2b hair); slots 6–10 only if warm intro zero cost.
3. **Battlecard refresh** (May 2026): Ivy + Concierge — demo minutes 2–4 audit + cap ladder.
4. **Migration offer**: Phorest/Fresha/Booksy white-glove — document hours per incumbent.
5. **Receptionist enablement**: 1-page “hand off to Liv” for P6 influencers.

**12 months**

- Shadow hire for founder sales (customer 20–50).
- UK expansion only after IE wedge Liv-by-name hits 60%.

**Metrics**

| Metric | Target |
|--------|--------|
| Signed design partners | 10 |
| Pilot → paid conversion | >70% at month 12 |
| Sales cycle days (warm) | <45 |
| Referrals per partner | ≥0.5 |

**Dependencies**

CEO for warm intros · Product for demo · CS for onboarding · Engineering for import

---

## 9. VP Customer Success (post-sale growth & retention)

### Mandate

**Proactive** partner and customer outcomes: onboarding to habit, expansion within the account, churn prevention, NPS, case studies, and **making Liv indispensable by week 3**. Customer Success is **not** the same as Customer Support — Success owns the relationship journey; Support owns break/fix and SLAs (§10).

### Current state

**Strengths**

- `design-partner-programme.md`: weekly interviews, exit terms, co-marketing rights.
- `OPERATOR-READY-PACK.md`: week-zero checklist reduces blank-slate onboarding.
- Failure mode: free migration out on unhappy exit — trust-preserving.
- Templates: running late, leave, policies, team-on-Liv.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **No CS headcount** | P0 | Founder doing sales + success = bottleneck |
| **Onboarding cliff** | P1 | Wizard exists; habit loop (recovery, briefing) unproven |
| **Silent failures** | P0 | Owners discover via angry customers before Success hears |
| **Staff resentment** | P1 | P5 dignity — bad rollout = owner churn |
| **Success/Support blur** | P1 | Founder answers tickets during “onboarding calls” — neither function scales |

**Recommendations**

**90 days**

1. **Success metric**: first recovered booking <21 days; second week ≥3 Liv-handled interactions.
2. **Onboarding playbook** (day 0–14): OPERATOR-READY-PACK enforced; voice test on day 7.
3. **Office hours**: weekly cohort call (success content, not ticket triage).
4. **Handoff rule**: tickets go to Support queue; Success does not debug in WhatsApp DMs.
5. **Exit interview RFC** before first churn.

**12 months**

- Customer council (top 50) per `sales-motion.md` Stage 3.
- Case studies at months 6/12 with partner approval.

**Metrics**

| Metric | Target |
|--------|--------|
| Partner activation (voice live) | 100% wedge slots |
| Time to first booking via Liv | <14 days |
| Churn (year 1 cohort) | <10% |
| Partner NPS (informal) | ≥8/10 wedge cell |

**Dependencies**

Support for ticket SLAs · Engineering for reliability · CRO for expectations · Product for rituals

---

## 10. VP Customer Support (operations & break/fix)

### Mandate

**Reactive** excellence for tenant operators (owners, managers, staff): fast triage, honest answers, Liv-incident handling, billing confusion resolution, and escalation to engineering without burning founder time. Support is the **human backstop** behind the colleague frame — when Liv or the product fails, Support proves Livia Inc is trustworthy.

**Scope clarification**

| Audience | Support owner | Channel |
|----------|---------------|---------|
| **Tenant users** (P1–P6) | Livia Inc Support | In-app Report issue, email support@livia.io, internal queue |
| **End customers** (P7) | Salon + Liv first | Public book/chat/voice; salon escalates to Livia via Support ticket |
| **Design partners** | Support + Success | Same ticket path; **4h SLA** for blocking; Success owns relationship |

### Current state — facilities inventory

**Built (in-repo, demonstrable)**

| Facility | Location | Maturity |
|----------|----------|----------|
| Tenant ticket intake | `POST /businesses/:id/support/tickets` | ✅ |
| Help UI (web) | `help-support-dialog.tsx` — category, severity, consent, route context | ✅ |
| Help UI (mobile) | `HelpSupportSheet.tsx` | ✅ |
| Auto-triage rules | `support-ticket-triage.service.ts` — priority, tags, suggestedReply | ✅ |
| Liv error → workflow | Inngest `support/liv_error.reported` → incident log | ✅ |
| Internal support queue | `livia-internal` Support tab — filter, assign, lifecycle | ✅ v1 |
| Internal ticket API | `PATCH /internal/ops/support-tickets/:id` + RBAC headers | ✅ |
| Liv incident bundle | `/liv-incident` on ticket — conversation, requestId, hints | ✅ |
| Tenant health context | `/internal/ops/tenants/:id/support-context` | ✅ |
| Support runbook | `docs/operations/support-runbook.md` | ✅ |
| Ticket lifecycle doc | `docs/operations/INTERNAL-SUPPORT-LIFECYCLE.md` | ✅ |
| Operator self-serve docs | `OPERATOR-READY-PACK.md` §6, templates/ | ✅ |
| Demo seed tickets | `demo-support-tickets.seed.ts` | ✅ dev |

**Partial / founder-dependent**

| Facility | Gap |
|----------|-----|
| Email loop | Tickets say “we’ll respond via email” — **no Resend template / ticket-reply automation** wired |
| SLA measurement | Targets in runbook (4h blocking) — **no dashboard or breach alerts** |
| Workforce SSO | Internal portal uses secret + operator headers — **not production SSO** |
| Knowledge base in portal | `KnowledgeView.tsx` read-only docs — **no search macros / canned replies library** |
| Impersonation | Spec’d P2 — **not built**; support reproduces on demo tenant |
| CRM sync | Linear/Intercom — **open question** in portal spec |
| Status page linkage | Incident flow documented — **not one-click from ticket** |
| Canned responses | `suggestedReply` from triage only — **no editable macro library** |
| Partner-visible ticket status | Tenants cannot see ticket status in-app — **email-only promise** |
| 24/7 coverage | Not staffed — design partners need **published hours** |

**Not built (planned in portal spec P0–P3)**

- Fleet analytics for support (ticket volume by vertical, Liv error rate).
- Finance roll-ups in portal for billing tickets.
- Kill-switch Liv from UI (founder/on-call only today).

### Gaps & risks

| Risk | Sev | Detail |
|------|-----|--------|
| **Founder = support** | P0 | Every blocking ticket lands on founder; Gate 2 with 10 shops breaks without hire |
| **Email gap** | P1 | In-app submit works; **response path undefined** for customers |
| **SLA invisible** | P1 | Cannot manage what you don’t measure |
| **Liv errors at scale** | P1 | `liv_error` category will spike when voice goes prod — need L2 playbook |
| **Support under-resourced in plan** | P1 | Executive plan listed “CS contractor” only — must include **support queue hours** |
| **P7 confusion** | P2 | End-customers think Support@livia is their salon — need clear copy |

**Recommendations**

**90 days — Support operating minimum (before shop 6)**

1. **Publish** [`docs/operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md`](../operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md) — SLAs, hours, escalation tree (this doc is the canonical ops spine).
2. **Hire or contract Support L1** (0.5 FTE min): internal portal queue, 9–17 IE business hours; founder = L2/escalation only.
3. **Email**: `support@livia.io` → shared inbox; link ticket id in subject; template for first response <4h blocking.
4. **Daily queue ritual** (15 min): open tickets, assign, check Liv-incident bundle; Monday add to exec scorecard.
5. **Macros v1**: 10 canned replies from triage `suggestedReply` + runbook — stored in ops doc until portal macros ship.
6. **Partner SLA**: design partners get published **blocking 4h / annoying 2 business days** in partner letter.
7. **Do not** promise 24/7 human support until staffed; Liv + status page for after-hours.

**12 months**

- Workforce SSO on `internal.livia.io`.
- Ticket status page for tenants (read-only: open/triaged/resolved).
- Linear integration for engineering escalation.
- Support L2 hire when >30 active tenants or >20 open tickets/week.
- SOC2 access reviews for `support_l1` / `support_l2` roles.

**Metrics**

| Metric | Target (90d) | Target (12mo) |
|--------|----------------|---------------|
| First response time (blocking) | <4h business | <2h |
| First response time (annoying) | <2 business days | <1 day |
| Tickets resolved without founder | >80% | >95% |
| Liv_error tickets with incident bundle used | 100% | 100% |
| SLA breach count / week | 0 for partners | <2% all tenants |
| CSAT on closed tickets (optional 1-q survey) | Baseline | ≥4/5 |

**Dependencies**

COO for hire · Engineering for email automation · CAIO for Liv-incident quality · GC for support@ legal mention in ToS · Success for handoff rules

**Facilities roadmap (Support-specific engineering)**

| Priority | Build | Owner |
|----------|-------|-------|
| P0 | Resend ticket-ack + status-update emails | Eng |
| P0 | Internal portal: SLA clock on ticket row | Eng |
| P1 | Tenant ticket list + status in Settings → Help | Eng |
| P1 | Canned reply library in internal portal | Eng |
| P2 | Impersonation (spec) | Eng + GC |
| P2 | Linear webhook on `liv_error` urgent | Eng |

---

## 11. General Counsel / Chief Compliance Officer

### Mandate

GDPR, EU AI Act, consumer protection, employment-law adjacency, market-by-market launch clearance, and **contract templates** that match product truth.

### Current state

**Strengths**

- `regulatory-and-legal.md`: conservative AI Act posture (build as plausibly high-risk).
- DPA, sub-processors, RTBF, audit tombstones — ADR-aligned.
- `lib/ai-disclosure` wired to chat, email, SMS, voice.
- Cross-tenant intelligence opt-in — ethical default.
- Medspa/clinical explicitly deferred in target-state doc.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Counsel not signed** | P0 | FOUNDER-SHIP-LANE: ToS, Privacy, DPA PDFs |
| **EU residency not codified** | P0 | marketing-vs-reality row 6b — ADR + deploy |
| **WhatsApp claims** | P1 | Row 1 deferred — must stay off marketing |
| **Voice classification** | P2 | Limited risk if scheduling-only; document per feature |
| **Employment adjacency** | P2 | Rota/time-off — human confirm paths must hold in product |

**Recommendations**

**90 days**

1. **Counsel engagement** for IE launch package — gate G3 blocker.
2. **AI classification memo** per surface (voice, refund, rota) — 2-page internal.
3. **DPA + sub-processor page** live with prod vendors (Anthropic, Twilio, Clerk, Stripe).
4. **Block medspa marketing** until consent workflows + counsel per market (v3 hard gate).
5. **Insurance exploration** for Bet 5 mistake cap — broker conversation.

**Metrics**

| Metric | Target |
|--------|--------|
| Legal docs signed | G3 |
| Residency ADR published | G3 |
| DSR request SLA | Statutory |
| Regulatory incident | 0 |

**Dependencies**

CEO for counsel relationships · Engineering for residency · CMO for claim sync

---

## 12. VP People / CHRO

### Mandate

Hiring sequence, EU employment posture, culture (async, kill-switch, blameless PM), and **reducing founder heroics**.

### Current state

**Strengths**

- Operating principles: remote EU, core overlap CET, fair leave.
- Hiring story in founding-story — eval lead before second engineer (values signal).
- On-call rotation spec (~1 in 6) — humane.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Team size ~1** | P0 | All hats on founder |
| **Wrong first hire** | P1 | Second engineer vs CS — CEO must choose |
| **Character talent gap** | P2 | Bets need writers/voice directors at scale — not now |

**Recommendations**

**90 days**

1. **First hire**: CS/onboarding contractor 0.5–1 FTE equivalent.
2. **Second hire** (post-G2): full-stack or mobile with product taste — not platform expansion.
3. **Job descriptions** from founding-story “what we tell hires.”
4. **Equity**: design-partner grants only first 3 per programme — document cap table impact.

**12 months**

- Eval lead / senior engineer if wedge proven.
- Character writer fractional when Bet 1 hits 40% Liv-by-name.

**Metrics**

| Metric | Target |
|--------|--------|
| Time to fill first hire | <60 days |
| eNPS (when ≥5 people) | >40 |
| On-call pages outside SEV1 | Trend to 0 |

---

## 13. Chief AI Officer / VP ML (Liv runtime)

### Mandate

Eval framework (ADR 0016), tool registry, policy-bound agent, voice quality, cost envelope, and **honest capability claims**.

### Current state

**Strengths**

- Eval traces, prompt store, liv-pack, operational policy services in tree.
- Refusal taxonomy in bets — termination, performance feedback hard nos.
- Anthropic wrapper isolated — swappable.
- Liv workflows: was-wrong, continuity — agent as operator not chat.

**Gaps & risks**

| Risk | Sev | Detail |
|------|-----|--------|
| **Commoditisation of chat** | P0 | Concierge/Ivy match booking+DM baseline |
| **Voice kill criteria** | P1 | CSAT below baseline at 3 months — monitor from day 1 |
| **Eval not in customer-facing metric** | P1 | Partners don’t see quality scores |
| **LLM cost drop** | P2 | Wargame scenario 7 — accelerate eval, don’t cut price |
| **Hallucination on refunds** | P0 | Cap ladder + human confirm — must never slip |

**Recommendations**

**90 days**

1. **Partner-visible quality**: weekly “Liv accuracy” slice in digest — bookings corrected / apologies.
2. **Voice eval set** English-IE: 50 scenarios from design partners — run pre-release.
3. **Tool boundary audit**: no tool executes above rung policy.
4. **Online eval** on refund + booking tools — block deploy on regression.
5. **Competitive eval** (internal): Ivy/Concierge public claims vs Liv on test set — no publication until counsel OK.

**Metrics**

| Metric | Target |
|--------|--------|
| Tool call success rate | >98% |
| Refund over-cap without approval | 0 |
| Voice scenario pass rate | >95% |
| Customer complaint rate re Liv | <1% interactions |

**Dependencies**

Product for rung policy · Engineering for deploy · GC for disclosure

---

## 14. Board / Investor lens

### Mandate

Return on capital, market timing, moat durability, exit optionality, and **honest stage labeling** (pre-seed / seed).

### Investment thesis (bull)

- Category reframe with kill criteria and EU regulatory moat.
- Platform depth (audit, workflows, multi-tenant, packs) hard to replicate in 12 months.
- Structural niches Phorest weak on: chair-rental, multi-brand, Senior-w-admin.
- Market growth ~10% CAGR salon software; AI driver — TAM sufficient.
- LLM cost curve favourable (scenario 7).

### Bear case

- Fresha $1B + KKR — distribution and AI Concierge at scale.
- Phorest Ivy in home market with 9k salons and Irish roots.
- Pre-revenue with v3-scope build — looks like Series A scope at seed stage risk.
- Character bet may read as gimmick if Liv-by-name <60%.
- Founder concentration.

### What would change investor mind (12 months)

| Proof | Why it matters |
|-------|----------------|
| 10+ paying tenants, 3 case studies | Revenue reality |
| Liv-by-name ≥60% | Category bet validated |
| Recovered € documented | Outcome pricing credible |
| <5% monthly churn cohort 1 | Retention |
| Zero marketing-vs-reality reds | Execution integrity |
| 1 niche dominant (chair-rental OR solo) | Expansion story |

### Round framing recommendation

- **Now**: pre-seed / angel — wedge + design partners + platform optionality.
- **Raise seed after Gate 2** with partner transcripts + recovered revenue logs, not before.
- **Do not pitch** medspa/DACH/enterprise SSO as near-term — upsell roadmap only.

---

## 15. Cross-functional tensions & resolution

| Tension | Resolution mechanism | Decision owner |
|---------|---------------------|----------------|
| v1 scope vs v3 program | CEO moratorium + COO release policy | CEO |
| Engineering breadth vs mobile polish | Wedge OKR list in CTO 90-day | CPTO (founder) |
| Hybrid pricing vs simple marketing | CFO simplification external, hybrid contract | CEO |
| Conservative legal vs aggressive GTM | marketing-vs-reality + GC review | CEO + GC |
| Design-partner mix vs wedge focus | CRO weights slots 1–3 | CEO |
| Character investment vs shipping | Bet 1 kill criteria at month 6 | CEO + CMO |
| Success vs Support staffing | CS owns onboarding; Support owns tickets/SLAs | COO |

**Escalation**: category-shaping → founder RFC. Tactical → PR. Veto on foundation contradiction → documented dissent (F10).

---

## 16. Consolidated risk register (top 22)

| # | Risk | P | Owner hat | Mitigation |
|---|------|---|-----------|------------|
| 1 | No paying/partner proof | P0 | CEO | 10 shops OKR |
| 2 | Fresha/Phorest AI parity narrative | P0 | CMO/CRO | Structural battlecard |
| 3 | Founder bus factor | P0 | COO/CHRO | CS + Support L1 hire |
| 4 | Scope sprawl vs v1 | P0 | CEO/Product | Moratorium |
| 5 | Mobile wedge incomplete | P0 | Product/Design | Ritual sprint |
| 6 | Legal unsigned | P0 | GC | Counsel |
| 7 | EU residency undeclared | P0 | GC/Eng | ADR + deploy |
| 8 | Stripe Connect deposits | P0 | Founder/Eng | #58 |
| 9 | Voice claims before prod Twilio | P1 | COO | Env gate |
| 10 | Outcome pricing before attribution | P1 | CFO | Defer share |
| 11 | Marketing lies at login | P1 | CMO | Audit |
| 12 | Onboarding cliff | P1 | CS | Ready pack |
| 13 | Silent workflow failures | P1 | Eng/Ops | Sentry + Inngest prod |
| 14 | Staff resentment | P1 | Product/CS | Dignity rollout |
| 15 | Pricing story fracture | P1 | CFO | One external model |
| 16 | Design-partner dilution | P1 | CRO | Slot weighting |
| 17 | Medspa liability | P1 | GC | No market until counsel |
| 18 | Bet 1 character fails | P2 | CMO | Kill criteria month 6 |
| 19 | Ivy existing-client-only limit | P2 | CRO | New-client acquisition story |
| 20 | Well-funded EU AI clone | P2 | CEO | Speed + partners |
| 21 | Support email loop missing | P1 | Support/Eng | Resend ack + shared inbox |
| 22 | SLA breaches at 10 partners | P1 | Support | L1 hire + daily queue ritual |

---

## 17. Competitive intelligence appendix (May 2026)

### Fresha

- **Funding / scale**: ~$1B valuation; KKR $80M (2025–2026 reporting); payments + marketplace monetisation.
- **AI**: Fresha Connect + **AI Concierge** — calls, messages, booking, payments, reschedules; English first; global rollout narrative.
- **Threat level**: **High** on solo/small studio (C2/C4) price and distribution.
- **Livia counter**: No marketplace customer ownership; audit + role hierarchy; EU-native depth; chair-rental/multi-brand.

### Phorest

- **Scale**: 9k+ salons; Irish-developed; strong UK/IE.
- **AI**: **Front Desk AI (Ivy)** — SMS/WhatsApp; customizable name; test mode; handover; existing clients emphasis in launch materials.
- **Threat level**: **High** in Ireland; **medium** on chain rollup (their moat).
- **Livia counter**: Structural wedges (C10, C13, P4b); audit-as-product; voice outcome economics; not chain-dashboard fight.

### Booksy

- **Strength**: Marketplace, mobile, Boost gap-fill; EU presence.
- **Threat**: Medium in UK/Nordics; lower IE.
- **Livia counter**: Migration tooling; “customer belongs to salon.”

### Zenoti / Boulevard / Treatwell

- Enterprise or marketplace plays — **low near-term** for IE wedge; watch UK.

### New entrants (Scenario 5)

- Expect 2+ EU “AI appointment” startups in 18 months.
- **Defense**: design-partner network, eval depth, character brand, EU compliance content.

### EU AI Act (scheduling/voice)

- Pure appointment scheduling + transparency: typically **limited risk** (Art. 50 disclosure).
- **High-risk** if triage, employment scoring, or access decisions — your medspa/allied-health caution is correct.
- Commission draft guidance and timeline shifts (2026–2027) — GC to track; use as trust marketing, not fear.

### Market size (directional)

- Salon/spa software ~$1B+ (2025), growth ~10%+ CAGR (multiple analyst reports) — large enough; **winner = distribution + trust**, not TAM slides.

---

## 18. Document maintenance

| Cadence | Action |
|---------|--------|
| Monthly | CEO + CRO: update §16 competitive appendix |
| Quarterly | Full re-read; adjust risk register |
| Gate 2 / Gate 3 | Pass/fail against launch-plan + this doc’s metrics |
| Post–design-partner cohort | Bet kill criteria review |

**Changelog**

- 2026-05-26: Initial executive multi-hat review (discussion artefact).
- 2026-05-26: Split Customer Success vs Customer Support (§9–§10); facilities inventory + support risk rows.

---

*For execution split (founder vs AI-assisted work), see [`EXECUTIVE-ACTION-PLAN.md`](./EXECUTIVE-ACTION-PLAN.md).*
