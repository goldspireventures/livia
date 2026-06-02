# Documentation canonical index

**Purpose:** When two docs disagree, **this table wins**.  
**Terminology:** [`PLATFORM-TERMINOLOGY.md`](./PLATFORM-TERMINOLOGY.md)  
**Archived docs:** [`archive/README.md`](./archive/README.md) — do not extend  
**Updated:** 2026-05-31 (documentation program — build paused)

---

## How to navigate

| I need to… | Open |
|------------|------|
| **Doc sprint (BUILD PAUSED)** | [`product/LIVIA-DOCUMENTATION-PROGRAM.md`](./product/LIVIA-DOCUMENTATION-PROGRAM.md) |
| **Build hierarchy (where we are)** | [`product/BUILD-HIERARCHY-MAP.md`](./product/BUILD-HIERARCHY-MAP.md) |
| **Visual / every screen** | [`design/VISUAL-DOCUMENTATION-PROGRAM.md`](./design/VISUAL-DOCUMENTATION-PROGRAM.md) · [`design/VISUAL-SCREEN-MASTER-INVENTORY.md`](./design/VISUAL-SCREEN-MASTER-INVENTORY.md) |
| **Screen cards (L3)** | [`design/screen-cards/`](./design/screen-cards/) |
| **Category (people-business OS)** | [`product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) |
| **UI/UX authority** | [`design/UI-UX-MASTER-PROGRAM.md`](./design/UI-UX-MASTER-PROGRAM.md) |
| **Skin / `/b` inheritance** | [`design/SKIN-BRAND-INHERITANCE-SPEC.md`](./design/SKIN-BRAND-INHERITANCE-SPEC.md) |
| **All vertical programs** | [`product/VERTICAL-PROGRAMS-INDEX.md`](./product/VERTICAL-PROGRAMS-INDEX.md) |
| **Verticals build plan** | [`product/LIVIA-VERTICALS-BUILD-PLAN.md`](./product/LIVIA-VERTICALS-BUILD-PLAN.md) |
| **Partner / defer verticals** | [`product/PARTNER-AND-ADJACENT-VERTICALS.md`](./product/PARTNER-AND-ADJACENT-VERTICALS.md) |
| **Doc propagation (vertical/platform)** | [`engineering/DOC-PROPAGATION-CASCADE.md`](./engineering/DOC-PROPAGATION-CASCADE.md) · `pnpm vertical:doc-check` |
| **Systems gap audit** | [`product/SYSTEMS-COMPLETENESS-AUDIT.md`](./product/SYSTEMS-COMPLETENESS-AUDIT.md) |
| **Build after doc gate** | [`product/LIVIA-BUILD-PLAN-V2.md`](./product/LIVIA-BUILD-PLAN-V2.md) |
| **Vision + build sequencing** | [`product/LIVIA-WIDE-BUILD-PLAN.md`](./product/LIVIA-WIDE-BUILD-PLAN.md) |
| **Start heavy build (locks — pre-pause)** | [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) |
| Understand the company | [`LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) |
| Build something today | [`BUILD-PLAN-WIRE.md`](./operations/BUILD-PLAN-WIRE.md) · [`R1-BUILD-STATUS.md`](./operations/R1-BUILD-STATUS.md) · [`PLATFORM-BACKLOG.md`](./operations/PLATFORM-BACKLOG.md) |
| Ship a platform release | [`product/PLATFORM-RELEASE-PROGRAM.md`](./product/PLATFORM-RELEASE-PROGRAM.md) |
| See honest API vs UI gaps | [`product/LIVIA-IDEA-TO-REALITY.md`](./product/LIVIA-IDEA-TO-REALITY.md) |
| Run locally | [`START-HERE.md`](./START-HERE.md) · [`LOCAL_DEV.md`](./LOCAL_DEV.md) |
| Audit every doc (line-by-line) | [`operations/DOC-AUDIT-REGISTRY.md`](./operations/DOC-AUDIT-REGISTRY.md) |
| Gap review / what we missed | [`product/MULTI-HAT-GAP-REVIEW.md`](./product/MULTI-HAT-GAP-REVIEW.md) |

---

## Tier 1 — Start here (read order)

| # | Document | Role |
|---|----------|------|
| 0 | [`product/LIVIA-DOCUMENTATION-PROGRAM.md`](./product/LIVIA-DOCUMENTATION-PROGRAM.md) | **Doc sprint — BUILD PAUSED until G-DOC** |
| 0a | [`product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) | **Category — not salon-shaped** |
| 0b | [`product/LIVIA-BUILD-PLAN-V2.md`](./product/LIVIA-BUILD-PLAN-V2.md) | **Build authority after doc gate** |
| 0c | [`product/LIVIA-WIDE-BUILD-PLAN.md`](./product/LIVIA-WIDE-BUILD-PLAN.md) | Vision, org shapes, cascade, R1→R3 queue |
| 0d | [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) | Master execution scope — LOCKED (pre-pause) |
| 1 | [`LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) | Company + product + architecture rules |
| 2 | [`PLATFORM-TERMINOLOGY.md`](./PLATFORM-TERMINOLOGY.md) | Names, domains, skins, disambiguation |
| 3 | [`product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md) | Global OS — not wedge-only |
| 4 | [`product/LIVIA-PLATFORM-LIFECYCLE.md`](./product/LIVIA-PLATFORM-LIFECYCLE.md) | Skins W1–W5, seed, programmatic lifecycle |
| 5 | [`product/LIVIA-PLATFORM-FLOWS.md`](./product/LIVIA-PLATFORM-FLOWS.md) | Nested flows, thick/thin, vertical toolkits |
| 6 | [`product/LIVIA-IDEA-TO-REALITY.md`](./product/LIVIA-IDEA-TO-REALITY.md) | Honest gaps (API vs UI) |
| 7 | [`product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) | **Active build** — v1 final |
| 8 | [`product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](./product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md) | Master engineering tracks A–H |
| 9 | [`product/PLATFORM-RELEASE-PROGRAM.md`](./product/PLATFORM-RELEASE-PROGRAM.md) | R1 / R2 / R3 platform releases |
| 10 | [`product/FOUNDER-SHIP-LANE.md`](./product/FOUNDER-SHIP-LANE.md) | Founder commercial ship |

---

## Tier 2 — Surface programs (design → build)

| World | Canonical spec | Visual anchor | Build / locks |
|-------|----------------|---------------|---------------|
| **W1 Marketing** | [`design/MARKETING-SURFACE-PROGRAM.md`](./design/MARKETING-SURFACE-PROGRAM.md) | `livia-evolution/northstar/m1-home-web.png` | [`PLATFORM-SURFACES-BUILD-SPEC.md`](./design/PLATFORM-SURFACES-BUILD-SPEC.md) §1 |
| **W2 Gateway** | [`design/GATEWAY-SURFACE-PROGRAM.md`](./design/GATEWAY-SURFACE-PROGRAM.md) | `northstar/g1-wedge-web.png` | G1-A locked |
| **W3a Exec** | [`product/INTERNAL-EXEC-COCKPIT-SPEC.md`](./product/INTERNAL-EXEC-COCKPIT-SPEC.md) | `northstar/i2-shiplane-web.png` | I2 locked |
| **W3b Support** | [`product/INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./product/INTERNAL-SUPPORT-PLATFORM-SPEC.md) | `northstar/i4-thread-web.png` | I4-A locked |
| **W4 Tenant** | [`product/TENANT-EXPERIENCE-CONTRACT.md`](./product/TENANT-EXPERIENCE-CONTRACT.md) | tenant inbox / today evolution PNGs | Track D presets |
| **W5 Public `/b`** | [`product/PUBLIC-B-SURFACE-SPEC.md`](./product/PUBLIC-B-SURFACE-SPEC.md) | `public-book` + `guest-proof` PNGs | Track G |
| **W6 Guest hub** | [`product/GUEST-CONTINUITY-HUB-SPEC.md`](./product/GUEST-CONTINUITY-HUB-SPEC.md) | (R2 — `my.livia-hq.com`) | R2 Track G+ |
| **Brand / visuals** | [`design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) | Aurum logo locked | Gallery dev routes |
| **Evolution tiers** | [`design/LIVIA-EVOLUTION-SCREENS.md`](./design/LIVIA-EVOLUTION-SCREENS.md) | northstar / now / v3 folders | Release program |
| **PNG catalog** | [`design/PLATFORM-SURFACES-FINAL-CATALOG.md`](./design/PLATFORM-SURFACES-FINAL-CATALOG.md) | 29 locks + north-stars | [`CONCEPTS-DEEP`](./design/PLATFORM-SURFACES-CONCEPTS-DEEP.md) |

---

## Tier 3 — By domain

### Product & experience

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| North star (product POV) | `product/LIVIA-NORTH-STAR.md` | `company/NORTH-STAR-DASHBOARD.md` |
| v3 UX / motion | `product/V3-EXPERIENCE-SPEC.md` | `V3-REAL-WORLD-SCENARIOS.md`, `V3-SURFACE-MATRIX.md` |
| Experience architecture | `design/EXPERIENCE-ARCHITECTURE.md` | `PRESENTATION-PRESETS-AND-ROLLOUT.md`, `CHANNEL-UX-CONTRACT.md` |
| Personas | `personas.md` | `product/PERSONA-UX.md`, journeys/ |
| Verticals | `verticals.md` | `lib/policy` |
| Liv OS | `product/LIV-OPERATING-SYSTEM.md` | `LIV-OS-ALPHABET.md` |
| Business rules | `product/BUSINESS-RULES-REGISTRY.md` | — |
| Scope / gates | `product/SCOPE-MORATORIUM.md` | `launch-plan.md`, `TARGET-STATE-VS-SHIP-SCOPE.md` |
| Beta / showcase | `product/BETA-SHOWCASE-PROGRAM.md` | `BETA-ONBOARDING-FLOW.md` |
| Onboarding | `product/BETA-ONBOARDING-FLOW.md` | `ONBOARDING-PRODUCTION.md` |
| Channels EU | `product/CHANNELS-EU-MESSAGING.md` | `CHANNEL-UX-CONTRACT.md` |
| Notifications (staff) | `product/NOTIFICATIONS.md` | workflows/ |
| Notifications (customer P7) | `product/CUSTOMER-NOTIFICATIONS-SPEC.md` | CUSTOMER-NOTIFICATIONS |
| Global search | `product/GLOBAL-SEARCH-SPEC.md` | — |
| Import / migration | `product/IMPORT-MIGRATION-SPEC.md` | booksy-import-runbook |
| Feature flags | `product/FEATURE-FLAGS-SPEC.md` | internal /flags |
| Performance budgets | `product/PERFORMANCE-BUDGETS.md` | MULTI-HAT-GAP-REVIEW |
| Resource inventory | `product/RESOURCE-INVENTORY-SPEC.md` | booking-guards, medspa |
| Voucher / packages | `product/VOUCHER-PACKAGE-SPEC.md` | wellness playbooks |
| Liv tool matrix | `product/LIV-TOOL-REGISTRY-MATRIX.md` | liv-runtime registry |
| Guest surfaces audit | `engineering/GUEST-SURFACES-AUDIT.md` | `lib/policy/guest-surfaces.ts` |
| Exec hat ledger (Track H) | `product/INTERNAL-EXEC-COCKPIT-SPEC.md` §4.2b | `lib/policy/exec-hats.ts`, `pnpm exec:hat-work` |
| Vertical playbooks | `product/vertical-playbooks/` | GLOBAL-PRODUCT §III |
| Demo live depth | `product/DEMO-WORLD-LIVE-SPEC.md` | PER-VERTICAL-DEMO-SEED |
| UI/UX program | `design/UI-UX-MASTER-PROGRAM.md` | V3-EXPERIENCE-SPEC, motion-tokens, screen-cards |
| Premium motion | `design/PREMIUM-MOTION-LAYER.md` | motion-tokens, UI-UX-MASTER |
| Liv tone / surfaces | `design/LIV-TONE-PER-SURFACE-MATRIX.md` | brand-of-livia-and-liv |
| Visual program | `design/VISUAL-DOCUMENTATION-PROGRAM.md` | VISUAL-SCREEN-MASTER-INVENTORY, SCREEN-CARD-SCHEMA |
| Visual acceptance tests | `testing/TESTING-VISUAL-ACCEPTANCE.md` | E2E, Maestro |
| Empty/error/loading | `design/EMPTY-ERROR-LOADING-CATALOG.md` | UI-UX-MASTER-PROGRAM |
| Skin inheritance | `design/SKIN-BRAND-INHERITANCE-SPEC.md` | VISUAL-INHERITANCE |
| Public booking E2E | `product/PUBLIC-BOOKING-INTAKE-E2E.md` | `PUBLIC-B-SURFACE-SPEC.md` |
| Guest identity (no login) | `product/GUEST-CUSTOMER-IDENTITY.md` | `GUEST-CONTINUITY-HUB-SPEC.md`, `customer-typologies.md` |
| Add a new vertical | `engineering/VERTICAL-ADD-PLAYBOOK.md` | `vertical-coverage.ts`, `PLATFORM-LIFECYCLE-REGISTRY.md` |
| Register-once cascade (target) | `engineering/PLATFORM-LIFECYCLE-REGISTRY.md` | `COMPOSABLE-EVOLUTION.md` §5.3 |
| Wide build / sequencing | `product/LIVIA-WIDE-BUILD-PLAN.md` | `R1/R2-BUILD-STATUS`, `PLATFORM-BACKLOG` |
| Web/mobile parity | `product/WEB-MOBILE-PARITY.md` | `design/MOBILE-UX-PRINCIPLES.md` |
| Production-ready | `product/LIVIA-PRODUCTION-READY.md` | `OPEN-ITEMS-DEFERRED.md` |
| EU complete spec | `product/LIVIA-COMPLETE-SYSTEM-SPEC.md` | — |

### Engineering

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| Master build phases | `product/LIVIA-MASTER-BUILD-PLAN.md` | `LIVIA-OS-MASTER-PLAN.md` |
| Platform kernel | `engineering/PLATFORM-KERNEL.md` | ADRs |
| Composable evolution | `engineering/COMPOSABLE-EVOLUTION.md` | TENANT-EXPERIENCE-CONTRACT |
| Code clarity / naming | `engineering/CODE-CLARITY-STANDARDS.md` | REPO-LAYOUT |
| Atlas (internal knowledge) | `engineering/ATLAS-INTEGRATION-GUIDE.md` | INTERNAL-EXEC-COCKPIT |
| Repo layout | `engineering/REPO-LAYOUT.md` | `PRODUCTION-REPO-STRUCTURE.md` |
| Data model | `engineering/data-model.md` | `lib/db` |
| Design system | `engineering/design-system.md` | ADR 0007, 0008 |

### Operations & company

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| Support runbook | `operations/support-runbook.md` | `INTERNAL-SUPPORT-LIFECYCLE.md` |
| Support investigation | `operations/SUPPORT-POINTS-AND-INVESTIGATION.md` | `INTERNAL-SUPPORT-SYSTEM-DESIGN.md` |
| Customer support model | `operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md` | — |
| Exec operator runbook | `operations/EXEC-COMMAND-CENTER.md` | `FOUNDER-RELEASE-RUNBOOK.md` |
| Workforce / beta access | `operations/WORKFORCE-ONBOARDING.md` | Track H in evolution program |
| Env vars | `operations/ENV-VARIABLES.md` | `.env.example` |
| Platform backlog | `operations/PLATFORM-BACKLOG.md` | audits |
| **R1 live status (URL map + exit criteria)** | `operations/R1-BUILD-STATUS.md` | — |
| Founder OKRs | `company/EXECUTIVE-ACTION-PLAN.md` | `EXECUTIVE-MULTI-HAT-REVIEW.md` |
| GTM / markets | `business/MARKET-COUNTRY-PLAYBOOKS.md` | `business/sales-motion.md` |
| Operator go-live | `business/OPERATOR-READY-PACK.md` | templates/ |
| Commercial plan | `product/LIVIA-MASTER-PLAN.md` | `launch-plan.md` |
| Monetization | `product/LIVIA-OS-MONETIZATION.md` | `business/pricing-and-packaging.md` · lock record `business/PRICING-RECONCILIATION-2026-06-02.md` |

### Testing & honesty

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| Full test | `testing/FULL-TESTING-INSTRUCTIONS.md` | `E2E-RUNBOOK.md`, `REAL-WORLD-E2E-GUIDE.md` |
| Marketing truth | `audits/marketing-vs-reality.md` | — |
| Production readiness | `audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md` | — |
| UX audit (2026-05-24) | `testing/UX-FULL-PLATFORM-AUDIT-2026-05-24.md` | `UX-CONTEXTUAL-REVIEW.md` |

### Brand & legal

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| Livia / Liv split | `company/brand-of-livia-and-liv.md` | `brand/voice.md` |
| Logo (locked) | `docs/brand/assets/` + `VISUAL-INHERITANCE-AND-BRAND-LOCKS.md` | `BRAND-LOGO-CONCEPTS.md` (exploration) |
| Legal drafts | `legal/*` | counsel for G3 |

---

## Tier 4 — Historical (archived — do not extend)

See [`archive/README.md`](./archive/README.md). Includes: `SYSTEM-REALIGNMENT-PROGRAM`, `BUILD-BACKLOG`, V1.5/V2 execution programs, `PLATFORM-SURFACES-UX-REDESIGN`, `livia-internal-portal-spec`, point-in-time UX audits.

**v2 closed:** [`product/V2-ENGINEERING-CLOSED.md`](./product/V2-ENGINEERING-CLOSED.md) · ADR 0020

---

## Deprecated patterns

| Do not use | Use instead |
|------------|-------------|
| “Active program = realignment” | `OPERATION-SOLIDIFY` + `PLATFORM-EVOLUTION` |
| `livia.io` for production URLs | `livia-hq.com` |
| “cockpit” for tenant dashboard | **tenant dashboard** or `/dashboard` |
| Hair continuity timeline as wedge interstitial | G1-A tattoo-style interstitial |
| Merge W3 exec + support UI | Separate specs + shared I0 shell |
| Extend `BUILD-BACKLOG.md` | `PLATFORM-BACKLOG.md` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Documentation program — build pause, category manifesto, UX/skin/systems specs |
| 2026-05-30 | Full audit — tiers, surface programs, archive, terminology, gap review link |
| 2026-05-30 | Track H workforce + platform surfaces (prior) |
