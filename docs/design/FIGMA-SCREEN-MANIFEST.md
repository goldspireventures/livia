# Figma screen manifest

**Status:** canonical (2026-05-31)  
**Purpose:** Map every screen card `figma.frame` id to a Figma file page — source of truth for design ↔ doc ↔ PNG export.

**Parent:** [`VISUAL-DOCUMENTATION-PROGRAM.md`](./VISUAL-DOCUMENTATION-PROGRAM.md) · cards in [`screen-cards/`](./screen-cards/)

---

## 1. Figma file structure (target)

| Page | World | Frame prefix |
|------|-------|--------------|
| **W1 Marketing** | W1 | `w1.*` |
| **W2 Gateway** | W2 | `w2.*` |
| **W4 Tenant web** | W4 | `w4.ops.*`, `w4.owner.*` |
| **W4 Mobile** | W4 | `w4m.*`, `w4.staff.*` |
| **W5 Public /b** | W5 | `w5.*` |
| **W3 Internal** | W3 | `w3.*` |
| **W6 Guest hub** | W6 | `w6.*` |

**File name (canonical):** `Livia — Screen cards (2026)`  
**Figma URL:** https://www.figma.com/design/UBpZerM73ycJICZYxtJaFC/Livia-%E2%80%94-Screen-cards-(2026)  
**Figma session prep:** [`G-VISUAL-EXPORT-CHECKLIST.md`](./G-VISUAL-EXPORT-CHECKLIST.md)

---

## 2. Export workflow

1. Screen card YAML defines `figma.frame` (e.g. `w5.public.book.mobile`).
2. Designer (or agent via Figma MCP) creates frame at **390×844** for mobile, **1440×900** for web tenant, **1280×800** for internal.
3. Export PNG @2x → [`assets/screen-cards/{meta.id}.png`](./assets/screen-cards/).
4. Update [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md) `png` column to ✅.
5. Visual acceptance: [`TESTING-VISUAL-ACCEPTANCE.md`](../testing/TESTING-VISUAL-ACCEPTANCE.md).

---

## 3. P0 frame checklist (24)

| meta.id | figma.frame | png export |
|---------|-------------|------------|
| w5.public.book.mobile | w5.public.book.mobile | ✅ northstar |
| w5.public.proof.mobile | w5.public.proof.mobile | ✅ northstar |
| w5.public.visit.mobile | w5.public.visit.mobile | ✅ northstar |
| w5.public.intake.mobile | w5.public.intake.mobile | ✅ Figma + fallback |
| w5.public.pay.mobile | w5.public.pay.mobile | ✅ Figma stub |
| w4.staff.my-day.mobile | w4.staff.my-day.mobile | ✅ northstar |
| w4.owner.dashboard.web | w4.owner.dashboard.web | ✅ northstar |
| w4.owner.chain.web | w4.owner.chain.web | ✅ Figma export |
| w4.ops.inbox.web | w4.ops.inbox.web | ✅ northstar |
| w4.ops.settings.web | w4.ops.settings.web | ✅ Figma export |
| w4.ops.bookings.list.web | w4.ops.bookings.list.web | ✅ fallback v1 |
| w4.ops.bookings.new.web | w4.ops.bookings.new.web | ✅ fallback v1 |
| w4.ops.design-proofs.web | w4.ops.design-proofs.web | ✅ northstar |
| w4.ops.medspa.hub.web | w4.ops.medspa.hub.web | ✅ fallback v1 |
| w4m.notifications.mobile | w4m.notifications.mobile | ✅ northstar |
| w4m.founder.shops.mobile | w4m.founder.shops.mobile | ✅ fallback v1 |
| w2.gateway.sign-in.web | w2.gateway.sign-in.web | ✅ northstar |
| w2.gateway.onboarding.web | w2.gateway.onboarding.web | ✅ Figma export |
| w2.gateway.legal-accept.web | w2.gateway.legal-accept.web | ✅ Figma export |
| w2.gateway.demo.launcher.web | w2.gateway.demo.launcher.web | ✅ northstar |
| w2.gateway.demo.wedge.web | w2.gateway.demo.wedge.web | ✅ northstar |
| w1.marketing.home.web | w1.marketing.home.web | ✅ northstar |
| w1.marketing.pricing.web | w1.marketing.pricing.web | ✅ northstar |
| w3.support.thread.web | w3.support.thread.web | ✅ northstar |

P1 frames: see [`screen-cards/README.md`](./screen-cards/README.md) — 47 cards with `figma.frame` set; export as Phase I continues.

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Figma file URL + 10 wireframe frames; 24/24 PNG gate closed |
| 2026-05-31 | Initial manifest + P0 checklist; PNG export workflow |
