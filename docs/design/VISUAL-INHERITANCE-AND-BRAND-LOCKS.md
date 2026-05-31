# Visual inheritance & brand locks

**Status:** canonical (2026-05-30)  
**Audience:** founder, product, design, engineering, agents  
**Purpose:** Single map of **what is locked visually**, **which north-star PNG anchors each surface family**, and **how pages inherit** — so the platform evolves together, not page-by-page.

**Reads with:** [`LIVIA-EVOLUTION-SCREENS.md`](./LIVIA-EVOLUTION-SCREENS.md) · [`PLATFORM-RELEASE-PROGRAM.md`](../product/PLATFORM-RELEASE-PROGRAM.md) · [`LIVIA-PLATFORM-LIFECYCLE.md`](../product/LIVIA-PLATFORM-LIFECYCLE.md) §0.2

---

## 1. Brand lock — Livia Inc logo

| Decision | Value |
|----------|--------|
| **Shipped mark** | **Aurum Lv roundel** — Cormorant Garamond, champagne gradient on italic **v** only |
| **Assets** | `docs/brand/assets/livia-wordmark.svg`, `livia-mark.svg`, `livia-app-icon.svg` |
| **Code** | `artifacts/*/src/components/brand/LiviaMark.tsx` |
| **Concept explorations** | Archived in gallery `/experience/brand-logos` — **not** for implementation until founder reopens |

**Rule:** Platform surfaces (marketing, gateway, internal) use this mark. Tenant `/b` uses **business logo**; Liv is the agent voice, not the nav wordmark.

---

## 2. Visual anchor per surface family

Each family has one **north-star evolution PNG** that defines layout density, token use, and narrative tone. All sibling pages **inherit** — they vary structure, not theme.

| Surface family | URL / artifact | Visual anchor | Inheritance doc |
|----------------|----------------|---------------|-----------------|
| **Marketing** | `livia-hq.com` | [`northstar/m1-home-web.png`](./assets/livia-evolution/northstar/m1-home-web.png) | [`MARKETING-SURFACE-PROGRAM.md`](./MARKETING-SURFACE-PROGRAM.md) |
| **Gateway / demo** | `app.…/demo` | [`northstar/g1-wedge-web.png`](./assets/livia-evolution/northstar/g1-wedge-web.png) | [`GATEWAY-SURFACE-PROGRAM.md`](./GATEWAY-SURFACE-PROGRAM.md) |
| **Internal support** | `ops.…/support/*` | [`northstar/i4-thread-web.png`](./assets/livia-evolution/northstar/i4-thread-web.png) | [`INTERNAL-SUPPORT-PLATFORM-SPEC.md`](../product/INTERNAL-SUPPORT-PLATFORM-SPEC.md) |
| **Internal exec** | `ops.…` exec cockpit | [`northstar/i2-shiplane-web.png`](./assets/livia-evolution/northstar/i2-shiplane-web.png) | [`INTERNAL-EXEC-COCKPIT-SPEC.md`](../product/INTERNAL-EXEC-COCKPIT-SPEC.md) |
| **Tenant app** | `app.…` dashboard + mobile | [`northstar/tenant-inbox-web.png`](./assets/livia-evolution/northstar/tenant-inbox-web.png) + [`northstar/tenant-today-mobile.png`](./assets/livia-evolution/northstar/tenant-today-mobile.png) | [`TENANT-EXPERIENCE-CONTRACT.md`](../product/TENANT-EXPERIENCE-CONTRACT.md) |
| **Public guest (P7)** | `/b/{slug}/*` | [`northstar/public-book-mobile.png`](./assets/livia-evolution/northstar/public-book-mobile.png) + [`northstar/guest-proof-mobile.png`](./assets/livia-evolution/northstar/guest-proof-mobile.png) | [`PUBLIC-B-SURFACE-SPEC.md`](../product/PUBLIC-B-SURFACE-SPEC.md) |

**Tier folders** (`now/`, `v3/`, `northstar/`) in [`assets/livia-evolution/`](./assets/livia-evolution/) show **release maturity** for the same screen families — see [`PLATFORM-RELEASE-PROGRAM.md`](../product/PLATFORM-RELEASE-PROGRAM.md).

**Legacy lock PNGs** in [`assets/platform-surfaces/`](./assets/platform-surfaces/) remain valid for founder-approved layouts (M1-R2, G1 tattoo interstitial, I2/I4). Evolution north-stars supersede them for **build target** density, not for layout rejection.

---

## 3. Inheritance rules (all families)

| Rule | Meaning |
|------|---------|
| **One skin per world** | W1 marketing, W2 gateway, W3 internal, W4 tenant, W5 public — never merge (lifecycle doc §1) |
| **M0 / I0 shell** | Marketing pages share nav+footer; internal modules share sidebar + INTERNAL banner |
| **Layout may differ; tokens may not** | Pricing = cards; legal = prose — same ink, serif, aurora, € |
| **Honesty** | Visual density must not imply shipped features — tier PNGs label maturity |
| **Programmatic coupling** | Visual family ships with its policy + API slice in the same release (R1, R2, R3) |

---

## 4. Wedge story clarity (gateway)

**Founder lock:** Every vertical wedge uses the **G1-A interstitial pattern** (grid → 3–4 beat story → enter demo), exemplified by **body-art/tattoo** — not the alternate continuity-timeline layout.

| ✅ Do | ❌ Don't |
|-------|----------|
| 3–4 steps, one sentence + one UI crop each | Full product tour on interstitial |
| Trade-specific **one** hero workflow | Cram every feature (book + SMS + Today + settings) on one screen |
| Hair: Inbox → book link → reminder → Today | Hair “continuity timeline” that tries to fit too much |

Hair and other wedges are **unique in copy and crop**, **identical in clarity and pacing** as tattoo. See [`GATEWAY-SURFACE-PROGRAM.md`](./GATEWAY-SURFACE-PROGRAM.md) §3.

---

## 5. Platform-wide change checklist

Before documenting or building any surface family, confirm:

1. **Which world (W1–W5)?** — wrong skin = reject
2. **Which release (R1/R2/R3)?** — `now/` vs `northstar/` target
3. **Policy + API deps?** — guest token, surfaceId, preset, wedge story module
4. **Sibling pages updated?** — inheritance matrix row, not orphan route
5. **Other families affected?** — e.g. support `surfaceId` ↔ tenant route ↔ `/b` guest page

---

## 6. W4/W5 skin inheritance (doc sprint)

**Authority:** [`SKIN-BRAND-INHERITANCE-SPEC.md`](./SKIN-BRAND-INHERITANCE-SPEC.md)

| World | Inherits | Owner-editable |
|-------|----------|----------------|
| W1–W3 | Platform fixed chrome | Marketing copy only |
| W4 tenant web/mobile | Preset + brand + vertical pack | Logo, cover, accent, preset |
| W5 `/b` | Same preset + brand as tenant | Same fields — **live mobile preview** in Settings |
| W6 guest hub (R2) | Separate guest chrome | N/A |

Screen cards: [`FIGMA-SCREEN-MANIFEST.md`](./FIGMA-SCREEN-MANIFEST.md) · inventory [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md).

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Initial locks: Aurum logo, visual anchors, wedge clarity, inheritance rules |
| 2026-05-31 | §6 skin inheritance cross-link to SKIN-BRAND-INHERITANCE-SPEC |
