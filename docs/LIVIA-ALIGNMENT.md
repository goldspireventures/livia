# Livia alignment — company, product, and how we build

**Status:** Canonical (2026-05-22) — **start here**; stable until the realignment program completes.  
**Supersedes:** scattered “what is Livia?” paragraphs in README, audits, and chat summaries.  
**Execution:** v1 realignment complete — [`product/ENGINEERING-HANDOFF.md`](./product/ENGINEERING-HANDOFF.md). **v2:** wrapped — [`product/V2-ENGINEERING-CLOSED.md`](./product/V2-ENGINEERING-CLOSED.md). **Active build:** [`product/V3-EXECUTION-PROGRAM.md`](./product/V3-EXECUTION-PROGRAM.md) (alive UX + booking continuity + platform + DACH + medspa; whole product every release). **Experience / pains:** [`product/V3-EXPERIENCE-SPEC.md`](./product/V3-EXPERIENCE-SPEC.md), [`product/V3-REAL-WORLD-SCENARIOS.md`](./product/V3-REAL-WORLD-SCENARIOS.md). **You:** [`product/FOUNDER-SHIP-LANE.md`](./product/FOUNDER-SHIP-LANE.md).

---

## Part 1 — Livia Inc (the company)

| Question | Answer |
|----------|--------|
| **Who are we?** | **Livia Inc** — EU-anchored software company building an **operating system** for appointment-based service businesses. |
| **What category?** | Operator platform for **scheduled skilled services** — not generic CRM, not clinic EHR, not a marketplace that owns the customer. |
| **What do we sell?** | Multi-tenant SaaS: **Livia** (kernel + surfaces) + **Liv** (agent runtime on channels). Monetization: tiered subscription + usage/outcome components (see [`product/LIVIA-MASTER-PLAN.md`](./product/LIVIA-MASTER-PLAN.md)). |
| **Who do we serve first?** | **Design partners** in EU (IE wedge: English-IE voice, EUR, GDPR posture). **Hair/barber** is the **first vertical pack to prove**, not the definition of the company. |
| **Who do we serve eventually?** | Any bookable vertical in [`verticals.md`](./verticals.md) — beauty, tattoo, wellness, fitness, medspa, allied health, and extensions via packs. |
| **How do we run ourselves?** | Internal ops portal, support runbooks, audit, incident response — [`company/livia-internal-portal-spec.md`](./company/livia-internal-portal-spec.md), [`operations/README.md`](./operations/README.md). |

**Public line (approved framing):**  
*Livia is the operating system for appointment-based businesses in Europe — Liv is your colleague for bookings, inbox, voice, and the day’s chaos.*

---

## Part 2 — What we do today vs what we are building toward

### Today (in-repo, demonstrable)

- Multi-tenant **bookings, customers, staff, services, inbox, audit, billing hooks, workflows (Inngest)**.
- **Liv** on public web chat, staff assist, SMS/voice paths (env-dependent).
- **Persona rituals** on web + mobile (founder, owner, manager, staff, receptionist).
- **Seven vertical packs** in `@workspace/policy` with vocabulary + default services.
- **Demo world** + onboarding wizard + public `/b/{slug}`.
- **livia.io** (`artifacts/livia-marketing`) — prospect marketing; delivered in v2 Block J ([`product/V2-ENGINEERING-CLOSED.md`](./product/V2-ENGINEERING-CLOSED.md)).

### Target (12–24 months — from positioning depth table)

- Liv at **R2–R4** rungs per persona×configuration (see [`livia-positioning.md`](./livia-positioning.md)).
- Full **locale packs** beyond EN-IE; channels live where marketed.
- **Liv OS**: data-driven tool registry, prompt templates, event→action matrix ([`product/LIV-OPERATING-SYSTEM.md`](./product/LIV-OPERATING-SYSTEM.md)).
- **Livia Inc** fleet ops at scale (SOC2, multi-region, 24/7 patterns).

**Honesty:** API and kernel are often **ahead of UI craft and mobile parity**. “Production grade” = kernel + **finished surfaces** + **live ops** — not docs marked [x].

---

## Part 3 — How we do it (architecture)

```text
┌─────────────────────────────────────────────────────────────┐
│ Livia Inc — GTM, legal, support, internal ops                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Platform kernel (invariant)                                   │
│ Auth · tenant · Postgres/RLS · OpenAPI · audit chain · events │
│ Entitlements · Stripe · Inngest workflows                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  Vertical packs      Locale packs         Org-shape packs
  (hair, beauty…)     (IE, DE, …)         (solo, chain…)
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
              Persona rituals (P1–P7 surfaces)
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Dashboard          Mobile app          Public /b + channels
                            │
                            ▼
                    Liv agent runtime
              (tools · policy · disclosure · eval)
```

**Rules:**

1. **Business behaviour** → `@workspace/policy` + services — not ad-hoc strings in UI.
2. **HTTP contract** → `lib/api-spec/openapi.yaml` → codegen — never hand-edit generated clients.
3. **Tenant scope** → every query filtered by `businessId`; audit on human mutations.
4. **Copy** → `businessVocabulary(vertical)` or persona rituals — not “salon” as product shorthand.

---

## Part 4 — Livia the product (purpose)

| Stakeholder | Purpose |
|-------------|---------|
| **Owner / founder** | One calm place for **today**, money signal, inbox, team, trust (audit), second locations. |
| **Manager** | **Queue** of what Liv did vs what needs human judgement — no silent money risk. |
| **Staff** | **My chair** — next client, their day, nothing else. |
| **Receptionist** | **Floor** + messages — calendar truth, walk-ins. |
| **Customer (P7)** | Book and talk to Liv with **disclosure** — no account required on web. |
| **Livia Inc ops** | Support tenants when Liv or integrations fail — read-only + audited actions. |

**Non-goals:** Marketplace that owns end-customers; generic project management; full clinical records for medspa/allied-health without partners.

---

## Part 5 — Liv (the colleague)

- **Liv** = intelligence layer of the OS (not “AI feature”).
- Acts only through **registered tools** under **resolved policy** and **entitlements**.
- **Proactive** via workflows + briefings; **reactive** via inbox/SMS/voice/web.
- **EU AI Act:** disclosure on first message per channel ([`lib/ai-disclosure`](../lib/ai-disclosure/)).

---

## Part 6 — Questions we keep asking (product discipline)

Before shipping any screen or doc claim, answer:

1. **Who is looking?** (persona + role + plan)
2. **What do they want *right now*?** (job, not feature list)
3. **What is Livia here?** (ritual name + one sentence)
4. **Which vertical/locale pack applies?** (copy, policy, services)
5. **What must never happen silently?** (money, booking state, PII)
6. **Does marketing claim this?** ([`audits/marketing-vs-reality.md`](./audits/marketing-vs-reality.md))
7. **Web and mobile parity?** ([`product/WEB-MOBILE-PARITY.md`](./product/WEB-MOBILE-PARITY.md))

---

## Part 7 — Production grade (definition)

| Tier | Meaning | Gate |
|------|---------|------|
| **P0 — Kernel** | Auth, tenant isolation, booking integrity, audit append | CI + `test:e2e:api` |
| **P1 — Surfaces** | CRUD complete per matrix; persona rituals; no dead ends | UAT certification |
| **P2 — Craft** | WCAG AA critical paths; copy review; responsive matrix | axe + design review |
| **P3 — Live ops** | Legal, Stripe prod, EU region, stores, 10 real shops | G2/G3 ([`OPEN-ITEMS-DEFERRED.md`](./product/OPEN-ITEMS-DEFERRED.md)) |
| **P4 — Scale** | Multi-instance, load, DR tested | Post-PMF |

**“100% production”** for the founder = **P0+P1+P2 in-repo** + **P3 your lane** — not one missing checkbox in an old audit doc.

---

## Canonical doc map (after realignment)

| I need… | Read |
|---------|------|
| **This page** | `LIVIA-ALIGNMENT.md` |
| **Execution program** | `product/SYSTEM-REALIGNMENT-PROGRAM.md` |
| **Global product system** | `product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md` |
| **Truth vs gaps (UI)** | `product/LIVIA-IDEA-TO-REALITY.md` Part I |
| **What ships when** | `launch-plan.md` + `roadmap/v1-scope.md` |
| **Live user narrative** | `product/LIVIA-PRODUCTION-READY.md` |
| **Engineering** | `engineering/README.md` + `adr/` |
| **Run locally** | `testing/E2E-RUNBOOK.md` |
| **Executive strategy (multi-hat review + action plan)** | `company/EXECUTIVE-MULTI-HAT-REVIEW.md` · `company/EXECUTIVE-ACTION-PLAN.md` · **progress:** `company/EXECUTION-PHASE-PROGRESS.md` · **founder-only:** `company/FOUNDER-BACKLOG.md` |
| **Customer Support (SLAs, facilities, escalation)** | `operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md` |

---

## Change log

| Date | Change |
|------|--------|
| 2026-05-22 | Created as single alignment spine; triggers system-wide realignment program |
| 2026-05-26 | Linked executive multi-hat review and founder action plan |
