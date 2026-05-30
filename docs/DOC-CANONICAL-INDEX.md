# Documentation canonical index

**Purpose:** When two docs disagree, **this table wins**.  
**Terminology:** [`PLATFORM-TERMINOLOGY.md`](./PLATFORM-TERMINOLOGY.md)  
**Archived docs:** [`archive/README.md`](./archive/README.md) — do not extend  
**Updated:** 2026-05-30 (full audit + platform surface programs)

---

## How to navigate

| I need to… | Open |
|------------|------|
| **Start heavy build** | [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) |
| Understand the company | [`LIVIA-ALIGNMENT.md`](./LIVIA-ALIGNMENT.md) |
| Build something today | [`product/OPERATION-SOLIDIFY.md`](./product/OPERATION-SOLIDIFY.md) + [`operations/PLATFORM-BACKLOG.md`](./operations/PLATFORM-BACKLOG.md) |
| Ship a platform release | [`product/PLATFORM-RELEASE-PROGRAM.md`](./product/PLATFORM-RELEASE-PROGRAM.md) |
| See honest API vs UI gaps | [`product/LIVIA-IDEA-TO-REALITY.md`](./product/LIVIA-IDEA-TO-REALITY.md) |
| Run locally | [`START-HERE.md`](./START-HERE.md) · [`LOCAL_DEV.md`](./LOCAL_DEV.md) |
| Audit every doc (line-by-line) | [`operations/DOC-AUDIT-REGISTRY.md`](./operations/DOC-AUDIT-REGISTRY.md) |
| Gap review / what we missed | [`product/MULTI-HAT-GAP-REVIEW.md`](./product/MULTI-HAT-GAP-REVIEW.md) |

---

## Tier 1 — Start here (read order)

| # | Document | Role |
|---|----------|------|
| 0 | [`product/LIVIA-FINAL-BUILD-PLAN.md`](./product/LIVIA-FINAL-BUILD-PLAN.md) | **Master execution scope — LOCKED** |
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
| Notifications | `product/NOTIFICATIONS.md` | workflows/ |
| Public booking E2E | `product/PUBLIC-BOOKING-INTAKE-E2E.md` | `PUBLIC-B-SURFACE-SPEC.md` |
| Guest identity (no login) | `product/GUEST-CUSTOMER-IDENTITY.md` | `GUEST-CONTINUITY-HUB-SPEC.md`, `customer-typologies.md` |
| Add a new vertical | `engineering/VERTICAL-ADD-PLAYBOOK.md` | `vertical-coverage.ts`, `COMPOSABLE-EVOLUTION.md` §5.3 |
| Web/mobile parity | `product/WEB-MOBILE-PARITY.md` | `design/MOBILE-UX-PRINCIPLES.md` |
| Production-ready | `product/LIVIA-PRODUCTION-READY.md` | `OPEN-ITEMS-DEFERRED.md` |
| EU complete spec | `product/LIVIA-COMPLETE-SYSTEM-SPEC.md` | — |

### Engineering

| Topic | Canonical | Supporting |
|-------|-----------|------------|
| Master build phases | `product/LIVIA-MASTER-BUILD-PLAN.md` | `LIVIA-OS-MASTER-PLAN.md` |
| Platform kernel | `engineering/PLATFORM-KERNEL.md` | ADRs |
| Composable evolution | `engineering/COMPOSABLE-EVOLUTION.md` | TENANT-EXPERIENCE-CONTRACT |
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
| Founder OKRs | `company/EXECUTIVE-ACTION-PLAN.md` | `EXECUTIVE-MULTI-HAT-REVIEW.md` |
| GTM / markets | `business/MARKET-COUNTRY-PLAYBOOKS.md` | `business/sales-motion.md` |
| Operator go-live | `business/OPERATOR-READY-PACK.md` | templates/ |
| Commercial plan | `product/LIVIA-MASTER-PLAN.md` | `launch-plan.md` |
| Monetization | `product/LIVIA-OS-MONETIZATION.md` | `business/pricing-and-packaging.md` |

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
| 2026-05-30 | Full audit — tiers, surface programs, archive, terminology, gap review link |
| 2026-05-30 | Track H workforce + platform surfaces (prior) |
