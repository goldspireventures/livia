# Platform surfaces — final screen catalog

**Status:** canonical (2026-05-29)  
**Gallery (dev):** http://localhost:5173/experience/platform-surfaces  
**Code:** `artifacts/livia-dashboard/src/lib/platform-surfaces-concepts.ts` → `FINAL_PLATFORM_SCREENS`

---

## Purpose

Single inventory of **approved** Livia platform visuals — locks + north-stars + alternate layouts. Deprecated A/B/C concept PNGs removed from repo.

| Status | Meaning |
|--------|---------|
| **locked** | Founder-approved — build to this |
| **north-star** | Target UI — aspirational but buildable; foundations laid in policy/API now |
| **alternate** | Valid layout morph — same data, different route (e.g. support board) |

**North-star rule:** Dream forward (guest proof, mobile today, investigate) but **token + API + surfaceId** foundations documented in [`LIVIA-PLATFORM-FLOWS.md`](../product/LIVIA-PLATFORM-FLOWS.md) so we extend, not overhaul.

**Company north-star:** UI north-stars are one layer. Livia the product is **programmatic-first** — policy + API + seed define behaviour; screens render it. See [`LIVIA-PLATFORM-LIFECYCLE.md`](../product/LIVIA-PLATFORM-LIFECYCLE.md) §0.2.

---

## Inventory (29 PNGs)

### Marketing — livia-hq.com

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| M0 | Global shell | `final-marketing-m0-shell.png` | locked |
| M1 | Home — One thread (story) | `marketing-home-r2-one-thread-story.png` | **locked** |
| M2 | Pricing honest € | `marketing-pricing-a-aurora-honest.png` | **locked** |
| M3 | How it works | `final-marketing-m3-how-it-works.png` | north-star |
| M4 | Vertical index | `final-marketing-m4-verticals.png` | north-star |

### Gateway

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| G1 | Wedge grid | `gateway-demo-a-wedge-story-grid.png` | **locked** |
| G1 | Body-art story | `gateway-demo-a-wedge-story-tattoo.png` | locked variant |
| G1 | Hair story | `gateway-demo-c-continuity-hair.png` | ⚠️ **Not interstitial ref** — use G1-A tattoo shell + hair beats (see gateway program) |
| G3 | Sign-in | `final-gateway-g3-sign-in.png` | north-star |

### Tenant public (P7 guest)

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| W5 | Public book `/b` | `final-public-b-book.png` | north-star |
| W5 | Guest visit token | `final-public-guest-visit.png` | north-star |
| G1 | Guest design proof | `final-public-guest-proof.png` | north-star (Track G) |

### Tenant app (W4)

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| W4 | Dashboard inbox | `final-tenant-dashboard-inbox.png` | north-star |
| W4 | Design proofs desk | `final-tenant-dashboard-proofs.png` | north-star |
| W4 | Mobile staff Today | `final-tenant-mobile-today.png` | north-star |

### Internal exec

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| I2 | Ship Lane summary | `internal-exec-shiplane-collapsed.png` | **locked** |
| I2 | Ship Lane detail | `internal-exec-shiplane-expanded.png` | locked variant |
| I2 | Hats River | `internal-exec-c-hats-river.png` | locked variant |
| I2 | Exceptions | `internal-exec-tabbed-exceptions.png` | locked variant |

### Internal support

| ID | Screen | PNG | Status |
|----|--------|-----|--------|
| I4-A | The Thread | `internal-support-a-the-thread.png` | **locked** |
| I4-A | Queue / thread / context | `internal-support-a-tab-*.png` | locked variants |
| I4-B | Triage board | `internal-support-b-kanban-*.png` | alternate |
| I4-C | Tenant radar | `internal-support-c-radar-*.png` | alternate |
| I5 | Investigate | `final-internal-support-investigate.png` | north-star |

---

## Founder locks (summary)

| ID | Pick |
|----|------|
| M1 | R2 One thread (story) |
| M2 | A Aurora honest pricing |
| G1 | A Wedge story |
| I2 | Ship Lane collapse + Hats + Exceptions |
| I4 | A Thread primary; B/C alternate routes |

---

## Build tracks (visual → code)

| Visual | Track | Phase |
|--------|-------|-------|
| Marketing M0–M4 | F | F1–F2, F4, F7 |
| Gateway G1, G3 | F | F3 |
| Guest proof / visit / book | G | G0–G1 |
| Tenant inbox / proofs / mobile | D + G | D3–D6, G1 |
| Internal exec | F | F5 |
| Internal support | F + B/C | F6, B1 |

---

## Removed (2026-05-29)

Retired concept rounds: S1–S3, H1–H3, R1/R3, pricing B/C, gateway B/C, rejected cockpit mockups, duplicate support concepts. See git history if needed.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-29 | Final catalog — 29 PNGs, gallery restructured, deprecated assets deleted |
