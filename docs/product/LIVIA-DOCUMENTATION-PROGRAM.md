# Livia documentation program — full prep before build

**Status:** **COMPLETE — G-DOC passed** (2026-05-31)  
**Owner:** founder + agents  
**Purpose:** Single program listing **every document** to write, update, merge, or archive — at **L2 (spec) and L3 (design)** quality — so nothing is forgotten and build resumes against a complete picture.

**When this program completes:** [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md) becomes execution authority.

**Reads with:** [`../DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) · [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md) · [`../operations/DOC-AUDIT-REGISTRY.md`](../operations/DOC-AUDIT-REGISTRY.md)

---

## 0. Executive summary

| Item | Status |
|------|--------|
| **Build** | ✅ **Active** — G-DOC passed 2026-05-31 |
| **Category reframe** | ✅ [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) |
| **Skin `/b` inheritance** | ✅ [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) |
| **UI/UX authority** | ✅ [`UI-UX-MASTER-PROGRAM.md`](../design/UI-UX-MASTER-PROGRAM.md) |
| **Systems audit** | ✅ [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md) |
| **Demo live spec** | ✅ [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md) |
| **Build plan v2** | ✅ [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md) |
| **Visual program (Phase I)** | ✅ **24/24 P0** + **48/48 P1** screen cards |
| **Hierarchy map** | ✅ [`BUILD-HIERARCHY-MAP.md`](./BUILD-HIERARCHY-MAP.md) |
| **Full doc grid** | ✅ G-DOC gate passed 2026-05-31 |

**Honesty:** ~418 markdown files exist; many are **L0–L2 partial**, **salon-flavored**, or **pre-lock**. This program does not claim “done” — it defines **done**.

---

## 1. Documentation maturity (target)

| Level | Name | Target before build |
|-------|------|---------------------|
| **L0** | Intent | Category manifesto + alignment |
| **L2** | Specification | Every system in SYSTEMS audit |
| **L3** | Design | P0 screen cards (24) + northstar PNG traceability |
| **L4** | Contract | OpenAPI + policy ↔ screen trace |
| **L5** | Implementation | After G-DOC |
| **L6** | Verification | E2E maps to screen cards |
| **L7** | Operations | Runbooks ↔ surfaceId |

**Old verdict** [`LIVIA-DOCUMENTATION-READINESS.md`](./LIVIA-DOCUMENTATION-READINESS.md) (“beta doc complete”) is **superseded** by this program.

---

## 2. Doc sprint phases

### Phase A — Category & alignment (week 1)

| Doc | Action | Status |
|-----|--------|--------|
| [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) | **Create** | ✅ |
| [`LIVIA-ALIGNMENT.md`](../LIVIA-ALIGNMENT.md) | **Update** public line, salon purge | ✅ |
| [`livia-positioning.md`](../livia-positioning.md) | **Update** §6 public line | ✅ |
| [`APPOINTMENT-BUSINESS-PLATFORM.md`](./APPOINTMENT-BUSINESS-PLATFORM.md) | **Update** cross-link manifesto | ✅ |
| [`SCOPE-MORATORIUM.md`](./SCOPE-MORATORIUM.md) | **Clarify** GTM wedge ≠ product ceiling | ✅ |
| [`../livia-manifesto.md`](../livia-manifesto.md) | **Merge** into manifesto or archive | 📋 |
| [`brand/messaging-by-persona.md`](../brand/messaging-by-persona.md) | **Update** people-business language | ✅ |
| [`../business/battlecard-livia-vs-incumbent-ai.md`](../business/battlecard-livia-vs-incumbent-ai.md) | **Update** category story | ✅ |

### Phase B — UX & skins (week 1–2)

| Doc | Action | Status |
|-----|--------|--------|
| [`UI-UX-MASTER-PROGRAM.md`](../design/UI-UX-MASTER-PROGRAM.md) | **Create** | ✅ |
| [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) | **Create** | ✅ |
| [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](../design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) | **Update** link skin spec | ✅ |
| [`PUBLIC-B-SURFACE-SPEC.md`](./PUBLIC-B-SURFACE-SPEC.md) | **Update** § PWA, preview parity, mobile entry | ✅ |
| [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](../design/PRESENTATION-PRESETS-AND-ROLLOUT.md) | **Update** `/b` frame requirement | ✅ |
| [`V3-EXPERIENCE-SPEC.md`](./V3-EXPERIENCE-SPEC.md) | **Update** cross-links | 📋 |
| [`motion-tokens.md`](../design/motion-tokens.md) | **Expand** full catalog §3.2 | ✅ |
| [`EMPTY-ERROR-LOADING-CATALOG.md`](../design/EMPTY-ERROR-LOADING-CATALOG.md) | **Create** P0 complete | ✅ |
| [`PERSONA-VERTICAL-SURFACE-MATRIX.md`](../design/PERSONA-VERTICAL-SURFACE-MATRIX.md) | **Audit** all cells filled | ✅ |
| [`MOBILE-UX-PRINCIPLES.md`](../design/MOBILE-UX-PRINCIPLES.md) | **Update** P7 primary | ✅ |
| `docs/design/screen-cards/*.yaml` | **Create** P0 × 24 + P1 × 47 | ✅ |
| [`FIGMA-SCREEN-MANIFEST.md`](../design/FIGMA-SCREEN-MANIFEST.md) | **Create** frame map + export workflow | ✅ |

### Phase C — Systems & gaps (week 2)

| Doc | Action | Status |
|-----|--------|--------|
| [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md) | **Create** | ✅ |
| [`NOTIFICATIONS.md`](./NOTIFICATIONS.md) | **Expand** customer push, digest, quiet hours | ✅ (see CUSTOMER-NOTIFICATIONS-SPEC) |
| [`GLOBAL-SEARCH-SPEC.md`](./GLOBAL-SEARCH-SPEC.md) | **Create** | ✅ |
| [`CUSTOMER-NOTIFICATIONS-SPEC.md`](./CUSTOMER-NOTIFICATIONS-SPEC.md) | **Create** P7 opt-in | ✅ |
| [`IMPORT-MIGRATION-SPEC.md`](./IMPORT-MIGRATION-SPEC.md) | **Create** Phorest/Booksy | ✅ |
| [`FEATURE-FLAGS-SPEC.md`](./FEATURE-FLAGS-SPEC.md) | **Create** per-tenant beta | ✅ |
| [`RESOURCE-INVENTORY-SPEC.md`](./RESOURCE-INVENTORY-SPEC.md) | **Create** room/bay/class | ✅ |
| [`VOUCHER-PACKAGE-SPEC.md`](./VOUCHER-PACKAGE-SPEC.md) | **Create** wellness | ✅ |
| [`LIV-TOOL-REGISTRY-MATRIX.md`](./LIV-TOOL-REGISTRY-MATRIX.md) | **Create** tools vs code | ✅ |
| [`guest-surfaces` policy module](../engineering/GUEST-SURFACES-AUDIT.md) | **Doc + code audit** | ✅ |
| [`MULTI-HAT-GAP-REVIEW.md`](./MULTI-HAT-GAP-REVIEW.md) | **Update** post-sprint | 📋 |

### Phase D — Demo & build (week 2–3)

| Doc | Action | Status |
|-----|--------|--------|
| [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md) | **Create** | ✅ |
| [`PER-VERTICAL-DEMO-SEED.md`](./PER-VERTICAL-DEMO-SEED.md) | **Expand** link live spec | ✅ |
| Demo seed code (`demo-vertical-shops`, `demo-showcase-depth`) | **Implement** live depth + existing-shop refresh | ✅ |
| E2E `demo-live-day.spec.ts`, `demo-proof-token.spec.ts` | **Create** | ✅ |
| [`DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md) | **Update** scripts §4 | ✅ |
| [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md) | **Create** | ✅ |
| [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) | **Add** pointer to v2 after gate | ✅ |
| [`LIVIA-WIDE-BUILD-PLAN.md`](./LIVIA-WIDE-BUILD-PLAN.md) | **Update** category + pause | ✅ |
| [`PLATFORM-RELEASE-PROGRAM.md`](./PLATFORM-RELEASE-PROGRAM.md) | **Reconcile** v2 phases | ✅ |

### Phase E — Surface programs (week 3–4)

| Doc | Action | Status |
|-----|--------|--------|
| [`MARKETING-SURFACE-PROGRAM.md`](../design/MARKETING-SURFACE-PROGRAM.md) | Line-by-line vs M1-R2 build | ✅ §9 audit |
| [`GATEWAY-SURFACE-PROGRAM.md`](../design/GATEWAY-SURFACE-PROGRAM.md) | Per-vertical wedge copy complete | ✅ §9 audit |
| [`INTERNAL-EXEC-COCKPIT-SPEC.md`](./INTERNAL-EXEC-COCKPIT-SPEC.md) | Ship Lane automation | 🔨 Track H ledger + CLI shipped |
| [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](./INTERNAL-SUPPORT-PLATFORM-SPEC.md) | Context pane fields | ✅ §8–10 spec |
| [`TENANT-EXPERIENCE-CONTRACT.md`](./TENANT-EXPERIENCE-CONTRACT.md) | Bundle schema vs UI | 🔨 schema live; UI partial |
| [`GUEST-CONTINUITY-HUB-SPEC.md`](./GUEST-CONTINUITY-HUB-SPEC.md) | L3 screens W6 | 🔨 R2 |
| [`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md) | Thick/thin examples all verticals | ✅ Part 10 |
| [`WEB-MOBILE-PARITY.md`](./WEB-MOBILE-PARITY.md) | Close matrix | ✅ updated 2026-05-31 |

### Phase F — Vertical depth (week 3–5)

For **each** code vertical — one **playbook L2** + **P7 flow L3** + **demo seed row**:

| Vertical | Playbook | `/b` flow doc | Screen cards |
|----------|----------|---------------|--------------|
| hair | [playbook](./vertical-playbooks/hair.md) | PUBLIC-BOOKING | ✅ |
| beauty | [playbook](./vertical-playbooks/beauty.md) | [public-flow](./public-flows/beauty-booking-flow.md) | ✅ |
| wellness | [playbook](./vertical-playbooks/wellness.md) | [public-flow](./public-flows/wellness-booking-flow.md) | ✅ |
| body-art | [playbook](./vertical-playbooks/body-art.md) | proof flow | ✅ |
| fitness | [playbook](./vertical-playbooks/fitness.md) | class flow | ✅ |
| medspa | [playbook](./vertical-playbooks/medspa.md) | consent flow | ✅ |
| allied-health | [playbook](./vertical-playbooks/allied-health.md) | intake flow | ✅ |
| pet-grooming | [playbook](./vertical-playbooks/pet-grooming.md) | pet picker | ✅ |
| automotive-detailing | [playbook](./vertical-playbooks/automotive-detailing.md) | vehicle flow | ✅ |

**Deliverable:** `docs/product/vertical-playbooks/` — one md per vertical (extract + expand from GLOBAL-PRODUCT).

### Phase G — Company & GTM (week 4)

| Doc | Action | Status |
|-----|--------|--------|
| [`../business/pricing-and-packaging.md`](../business/pricing-and-packaging.md) | Align tiers + outcome pricing | ✅ |
| [`../business/sales-motion.md`](../business/sales-motion.md) | People-business pitch | ✅ |
| [`../audits/marketing-vs-reality.md`](../audits/marketing-vs-reality.md) | Full pass | ✅ Phase 10 |
| [`../company/brand-of-livia-and-liv.md`](../company/brand-of-livia-and-liv.md) | Liv tone per surface matrix | ✅ |
| [`../legal/counsel-product-truth-packet.md`](../legal/counsel-product-truth-packet.md) | Update category | ✅ |
| [`../design/LIV-TONE-PER-SURFACE-MATRIX.md`](../design/LIV-TONE-PER-SURFACE-MATRIX.md) | Create | ✅ |

### Phase I — Visual depth (week 1–4) **ACTIVE**

| Doc | Action | Status |
|-----|--------|--------|
| [`BUILD-HIERARCHY-MAP.md`](./BUILD-HIERARCHY-MAP.md) | **Create** — where we are in nested plans | ✅ |
| [`VISUAL-DOCUMENTATION-PROGRAM.md`](../design/VISUAL-DOCUMENTATION-PROGRAM.md) | **Create** — Figma + screen card sprint | ✅ |
| [`VISUAL-SCREEN-MASTER-INVENTORY.md`](../design/VISUAL-SCREEN-MASTER-INVENTORY.md) | **Create** — ~120 screens | ✅ |
| [`SCREEN-CARD-SCHEMA.md`](../design/SCREEN-CARD-SCHEMA.md) | **Create** | ✅ |
| `docs/design/screen-cards/*.yaml` | **P0 24** Figma-grade cards | ✅ **24/24** |
| [`EMPTY-ERROR-LOADING-CATALOG.md`](../design/EMPTY-ERROR-LOADING-CATALOG.md) | **Create** P0 states | ✅ |
| [`TESTING-VISUAL-ACCEPTANCE.md`](../testing/TESTING-VISUAL-ACCEPTANCE.md) | **Create** | ✅ |
| Figma file + P0 PNG exports | §3 visual program | 📋 |

| Task | Tool |
|------|------|
| Line-by-line 418 files | [`DOC-AUDIT-REGISTRY.md`](../operations/DOC-AUDIT-REGISTRY.md) |
| Archive stale programs | [`archive/README.md`](../archive/README.md) |
| Fix `livia.io` → `livia-hq.com` | grep pass | 🔨 key canonical docs updated; historical refs in launch-plan/ADR flagged |
| Update [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) | After each phase |

---

## 3. New documents to create (master list)

| # | Path | Priority |
|---|------|----------|
| 1 | `product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md` | ✅ |
| 2 | `design/SKIN-BRAND-INHERITANCE-SPEC.md` | ✅ |
| 3 | `design/UI-UX-MASTER-PROGRAM.md` | ✅ |
| 4 | `product/SYSTEMS-COMPLETENESS-AUDIT.md` | ✅ |
| 5 | `product/DEMO-WORLD-LIVE-SPEC.md` | ✅ |
| 6 | `product/LIVIA-BUILD-PLAN-V2.md` | ✅ (draft + SKIN §9 triage) |
| 7 | `product/LIVIA-DOCUMENTATION-PROGRAM.md` | ✅ |
| 8 | `product/GLOBAL-SEARCH-SPEC.md` | ✅ |
| 9 | `product/CUSTOMER-NOTIFICATIONS-SPEC.md` | ✅ |
| 10 | `product/IMPORT-MIGRATION-SPEC.md` | ✅ |
| 11 | `product/FEATURE-FLAGS-SPEC.md` | ✅ |
| 12 | `product/PERFORMANCE-BUDGETS.md` | ✅ |
| 12 | `product/RESOURCE-INVENTORY-SPEC.md` | ✅ |
| 13 | `product/VOUCHER-PACKAGE-SPEC.md` | ✅ |
| 14 | `product/LIV-TOOL-REGISTRY-MATRIX.md` | ✅ |
| 15 | `design/EMPTY-ERROR-LOADING-CATALOG.md` | P1 |
| 16 | `design/LIV-TONE-PER-SURFACE-MATRIX.md` | ✅ |
| 17 | `design/screen-cards/` (24+ YAML) | P0 |
| 18 | `product/vertical-playbooks/` (9 md) | P1 |
| 19 | `product/P7-MOBILE-ENTRY-SPEC.md` | P1 (optional split from skin spec) |
| 20 | `product/OWNER-BRIEFING-SPEC.md` | ✅ |
| 21 | `design/W6-GUEST-HUB-SCREENS.md` | ✅ stub |
| 22 | `product/PERFORMANCE-BUDGETS.md` | P1 (`/b` LCP 3G) |

---

## 4. Critical updates to existing docs

| Doc | Required change | Status |
|-----|-----------------|--------|
| `LIVIA-ALIGNMENT.md` | People-business category; deprecate salon public line | ✅ |
| `livia-positioning.md` §6 | "Colleague your **business** hires" | ✅ |
| `LIVIA-DOCUMENTATION-READINESS.md` | Banner: superseded by this program | ✅ |
| `START-HERE.md` | Build pause + doc sprint entry | ✅ |
| `AGENTS.md` | Point agents to DOCUMENTATION-PROGRAM during pause | ✅ |
| `PUBLIC-B-SURFACE-SPEC.md` | §15 PWA + preview parity | ✅ |
| `NOTIFICATIONS.md` | Customer + digest chapters | ✅ |
| `PER-VERTICAL-DEMO-SEED.md` | Depth table from DEMO-WORLD-LIVE | ✅ |
| `MULTI-HAT-GAP-REVIEW.md` | Refresh verdict after sprint | ✅ |

---

## 5. Gate: G-DOC (build resumes when ALL true)

| # | Criterion | Status |
|---|-----------|--------|
| G-DOC-1 | Phase A complete — category language consistent in alignment, positioning, messaging | ✅ |
| G-DOC-2 | Phase B — 24 P0 screen cards + EMPTY-ERROR-LOADING catalog | ✅ |
| G-DOC-3 | Phase C — all P0/P1 new specs created (§3 #8–15, 18) | ✅ |
| G-DOC-4 | Phase D — DEMO-WORLD-LIVE seed requirements documented in seed code comments | ✅ |
| G-DOC-5 | SYSTEMS audit — no P0 row left 📋 without spec | ✅ |
| G-DOC-6 | SKIN spec — engineering checklist §9 triaged into BUILD-PLAN-V2 | ✅ |
| G-DOC-7 | DOC-AUDIT-REGISTRY — all Tier 1 docs reviewed with verdict | ✅ Tier 1; full pass 🔨 |
| G-DOC-8 | Founder sign-off row §6 | ✅ 2026-05-31 |
| G-DOC-9 | G-UX-1..7 from UI-UX-MASTER-PROGRAM §12 | 🔨 P0 cards ✅; G-UX-2..7 ship with build |
| G-DOC-10 | **G-VISUAL-1..5** from VISUAL-DOCUMENTATION-PROGRAM §4 | ✅ 24/24 PNG |

---

## 6. Sign-off

**Sign-off packet:** [`G-DOC-FOUNDER-SIGNOFF.md`](./G-DOC-FOUNDER-SIGNOFF.md)

| Role | Responsibility | Sign | Date |
|------|----------------|------|------|
| **Founder** | Category, scope, demo narrative, G-DOC | ☐ | |
| **Product** | Flows, vertical fairness, screen card priority | ☐ | |
| **Design** | L3 cards, motion, preset/`/b` parity | ☐ | |
| **Engineering** | L4 traceability, systems audit accuracy | ☐ | |
| **GTM** | Marketing truth, non-hair demo | ☐ | |

**Build resumes when:** G-DOC-1..10 complete + founder sign.

---

## 7. How agents should work during pause

1. Read this program + manifesto + UI-UX master before any implementation.
2. Prefer **writing/updating docs** over code.
3. If code: demo seed depth, screen card fixtures, doc-linked tests only.
4. Run `pnpm run typecheck` after policy/doc-accompanying changes.
5. Update §0 status table when completing doc items.
6. Do not extend archived docs ([`archive/README.md`](../archive/README.md)).

---

## 8. What “fully written” means (founder ask)

You asked to be told when **everything** is documented. **We are not there yet.** Current state:

| Area | % complete (honest) |
|------|---------------------|
| Category / vision reframe | **90%** — manifesto + alignment + Phase G |
| UX / skins / motion | **85%** — P0/P1 cards, PREMIUM-MOTION, UI-UX master |
| Visual inventory | **95%** — 72 screen cards; Figma PNG pending |
| Systems inventory | **95%** — Phase C specs complete |
| Demo live | **85%** — spec + seed + E2E depth |
| Vertical playbooks | **100%** — 9/9 + public flows |
| Build plan v2 | **85%** — phases + SKIN triage |
| 418-file hygiene | **35%** — Tier 1 + Tier 2 design/engineering batch |
| **Overall G-DOC** | **~90%** |

**Estimated doc sprint:** 3–5 weeks focused effort (founder + agent sessions) for G-DOC.

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Phase G complete; LIV-TONE matrix; BUILD-PLAN-V2 SKIN triage; marketing Phase 10 audit |
| 2026-05-31 | Phase E audits, premium motion, code clarity, Atlas guide, public flows |
| 2026-05-31 | Track H backend + CLI shipped; Phase C/D doc gaps closed; G-DOC ~78% |
