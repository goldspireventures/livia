# Livia wide build plan — vision, architecture, and execution

**Status:** canonical (2026-05-30) · **Build paused** until G-DOC/G-VISUAL ([`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md))  
**Audience:** founder, product, engineering, agents  
**Role:** **How to build Livia correctly** — widens founder intent into a full company + product + engineering program.

**Category:** People-business OS (appointments + thick guest surfaces + Liv) — not salon-only. GTM wedge remains IE hair until Gate 2 ([`SCOPE-MORATORIUM.md`](./SCOPE-MORATORIUM.md)).

**Authority stack (when docs disagree):**

| Layer | Document |
|-------|----------|
| **Locks & release scope** | [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) |
| **This doc** | Vision, org shapes, cascade architecture, business expansion, build sequencing |
| **Living progress** | [`operations/R1-BUILD-STATUS.md`](../operations/R1-BUILD-STATUS.md) · [`R2-BUILD-STATUS.md`](../operations/R2-BUILD-STATUS.md) |
| **Checkboxes** | [`operations/PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md) |

---

## 0. Executive summary

Livia is an **operator OS for appointment businesses** — bookings, staff, inbox, chain roll-up, and **thick guest surfaces** (/b, tokens, `/my`) — with **Liv** as a colleague, not a chatbot bolt-on.

**Build correctly** means:

1. **Policy-first** — rules live in `lib/policy`; UI/API are thin renderers.  
2. **Register once, cascade down** — new vertical or new business triggers a known fan-out (today: compile-time + seed; north-star: lifecycle registry + CI).  
3. **Structure × vertical** — *how the org is shaped* (solo, studio, chain, host, franchise) is orthogonal to *what industry* (hair, medspa, body art). Demo, onboarding, and nav must respect both.  
4. **Thick Livia, thin channels** — SMS/WhatsApp/voice carry links; proof, consent, pay, hub live on Livia URLs.  
5. **One staging truth** — demo graph = onboarding seed = E2E slugs = registry rows.

**Where we are:** R1 engineering **14/14 automated**; **founder staging walkthrough** closes R1. R2 foundations ~25% (guest hub, intake/waitlist tokens, support registry). **Next:** sign off R1 on staging, then R2 Wave 1 in §6.

---

## 1. Widened vision — what Livia becomes

### 1.1 Category (stay disciplined)

| We are | We are not |
|--------|------------|
| Operator OS + Liv for shops that run on appointments | Generic CRM or website builder |
| Owned customer relationship (shop keeps the client) | Marketplace taking demand + commission |
| Vertical-aware platform (one engine, many playbooks) | One vertical SaaS clone |
| EU-first, IE wedge GTM | “Every country day one” |

### 1.2 The five product layers (business expansion — sequenced)

Build **depth on layer 1–3 before chasing 4–5**.

| Layer | What customers buy | Monetization | Release |
|-------|-------------------|--------------|---------|
| **L1 — Core OS** | Book, calendar, inbox, staff, rota, today/my-day | SaaS seat + tier (solo/studio/chain) | R1 ✓ |
| **L2 — Guest** | `/b`, visit/proof/consent tokens, `/my` hub | Conversion + retention; reduces churn | R1 shell → **R2 depth** |
| **L3 — Money** | Deposits, pay links, no-show protection | % GMV or add-on | **R2** |
| **L4 — Intelligence** | Liv mandate (suggest → act → voice), proactive Radar | Premium tier / seat uplift | R2 guardrails → R3 voice |
| **L5 — Network** | Quality registry (opt-in discovery), franchise OS, partner API | Listing / franchise / platform fee | R3+ |

**Widen beyond “booking app”:** Layer 2–3 is the moat vs Fresha/Calendly. Layer 4 is the premium story. Layer 5 only after 10 paying shops prove L1–L3.

### 1.3 Surfaces (W1–W6) — one company, six worlds

See [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md). Never merge chrome between worlds.

| World | Who | Job |
|-------|-----|-----|
| W1 Marketing | Prospects | Belief + waitlist |
| W2 Gateway | Prospects + demo | Try before buy (`/demo` structure + vertical) |
| W3 Internal | Livia ops | Support, exec, tenant admin |
| W4 Tenant | Owner/staff | Run the shop |
| W5 Public | End customer | Book + thick guest flows |
| W6 Guest hub | End customer cross-shop | `/my` — vault, book-again, Liv orchestrator |

---

## 2. Who we serve — org shapes (real life → product)

Real businesses map to [`org-shape.ts`](../../lib/policy/src/org-shape.ts) configuration codes. **Product and demo must expose these honestly.**

| Real life | Livia shape | Founder surface | Demo scenario (W2) |
|-----------|-------------|-----------------|---------------------|
| Solo at home / mobile | C1/C2 solo | my-chair / today | Solo owner (Conor's) |
| Solo small studio + maybe 1 helper | C2/C4 | today | Solo / body art / medspa vertical cards |
| One shop + team + desk | C4–C6 studio | today | **Studio with team** (Luxe) |
| Owns 2–5 locations | C7 chain | glance `/chain` | **Multi-site founder** (Aurora HQ) |
| Runs one site in a group (local P&L) | C7 location | today (no rollup) | Location operator under multi-site (Mews) |
| Rents chairs to independents | C10 chair-host | `/host` | **Chair-rental host** (Aurora) |
| Franchisee | franchise tier | today + franchisor reporting | Franchisee (Bloom) |
| Multi-brand portfolio | C13 | glance | R3 demo |

**Rule:** Structure scenarios on `/demo` test **permissions and surfaces**. Vertical cards test **guest + compliance flows**. Do not conflate them.

**Demo debt (R2):** Aurora is a **composite** (chain HQ + host + franchisor). Split or document; see §8.

---

## 3. How to build correctly — the platform cascade

### 3.1 Hub-and-spoke (today)

```text
                    ┌──────────────────────────────┐
                    │  lib/policy (Ring 1)         │
                    │  vertical pack · onboarding  │
                    │  guest surfaces · presets    │
                    └──────────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   OpenAPI + codegen        tenant-experience API       VERTICAL_COVERAGE_REGISTRY
         │                         │                         │
         ▼                         ▼                         ▼
  dashboard · mobile         resolve on every read      marketing · demo · ops
  marketing · internal       public /b · visit tokens
```

**New business today:**

```text
POST /businesses → createBusiness → seedBusinessFromOnboardingPack
  → onboarding state · mandate · platform-default preset
  → logEvent(BUSINESS_CREATED)
  → all surfaces read GET /me/tenant-experience
```

**New vertical today:** add enum + fill every `Record<BusinessVertical, …>` → typecheck fails until complete → registry row → manual demo seed + E2E. Playbook: [`VERTICAL-ADD-PLAYBOOK.md`](../engineering/VERTICAL-ADD-PLAYBOOK.md).

### 3.2 North-star — register once, flow downward

Target architecture: [`engineering/PLATFORM-LIFECYCLE-REGISTRY.md`](../engineering/PLATFORM-LIFECYCLE-REGISTRY.md).

| Event | Fan-out (target) |
|-------|------------------|
| `platform.vertical.registered` | policy factory · registry row · demo seed · wedge story · E2E slug · M5 stub |
| `platform.business.created` | seed pack · onboarding acts · morning briefing stub · support surfaceId · public /b reachable |

**R3 deliverables:** `defineVerticalPack()` · `pnpm vertical:check` · optional lifecycle handler module (no bespoke route switches).

### 3.3 Agent / engineer checklist (every PR)

See [`AGENTS.md`](../../AGENTS.md) § “Before you edit”. Minimum:

- [ ] Touched policy? → typecheck all Records + registry if new vertical  
- [ ] Touched API? → openapi + `pnpm codegen` if contract changed  
- [ ] Touched UI copy/nouns? → tenant-experience, not hardcoded “salon”  
- [ ] Touched `/b`? → all verticals same pattern via playbook  
- [ ] Touched demo? → structure vs vertical scenarios stay coherent  
- [ ] New route? → `surfaceId` for ops (R2 gate: block if missing)

---

## 4. Vertical strategy — registry-driven honesty

Source of truth: [`vertical-coverage.ts`](../../lib/policy/src/vertical-coverage.ts).

| Tier | Meaning | GTM |
|------|---------|-----|
| **heartland** | hair, beauty — full OS, IE wedge | Sell first |
| **beta-full** | medspa, body-art, pet, fitness, wellness, allied-health, automotive | Demo + honest preview |
| **partner-only** | dental, mental health | Partner or never |
| **defer** | adjacent solo | Calendly parity only later |

**Adding vertical #N:** one PR to policy + registry + demo slug + E2E — not a six-month fork. CI must prove `/b/{demoSlug}` books.

---

## 5. Release program (R1 → R2 → R3)

Detailed locks: [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) §4–6.

### R1 — NOW (closeout)

| Status | Item |
|--------|------|
| ✅ | E1–E14 automated (see R1-BUILD-STATUS) |
| 🔄 | **Founder staging walkthrough** — last R1 gate |
| ✅ | Demo gateway: structure vs vertical scenarios |
| ✅ | Quick sync (assets + live day) · scoped sync logins |
| 🔄 | Public `/b` layout polish (single header, no duplicate social proof) |

**Founder UAT script:** [`operations/FOUNDER-RELEASE-RUNBOOK.md`](../operations/FOUNDER-RELEASE-RUNBOOK.md) + R1 surface map in R1-BUILD-STATUS.

### R2 — next ~6 months (theme: guest + ops depth)

Prioritized workstreams (parallel):

| WS | Deliverable | Why |
|----|-------------|-----|
| **R2-A Guest hub** | `/my` favorites, per-shop timeline, manage booking | Client moat |
| **R2-B Guest surfaces** | pay, consent polish, visit all verticals | Thick Livia |
| **R2-C Liv ops** | booking arrived notification · inbox refresh · mandate UX | “Autonomous” feel |
| **R2-D Support** | Thread context pane · runbook links · Investigate depth | Scale ops |
| **R2-E Mobile** | Today v2 · guest deep links · push for booking events | Shop floor |
| **R2-F Demo truth** | Split Aurora composite · chair-host path · studio roster depth | Honest sales demo |
| **R2-G Money** | Deposit capture on `/b` · pay token surface | Revenue |

### R3 — v3 (~12–18 mo)

- Preset parade (4×9) after Platform Default prod-stable  
- `defineVerticalPack()` + `pnpm vertical:check`  
- Full headless lifecycle incl. support ticket  
- Mobile ~95% parity · Gate 2 field proof (10 Dublin shops)  
- WhatsApp Liv Personal pilot (after web hub proves orchestration)

---

## 6. Immediate build queue (next 4–8 weeks)

Ordered for **platform coherence**, not feature sprawl.

### Week 0–1 — Close R1

1. Founder staging walkthrough (all structure scenarios + 3 vertical flows).  
2. `pnpm smoke:staging` green on main.  
3. Sign R1 in R1-BUILD-STATUS.

### Week 1–3 — R2 Wave 1 (guest + liv feel)

1. **Guest hub:** favorites API, per-shop card → book + future “my visit” stub.  
2. **Owner bookings:** websocket or SSE optional later — keep 12s refetch + toast on new booking (R2-C).  
3. **Medspa/body-art:** vertical flow copy audit (consent, consult-first).  
4. **E2E:** extend `public-booking-quality` to all registry demo slugs.

### Week 3–6 — R2 Wave 2 (ops + money prep)

1. Support Context pane + `support-points` runbook links.  
2. Radar: stuck onboarding + 14d zero-booking feeds.  
3. Deposit/pay guest surface design → implement `/pay/:token`.  
4. **Platform lifecycle spike:** `scripts/vertical-check.mjs` reads registry, asserts demo slug + E2E file exist (precursor to R3-E6).

### Week 6–8 — Demo + mobile

1. Aurora demo split plan (host vs chain vs franchisor tenants).  
2. Mobile deep links to visit/intake/waitlist/proof tokens.  
3. Liv approval mode UX (owner guardrails) — spec from MULTI-HAT G6.

---

## 7. Parallel workstreams (always on)

These never “finish” — they run every sprint:

| Stream | Owner | Cadence |
|--------|-------|---------|
| **Kernel** | Eng | typecheck + migrations + policy Records complete |
| **Truth** | Eng | E2E verticals + staging smoke + marketing vs reality audit |
| **Surfaces** | Design + Eng | W1–W6 specs → routes; evolution PNGs vs shipped UI |
| **Ops** | Founder + Eng | staging/prod env parity, workforce grants, support |
| **Field** | Founder | design partners, Gate 2 evidence (parallel, not blocking R2 code) |

---

## 8. Demo world — accuracy rules

| Rule | Implementation |
|------|----------------|
| Structure ≠ vertical | `/demo` step 2 = shape; optional industry cards |
| One login path per role | Per-tenant roster emails; chain HQ = org-admin@ only on aurora-studio |
| Quick sync = fast | Branding + images + live-day only |
| Sync logins = scoped | Pick scenario first → ~4 Clerk accounts |
| Full reset = truth | New staff rows, seed graph, rosters |
| No composite without label | Aurora = “demo composite” until R2-F split |

---

## 9. Verification ladder

Every merge toward staging/prod:

```text
pnpm run typecheck
  → pnpm test:e2e:verticals (local)
    → pnpm smoke:staging (CI)
      → founder UAT checklist (human)
        → prod promote (manual gate)
```

**Headless lifecycle ( growing ):**
- R1: signup → seed → `/b` book (E11 ✓)  
- R2: + guest token + `/my` OTP  
- R3: + support ticket + full vertical:check

---

## 10. Documentation map (keep in sync)

| When you change… | Update… |
|------------------|---------|
| Release scope / locks | `LIVIA-FINAL-BUILD-PLAN.md` |
| Sequencing / vision | **this doc** |
| Sprint checkboxes | `PLATFORM-BACKLOG.md` |
| R1/R2/R3 % done | `R1/R2/R3-BUILD-STATUS.md` |
| New vertical | `VERTICAL-ADD-PLAYBOOK.md` + registry |
| Cascade architecture | `PLATFORM-LIFECYCLE-REGISTRY.md` |
| Agent rules | `AGENTS.md` |
| Index | `DOC-CANONICAL-INDEX.md` |

**Do not** create new master plans — extend these.

---

## 11. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial wide plan — vision widen, org shapes, cascade, layers L1–L5, R1 close + R2 queue |
