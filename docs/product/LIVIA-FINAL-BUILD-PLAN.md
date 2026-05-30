# Livia final build plan — master execution scope

**Status:** **LOCKED FOR BUILD** (2026-05-30)  
**Authority:** When this doc conflicts with older programs, **this wins**. Index: [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md)  
**Audience:** founder, engineering, product, agents — read before any heavy build session.

**This plan consolidates:** platform surface programs · programmatic lifecycle · all-vertical scope · guest identity + hub · composable self-evolution · Solidify tracks · release program R1–R3 · multi-hat gap review · workforce/exec · doc audit · founder locks from May 2026 design sessions.

---

## 0. How to use this doc

| Role | Read first |
|------|------------|
| **Founder** | §1 locks · §2 principles · §4 R1 exit · §8 founder lane |
| **Engineering** | §2–3 · §4–6 releases · [`PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md) |
| **Product/design** | §1 · §3 worlds · surface program table §3.2 |
| **Agent (Cursor)** | [`AGENTS.md`](../../AGENTS.md) + this doc §2 + §4 R1 checklist |

**Verify locally:** `pnpm run typecheck` · `pnpm test:e2e:verticals` · `pnpm solidify:verify` (when wired) · dev galleries `:5173/experience/*`

---

## 1. Founder locks (do not drift without explicit unlock)

### 1.1 Visual & brand

| Lock | Spec |
|------|------|
| **Logo** | Aurum Lv roundel — app icon | [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) |
| **Nav wordmarks** | Thread L · Open Arc (app icons rejected; variant picker in dev gallery) |
| **Marketing home** | **M1-R2** story scroll | [`MARKETING-SURFACE-PROGRAM.md`](../design/MARKETING-SURFACE-PROGRAM.md) |
| **Pricing** | **M2-A** EUR-only on marketing | same |
| **Gateway wedge** | **G1-A** interstitial — tattoo **clarity standard** for **every** registry vertical; **not** G1-C hair timeline cram | [`GATEWAY-SURFACE-PROGRAM.md`](../design/GATEWAY-SURFACE-PROGRAM.md) |
| **Internal exec** | **I2** Ship Lane | [`INTERNAL-EXEC-COCKPIT-SPEC.md`](./INTERNAL-EXEC-COCKPIT-SPEC.md) |
| **Internal support** | **I4-A** Thread 3-column primary | [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./INTERNAL-SUPPORT-PLATFORM-SPEC.md) |
| **Tenant signup skin** | **`platform-default`** preset — not vertical-native preset parade on create | [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md) §3 |
| **Evolution tiers** | `northstar/` · `now/` (R1) · `v3/` (R3) — 11 screen families | [`LIVIA-EVOLUTION-SCREENS.md`](../design/LIVIA-EVOLUTION-SCREENS.md) |
| **PNG catalog** | 29 platform-surface locks + evolution compare gallery | [`PLATFORM-SURFACES-FINAL-CATALOG.md`](../design/PLATFORM-SURFACES-FINAL-CATALOG.md) |

### 1.2 Product & scope

| Lock | Rule |
|------|------|
| **All 9 code verticals** | R1: wedge + `/b` book + demo seed each — **best of pack depth**; body-art proof = **reference collab**, not sole vertical | `VERTICAL_COVERAGE_REGISTRY` |
| **Thick Livia, thin channels** | SMS/WA/voice = links + reminders; proof/consent/pay on `/b` token pages | [`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md) |
| **No login for P7 on `/b`** | Token + phone/email; guest **vault** (W6) in R2 — not tenant CRM accounts | [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md) |
| **Cross-shop privacy** | Owners **never** see customer activity at other shops; **customers** see **their own** vault | [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) |
| **Production domain** | `livia-hq.com` (`app.` · `api.` · future `my.`) | [`PLATFORM-TERMINOLOGY.md`](../PLATFORM-TERMINOLOGY.md) |
| **Programmatic lifecycle** | If a human can do it, API + policy path exists; headless CI proves it | [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md) §0.2 |
| **Policy-first** | No new vertical behaviour in React — `@workspace/policy` → API → thin surface | [`COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md) |
| **Preset rollout** | Platform Default polish **before** 36-preset parade (Track D deferred mass rollout to R3) | [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](../design/PRESENTATION-PRESETS-AND-ROLLOUT.md) |

### 1.3 Company

| Lock | Rule |
|------|------|
| **Category** | Operator OS for appointment businesses — Liv is colleague, not bolt-on chatbot | [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) |
| **IE wedge GTM** | Hair/beauty heartland first **market** — product serves **all** vertical packs honestly | [`SCOPE-MORATORIUM.md`](./SCOPE-MORATORIUM.md) |
| **Demo off in prod** | `LIVIA_DEMO_ENABLED` unset | `demo-portal-config.ts` |
| **Workforce** | `@livia-hq.com` auto · Goldspire grants via cockpit | [`WORKFORCE-ONBOARDING.md`](../operations/WORKFORCE-ONBOARDING.md) |

---

## 2. Programmatic self-evolution (how the whole platform snaps)

**Goal:** Adding a vertical, preset, guest surface, or onboarding act propagates from **one hub** — TypeScript + CI catch missing blocks — surfaces stay thin.

### 2.1 Three rings ([`COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md))

| Ring | Where | Changes |
|------|-------|---------|
| **1 — Core rules** | `lib/policy` | Vertical packs, onboarding, presets, guest surfaces, vocabulary |
| **2 — Delivery** | OpenAPI · `/me/tenant-experience` · codegen | Wire contract; `pnpm codegen` |
| **3 — Live ops** | Inngest · events | Booking created, stuck onboarding — **not** act renames |

### 2.2 Hub consumers (must not hardcode lists)

| Consumer | Reads |
|----------|-------|
| Dashboard/mobile tenant UI | `GET /me/tenant-experience` |
| Public `/b` | `publicExperienceSkin` + vertical playbook |
| Marketing M5 / demo grid | `VERTICAL_COVERAGE_REGISTRY` |
| Gateway wedge | `wedge-demo-stories.ts` + registry |
| Onboarding | `onboarding-program.ts` + catalog API |
| Support investigate | `surfaceId` registry (R2 populate) |

### 2.3 Evolution north-star (build toward)

| Today | Target |
|-------|--------|
| 10+ policy files per vertical add | `defineVerticalPack()` factory |
| Manual demo seed arrays | `seedFromVerticalPack()` |
| Manual `ROUTE_VERTICALS` | Derived from pack `tenantRoutes[]` |
| Typecheck only | **`pnpm vertical:check`** — registry + stories + E2E slug + assets |

**Playbook:** [`VERTICAL-ADD-PLAYBOOK.md`](../engineering/VERTICAL-ADD-PLAYBOOK.md)

### 2.4 Dual-surface flagship — web + mobile (non-negotiable craft)

Livia is **two first-class surfaces** + guest web — one policy hub:

| Surface | Role | UX bar |
|---------|------|--------|
| **Web** | Owner depth, chain, proofs desk | Aurora editorial · ritual homes |
| **Mobile** | Shop-floor flagship | Haptics · push · offline · act now |
| **Public `/b`** | P7 guest mobile-first | Brand × vertical · tokens |
| **Gateway / marketing** | Prospect clarity + emotion | G1-A · M1 story |

**Stand-out rule:** Who / what now / why ([`MOBILE-UX-PRINCIPLES.md`](../design/MOBILE-UX-PRINCIPLES.md)). Push medium-native boundaries; never sacrifice clarity.

**Parity:** Daily shop-floor actions on mobile in R1/R2 or one honest web handoff ([`WEB-MOBILE-PARITY.md`](./WEB-MOBILE-PARITY.md)).

**Founder voice:** Warm, precise — Liv as colleague ([`brand/voice.md`](../brand/voice.md)).

### 2.5 Acceptance for “programmatic”

Every release ships with:

1. **Headless script** — prospect → demo → signup → `/b` book → guest token (R1 partial; R3 full + support ticket)  
2. **`pnpm test:e2e:verticals`** — 0 skipped slugs  
3. **Marketing vs reality** — [`audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) zero false claims  
4. **surfaceId** on new routes (R2 gate: block merge if missing)

---

## 3. Surface worlds (W1–W6)

```text
W1  Marketing      livia-hq.com           Aurora Editorial
W2  Gateway        /demo · sign-in        Gateway aurora · G1-A all verticals
W3a Internal exec  livia-internal         Ship Lane · Hats · workforce (R2 ledger)
W3b Internal sup   /support/*             Thread · Board · Radar · Investigate
W3c Internal ops   tenants · flags        Ops amber modules
W4  Tenant         app. + mobile          platform-default → optional presets (R3 parade)
W5  Public guest   /b/{slug}/*            brand × vertical × guest surface type
W6  Guest hub      my.livia-hq.com (R2)   phone OTP · favorites · book-again · Liv orchestrator
```

### 3.1 Surface program specs (design → build)

| World | Canonical spec | Build spec |
|-------|----------------|------------|
| W1 | [`MARKETING-SURFACE-PROGRAM.md`](../design/MARKETING-SURFACE-PROGRAM.md) | [`PLATFORM-SURFACES-BUILD-SPEC.md`](../design/PLATFORM-SURFACES-BUILD-SPEC.md) §1 |
| W2 | [`GATEWAY-SURFACE-PROGRAM.md`](../design/GATEWAY-SURFACE-PROGRAM.md) | §2 |
| W3a | [`INTERNAL-EXEC-COCKPIT-SPEC.md`](./INTERNAL-EXEC-COCKPIT-SPEC.md) | §3 |
| W3b | [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./INTERNAL-SUPPORT-PLATFORM-SPEC.md) | §4 |
| W5 | [`PUBLIC-B-SURFACE-SPEC.md`](./PUBLIC-B-SURFACE-SPEC.md) | Track G |
| W6 | [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) | R2 Track G+ |
| Brand | [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) | dev `/experience/brand-logos` |
| Flows | [`LIVIA-PLATFORM-FLOWS.md`](./LIVIA-PLATFORM-FLOWS.md) | nested thick/thin |
| Lifecycle | [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md) | §0.2 programmatic |

### 3.2 Dev galleries (dashboard :5173, dev only)

| Route | Content |
|-------|---------|
| `/experience/platform-surfaces` | 29 final PNG catalog |
| `/experience/brand-logos` | Aurum + Thread/Open Arc + icon variants |
| `/experience/livia-evolution` | northstar / now / v3 compare |

---

## 4. Release R1 — **Now** (~8–12 weeks) — PRIMARY BUILD

**Theme:** Locked visuals → real routes. **All registry verticals** demo + book. Programmatic path provable.

### 4.1 R1 exit criteria (non-negotiable)

| # | Criterion | Verify |
|---|-----------|--------|
| E1 | **G1-A** wedge grid + interstitial for **each** `tier ≠ defer` vertical | Manual + E2E |
| E2 | **M1-R2** + **M2-A** marketing live on staging | Visual + copy audit |
| E3 | **`wedge-demo-stories.ts`** + **`guest-surfaces.ts`** in policy | typecheck |
| E4 | **All 9** `/b/{demoSlug}` book flows pass E2E | `pnpm test:e2e:verticals` |
| E5 | Body-art **proof** guest page + proofs desk link (reference collab depth) | E2E + manual |
| E6 | **Visit token** pages for all verticals (day-of minimum) | API + smoke |
| E7 | **Platform Default** tenant polish; preset picker staging-only | UAT |
| E8 | **I4 Thread shell** — 3-column layout even if Context sparse | Internal UAT |
| E9 | **I2 Ship Lane** collapse/expand + Hats metrics panels | Internal UAT |
| E10 | **Phone E.164 normalize** in `findOrCreateCustomer` | unit test |
| E11 | **Signup → seed → `/b`** without manual DB | demo provision script |
| E12 | **`presentation_preset_id`** column + resolver (D2) | migration + API |
| E13 | Link-first **continuity templates** all verticals (G3) | policy test |
| E14 | **`pnpm run typecheck`** clean | CI |

### 4.2 R1 track map (parallel)

Tracks cross-reference [`OPERATION-SOLIDIFY.md`](./OPERATION-SOLIDIFY.md) · [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](./PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) · [`PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md).

#### Track F — Platform surfaces (marketing + gateway + internal chrome)

| ID | Deliverable | Spec |
|----|-------------|------|
| F0 | ✅ Final catalog + galleries | FINAL-CATALOG |
| F1 | M0 aurora shell · Aurum logo components · EUR copy | MARKETING program |
| F2 | M1-R2 home · M2-A pricing · M4 index · M9 waitlist | BUILD-SPEC §1 |
| F3 | **`wedge-demo-stories.ts`** · `/demo/wedge/:vertical` · launcher wiring | GATEWAY §4 |
| F4 | M5 vertical pages → demo deep links · M3 how-it-works | registry-driven |
| F5 | I2 Ship Lane · I0 sign-in token pass | EXEC spec |
| F6 | I4 Thread `/support/queue` · ticket detail shell · Board · Radar stubs | ISP spec |
| F8 | E2E marketing → demo → tenant | headless target |

#### Track G — Guest collaboration (W5)

| ID | Deliverable | Spec |
|----|-------------|------|
| G0 | **`guest-surfaces.ts`** · token service policy | PUBLIC-B §5 |
| G1 | Proof page `/b/:slug/proof/:token` + API + E2E | body-art reference |
| G2 | Medspa consent · fitness waitlist · pet/automotive guest polish | vertical playbooks |
| G3 | Continuity templates · 9-vertical hero E2E | continuity-templates.ts |
| G4 | **Phone normalize** · phone-required on `/b` where SMS continuity | GUEST-IDENTITY §5 |
| G5 | Public book **mobile pass** (visual `now/` tier) | evolution gallery |

#### Track D — Tenant experience (minimal R1)

| ID | Deliverable |
|----|-------------|
| D2 | `presentation_preset_id` migration + PATCH + resolver |
| D5 | `/b` inherits preset + brand shell |
| D-R1 | **Platform Default polish only** — defer 36-preset QA matrix |

#### Track B — Support investigation (R1 shell, R2 depth)

| ID | Deliverable |
|----|-------------|
| B1-R1 | `surfaceId` on **new** routes only |
| B1-R2 | Full registry populate + Investigate panel |

#### Track 0–6 — Solidify kernel (parallel)

| Track | R1 focus |
|-------|----------|
| **0** Kernel truth · migrations · demo graph = prod graph | T0.* |
| **1** Channels EU · honest prod guards | T1.* |
| **2** Liv data-driven · per-vertical demo seeds distinct | T2.* |
| **3** Mobile flagship — inbox, CRUD, Today (not 95% yet) | T3.* |
| **4** Operator maturity — new starter vs founder paths | T4.* |
| **5** Internal cockpit — Thread shell + runbook links | T5.* |
| **6** Monetization OS — plan strip · pricing SSOT test | T6.* |

#### Track H — Exec workforce (R2 primary)

| ID | Deliverable | When |
|----|-------------|------|
| H1 | `exec_work_events` ledger | R2 |
| H2 | Hats River v2 · `pnpm exec:hat-work` | R2 |
| H3 | Cursor session → work event | R2 |

#### Policy / API modules to land R1

```
lib/policy/src/wedge-demo-stories.ts      (new)
lib/policy/src/guest-surfaces.ts         (new)
lib/policy/src/presentation-presets.ts   (existing — wire D2)
artifacts/api-server/.../booking-guest-access.service.ts (extend)
artifacts/livia-dashboard/.../demo/wedge/*  (new routes)
artifacts/livia-dashboard/.../public-booking.tsx (mobile pass)
scripts/headless-lifecycle-r1.mjs        (new — target)
```

---

## 5. Release R2 — (~6 months post-R1)

**Theme:** Guest surfaces complete · P7 hub · support at scale · mobile parity push.

| Layer | Ships |
|-------|-------|
| **W6 Guest hub** | `guest_identities` · OTP · favorites · book-again · web Liv chat orchestrator | [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) |
| **W5** | visit · consent · pay · waitlist accept surfaces all verticals |
| **W3b** | Thread Context pane · runbook links · proactive Radar feeds |
| **B** | `surfaceId` registry complete · Investigate API |
| **W4** | Ritual homes per vertical · proofs desk wired |
| **Mobile** | Today v2 · guest deep links · offline queue |
| **Product** | Owner Liv **guardrails UX** (approval mode) | MULTI-HAT G6 |
| **Ops** | Stuck onboarding · 14d zero-booking monitors → Radar |
| **Verify** | CI guest-token suite · support opens tenant from thread |

**WhatsApp Liv Personal:** pilot **after** web hub proves orchestration (R2.5–R3) — hybrid: hub navigation central WA; confirmations stay shop number.

---

## 6. Release R3 — Livia v3 (~12–18 months)

**Theme:** Platform coherence · preset rollout · Gate 2 field proof · ops scale.

| Layer | Ships |
|-------|-------|
| **Presets D** | 4×9 staging→prod promotion matrix |
| **Mobile** | ~95% ADR 0011 parity |
| **Internal** | Exec + support unified amber · Track H employed hats |
| **Ops** | Workforce access prod-complete · founder cockpit live data |
| **Markets** | 10 Dublin shops Gate 2 evidence |
| **Engineering** | **`pnpm vertical:check`** · **`defineVerticalPack()`** factory |
| **Verify** | Full headless lifecycle: prospect → tenant → P7 → support ticket |
| **Visual** | `v3/` tier matches shipped UI; drift ≤ 1 sprint |

---

## 7. Cross-cutting gaps (locked into backlog)

From [`MULTI-HAT-GAP-REVIEW.md`](./MULTI-HAT-GAP-REVIEW.md) — all tracked in [`PLATFORM-BACKLOG.md`](../operations/PLATFORM-BACKLOG.md).

| ID | Gap | Release |
|----|-----|---------|
| G1 | Headless lifecycle CI | R1 script → R3 full |
| G2 | Guest proof + SMS link-first | R1 |
| G3 | G1-A demo wedge built | R1 |
| G4 | surfaceId registry | R2 |
| G5 | Preset parade vs Platform Default | R1 polish / R3 parade |
| G6 | Owner Liv guardrails UX | R2 |
| G7 | Guest continuity per-shop timeline | R2 PUBLIC-B |
| G8 | Import / Phorest switching | RFC + business |
| G9 | `/b` perf budgets · mobile offline | R2–R3 |
| G10 | In-app owner trust center | R2 |
| G11 | Proactive health → Radar | R2 |
| G12 | Pricing/billing SSOT CI test | R1 T6 |
| G13 | Guest `/b` locale (DACH) | R2 |
| G14 | Partner API in release program | R3 |
| G15 | Phone normalize public book | R1 G4 |

---

## 8. Founder / company lane (off-repo — gates revenue)

Does **not** block R1 engineering; blocks G2/G3 production claims.

| Gate | Items | Doc |
|------|-------|-----|
| **G2** | 10 real shops · Stripe prod · counsel docs · App Store | [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md) |
| **G3** | SOC2 path · multi-region · 24/7 | OPEN-ITEMS-DEFERRED |
| **Field** | Design partner program · weekly evidence | NORTH-STAR-DASHBOARD |
| **Hire trigger** | >20 active tenants → support L1 | MULTI-HAT §1.1 |
| **Domain** | `livia-hq.com` prod · `my.` when W6 ships | ENV-VARIABLES |

---

## 9. Documentation state

| Item | Status |
|------|--------|
| Canonical index | [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) |
| Terminology | [`PLATFORM-TERMINOLOGY.md`](../PLATFORM-TERMINOLOGY.md) |
| Archive | [`archive/README.md`](../archive/README.md) |
| Line-by-line audit | [`operations/DOC-AUDIT-REGISTRY.md`](../operations/DOC-AUDIT-REGISTRY.md) — 356 files, in progress |
| Guest identity | [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md) |
| Guest hub | [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) |
| Vertical add | [`VERTICAL-ADD-PLAYBOOK.md`](../engineering/VERTICAL-ADD-PLAYBOOK.md) |

**Rule:** Extend canonical docs; do not fork new “master plans.”

---

## 10. Elevation backlog (post-R1 — do not forget)

| Opportunity | Release |
|-------------|---------|
| Guest continuity passport (per-shop timeline) | R2 |
| Liv approval mode | R2 |
| Vertical shop kits (packaged wedges) | R2–R3 |
| Support → owner micro-lessons | R2 |
| Release train visible to tenants | R3 |
| Chain command → Radar one-click | R3 |
| WhatsApp Liv Personal (hybrid) | R3 |
| Custom domain `/b` | R3 |
| Partner / franchise playbook | R3+ |

---

## 11. Weekly cadence (during heavy build)

| Day | Action |
|-----|--------|
| **Mon** | Ship Lane row · R1 checklist tick · NORTH-STAR-DASHBOARD |
| **Per PR** | typecheck · surfaceId if new route · no policy in React |
| **Per sprint** | `test:e2e:verticals` · evolution gallery drift check |
| **Pre-R1 exit** | E1–E14 table §4.1 all green |

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | **Master build plan locked** — consolidates full chat scope: surfaces, all verticals, guest hub, programmatic evolution, founder locks, R1–R3 |
