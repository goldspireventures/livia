# Visual documentation program — every screen, Figma depth

**Status:** ACTIVE — Phase I of doc sprint (2026-05-31)  
**Parent:** [`LIVIA-DOCUMENTATION-PROGRAM.md`](../product/LIVIA-DOCUMENTATION-PROGRAM.md)  
**Hierarchy:** [`BUILD-HIERARCHY-MAP.md`](../product/BUILD-HIERARCHY-MAP.md) — **you are at L1 Phase I**

---

## 0. Goal

For **every screen/page** on Livia: a screen card with **Figma-grade visual depth** + northstar/PNG or Figma frame + E2E/visual test row — so asking "what should XYZ look like?" always has an answer in repo.

**Not:** vague wireframes. **Yes:** zones, tokens, motion, copy, states — same depth as existing platform surface PNGs.

---

## 1. Deliverables

| # | Deliverable | Path | Status |
|---|-------------|------|--------|
| 1 | Master inventory (all routes) | [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md) | ✅ |
| 2 | Screen card schema | [`SCREEN-CARD-SCHEMA.md`](./SCREEN-CARD-SCHEMA.md) | ✅ |
| 3 | P0 screen cards (24) | `screen-cards/*.yaml` | ✅ **24/24** |
| 4 | P1 screen cards (48+) | `screen-cards/*.yaml` | ✅ **73 total** |
| 5 | Empty/error/loading catalog | [`EMPTY-ERROR-LOADING-CATALOG.md`](./EMPTY-ERROR-LOADING-CATALOG.md) | ✅ |
| 6 | Visual acceptance testing | [`../testing/TESTING-VISUAL-ACCEPTANCE.md`](../testing/TESTING-VISUAL-ACCEPTANCE.md) | 🔨 P0 matrix expanding |
| 7 | Figma file structure | §3 + [`G-VISUAL-EXPORT-CHECKLIST.md`](./G-VISUAL-EXPORT-CHECKLIST.md) | 📋 session prep ready |
| 8 | PNG exports per P0 | `assets/screen-cards/` | ✅ 24/24 |

---

## 2. Phase I sprint order

| Week | Work |
|------|------|
| **I.1** | Master inventory complete; P0 cards 1–8 (guest + staff + owner + gateway) |
| **I.2** | P0 cards 9–16 (inbox, onboarding, settings, marketing home/pricing) |
| **I.3** | P0 cards 17–24 (chain, proofs, medspa hub, internal Thread) |
| **I.4** | P1 batch — vertical-specific `/b` variants, mobile parity |
| **I.5** | Figma frames for P0; screenshot diff baseline in CI |

---

## 3. Figma organization (target)

```
Livia Platform 2026/
├── W1 Marketing/
├── W2 Gateway/
├── W3 Internal/
├── W4 Tenant Web/
├── W4 Mobile/
├── W5 Public Guest/
└── W6 Guest Hub (R2)
```

Each frame named `{screen-id}` matching inventory `meta.id`.

**Workflow:** Screen card YAML → Figma via figma-generate-design skill OR manual design sprint → export PNG → `assets/screen-cards/` → Playwright visual compare.

**Code Connect:** Later — map shadcn/Livia components to Figma library ([`figma-code-connect`](../../.cursor/skills)).

---

## 4. Gate G-VISUAL (extends G-DOC)

| # | Criterion | Status |
|---|-----------|--------|
| G-VISUAL-1 | Master inventory 100% rows have screen_id | ✅ |
| G-VISUAL-2 | P0 24 YAML cards with full `visual.zones` | ✅ |
| G-VISUAL-3 | Each P0 has `acceptance.e2e` row in TESTING-VISUAL-ACCEPTANCE | 🔨 |
| G-VISUAL-4 | 24 PNG exports OR northstar mapped | ✅ 24/24 |
| G-VISUAL-5 | EMPTY-ERROR-LOADING covers all P0 routes | ✅ |

**Figma session:** [`G-VISUAL-EXPORT-CHECKLIST.md`](./G-VISUAL-EXPORT-CHECKLIST.md)

---

## 5. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | G-VISUAL gate status + export checklist |
| 2026-05-31 | Phase I visual program started |
