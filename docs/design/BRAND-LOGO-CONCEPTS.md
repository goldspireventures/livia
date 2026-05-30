# Livia Inc — logo concepts

**Status:** exploration (2026-05-29)  
**Gallery (dev):** http://localhost:5173/experience/brand-logos  
**Shipped SVGs:** [`docs/brand/assets/`](../brand/assets/)

---

## Where to look

| Location | What |
|----------|------|
| **Dev gallery (live vectors)** | `/experience/brand-logos` — nav mock, app icon, favicon, light surface |
| **Platform surfaces gallery** | Link from `/experience/platform-surfaces` header |
| **PNG concept sheets** | [`assets/brand-logos/`](./assets/brand-logos/) |
| **Shipped mark (code)** | `artifacts/*/src/components/brand/LiviaMark.tsx` |
| **Legacy sandbox mocks** | `artifacts/mockup-sandbox/.../livia-wordmarks/` (Aurum, Atelier, …) |

---

## Current (shipped) ✅ **LOCKED**

**Aurum Lv roundel** — Cormorant Garamond, champagne gradient on italic **v** only, soft ring monogram.

**Founder decision (2026-05-30):** Keep Aurum for all platform surfaces. Concept explorations remain in dev gallery for future review only — **do not implement** Thread L / Open Arc / etc. until explicitly reopened.

Works for Aurora Editorial (M0/M1). See [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./VISUAL-INHERITANCE-AND-BRAND-LOCKS.md).

---

## Concepts (founder review)

| # | Name | Idea | Pick when |
|---|------|------|-----------|
| 1 | **Thread L** | Aurora stroke loops into L; champagne knot | M1 continuity becomes brand |
| 2 | **Open arc** | L→v via unclosed arc | “Ongoing relationship” over sealed badge |
| 3 | **Signal dot** | Cyan pulse dot + wordmark | Favicon-first, minimal chrome |
| 4 | **L–v ligature** | Shared stem typography | Pure editorial; no icon needed |
| 5 | **Steward** | Livia + Liv whisper | Two-brand split visible in lockup |

**Decision:** **Aurum Lv roundel locked** (2026-05-30). Concepts archived — gallery for exploration only.

---

## Constraints (same as platform visuals)

- Aurora Editorial tokens: ink `#0e0e16`, cream `#f6f3ec`, champagne `#d9c39a`, cyan `#06b6d4`
- Cormorant display; champagne accent **only on v** (Liv whisper)
- No “AI sparkle”, no disrupt/10x aesthetic
- Must read at **32px favicon** and **180px app icon**

---

## App icon vs nav mark

Concepts **1 (Thread L)** and **2 (Open Arc)** — **nav + wordmark unchanged**. Pick an app icon variant in gallery:

### Thread L icons

| ID | Name |
|----|------|
| `thread-spool-wrap` | Thread wraps L corner |
| `thread-needle-loop` | Stem through thread eye |
| `thread-corner-curl` | Single-stroke L + curl |

### Open Arc icons

| ID | Name |
|----|------|
| `arc-horizon-rise` | L bar + horizon arc above |
| `arc-swoosh-tail` | L + outward motion swoosh |
| `arc-touchpoint` | Connection dot + approaching arc |

---

Gallery renders **live React/SVG** (`LogoConceptMarks.tsx`). PNGs are static exports for docs/decks; vectors are source of truth for build.
