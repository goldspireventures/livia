# Screen card schema — visual depth standard

**Status:** canonical (2026-05-31)  
**Purpose:** Every Livia screen gets a **screen card** with the same depth as north-star PNGs / Figma frames — layout, tokens, motion, states, tests — so "generate a visual of XYZ" is always answerable from docs.

**Location:** `docs/design/screen-cards/{screen-id}.yaml`  
**Inventory:** [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md)  
**Testing:** [`../testing/TESTING-VISUAL-ACCEPTANCE.md`](../testing/TESTING-VISUAL-ACCEPTANCE.md)

---

## 1. Required sections

Every screen card MUST include:

| Section | Purpose |
|---------|---------|
| `meta` | id, world, route, artifact, persona, verticals |
| `job` | One sentence — why this screen exists |
| `visual` | **Layout zones, typography, color, density** — Figma-grade |
| `components` | Named UI blocks and behaviour |
| `motion` | Tokens from motion-tokens.md |
| `copy` | Headlines, CTAs, Liv lines (vertical variants) |
| `states` | loading, empty, error, permission, offline |
| `breakpoints` | phone, tablet, desktop differences |
| `acceptance` | Human + automated checks |
| `traceability` | northstar PNG, surfaceId, OpenAPI, e2e spec |

---

## 2. Visual block standard (the depth you asked for)

The `visual` section uses **zones** top-to-bottom (mobile-first):

```yaml
visual:
  canvas:
    device: phone | tablet | desktop
    safe_area: top notch + bottom home indicator
    background: token or gradient description
  zones:
    - id: header
      height: 56px | auto
      content: [logo, business name, back]
      sticky: true
    - id: hero
      height: 40vh max
      content: [cover image, primary CTA]
    - id: body
      layout: stack | scroll | split
      content: [...]
    - id: footer
      content: [policy link, powered by hidden]
  typography:
    display: Cormorant 28px / preset display font
    body: Inter 16px / preset sans
    label: 12px uppercase tracking
  color:
    primary_cta: brandAccentHex or preset primary
    surface: preset surface token
    text: preset foreground
  density: comfortable | compact | spacious
  elevation: flat | card | sheet
```

**Rule:** A designer or Figma agent can build from `visual` alone without reading code.

---

## 3. Example meta block

```yaml
meta:
  id: w5.public.book.mobile
  world: W5
  route: "/b/:slug"
  artifact: livia-dashboard
  persona: [P7]
  verticals: all
  release: R1
  status: designed # scaffold | designed | built | verified
```

---

## 4. Priority tiers

| Tier | Count | Gate |
|------|-------|------|
| **P0** | 24 | G-UX-1 — build Phase 1 blocked without these |
| **P1** | 48 | G-UX-2 — R1 complete |
| **P2** | 60+ | R2/R3 |

---

## 5. Figma linkage (Phase I)

| Field | Value |
|-------|--------|
| `figma.file` | TBD — Livia Platform Surfaces 2026 |
| `figma.frame` | `{world}/{screen-id}` |
| `figma.status` | not_started \| draft \| locked |

When Figma frame exists, add screenshot to `docs/design/assets/screen-cards/{id}.png`.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial schema — visual zones standard |
