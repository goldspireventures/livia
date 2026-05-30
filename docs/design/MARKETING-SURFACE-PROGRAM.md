# Marketing surface program — livia-hq.com

**Status:** canonical (2026-05-30)  
**Artifact:** `artifacts/livia-marketing` → **https://livia-hq.com**  
**Visual anchor:** [`assets/livia-evolution/northstar/m1-home-web.png`](./assets/livia-evolution/northstar/m1-home-web.png)  
**Founder locks:** M1-R2 One thread (story) · M2-A Aurora honest pricing (€, no badge) · Aurum Lv logo  
**Reads with:** [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) · [`PLATFORM-SURFACES-BUILD-SPEC.md`](./PLATFORM-SURFACES-BUILD-SPEC.md) §1.2

---

## 1. What livia-hq.com is

**Job:** Sell **Livia the company and category** — not a feature brochure (Book / Inbox / Today grid). Prospects must feel:

1. **Continuity** — one thread from first DM to day-of and rebook
2. **EU craft** — premium, honest, not “AI startup” aesthetic
3. **Trade respect** — salons, barbers, tattoo, medspa are worlds, not generic “SMB”

**Who:** Prospects (P?), partners, press, candidates. **Never** tenant preset chrome or business logos.

---

## 2. Visual anchor — northstar home

The north-star home PNG defines for **all marketing pages**:

| Element | Spec |
|---------|------|
| **Background** | Ink `#0e0e16` with soft aurora radial wash |
| **Type** | Cormorant serif display; sans body |
| **Accent** | Aurora cyan CTAs; champagne eyebrows and Liv lines |
| **Structure** | **Story scroll** — sections linked by subtle continuity thread (not feature grid) |
| **Density** | Rich but breathable — one idea per viewport band |
| **Currency** | **€ only** — `pricing-catalog.ts` |
| **Logo** | Aurum Lv roundel in M0 nav |

**Implementation path:** R1 ships `now/` density toward this anchor; R3 approaches `v3/`; north-star is design ceiling.

---

## 3. M0 global shell (every page)

| Region | Spec |
|--------|------|
| **Nav** | Sticky dark blur bar; logo + Pricing + How it works + Verticals + Start free |
| **Footer** | 4-column; status, legal, changelog; mono version string |
| **Motion** | Nav opacity on scroll; respect `prefers-reduced-motion` |

No page may ship with a third theme or orphan header.

---

## 4. Page inheritance matrix

All routes **inherit M0 + anchor tokens**. Layout personality varies; skin does not.

| ID | Route | Layout | Inherits from home anchor |
|----|-------|--------|---------------------------|
| **M1** | `/`, `/de` | Story-first hero, continuity thread | **Primary anchor** — sets tone |
| **M2** | `/pricing` | Glass tier cards, honest € | Same tokens; no “Most Popular” badge |
| **M3** | `/how-it-works` | Journey timeline Book → Inbox → Today → Liv | Same story beat as M1, more literal |
| **M4** | `/verticals` | Trade card grid → deep links | Halo icons; links to M5 + demo wedge |
| **M5** | `/verticals/:slug` | Trade hero + 3 bullets + demo CTA | Copy from `VERTICAL_COVERAGE_REGISTRY`; CTA → `/demo/wedge/:vertical` |
| **M6** | `/for/chair-rental` | Host / multi-chair narrative | Same shell; chair-rental vocabulary |
| **M7** | `/europe`, locale | Jurisdiction honesty | Same shell; localized H1 where `/de` |
| **M8** | `/eu-ai` | Long-read + TOC | M0 chrome only |
| **M9** | `/contact` | Frosted form + vertical + country | Same tokens |
| **M10–M12** | changelog, status, legal | Calm utility layouts | M0 minimal chrome |

**Flow:** Home → vertical interest → M5 or demo wedge → sign-up on `app.` — never trap on marketing for product work.

---

## 5. Copy & honesty

| Rule | Source |
|------|--------|
| Claims match shipped product | [`marketing-vs-reality.md`](../audits/marketing-vs-reality.md) |
| Liv voice on marketing | [`brand/voice.md`](../brand/voice.md) — Livia-mouth about Liv |
| No tenant preset on marketing | Lifecycle W1 boundary |

---

## 6. Release alignment

| Release | Marketing deliverable |
|---------|----------------------|
| **R1** | M0 token pass, M1-R2 home, M2-A pricing, M4/M5 stubs, wedge CTAs |
| **R2** | M3 journey, M7 locale pass, changelog/status live |
| **R3** | Full matrix; localized `/de`; vertical SEO depth |

Track **F** in [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md).

---

## 7. Anti-patterns

- Feature grid hero (“Book, Inbox, Today, Settings”)
- USD pricing on EU GTM pages
- Screenshots of internal ops amber UI
- Demo that dumps full product before wedge story

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Marketing program — anchor PNG, inheritance matrix, M1-R2 lock |
