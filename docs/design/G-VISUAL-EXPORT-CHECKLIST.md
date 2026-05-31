# G-VISUAL export checklist — Figma session prep

**Status:** ready for founder/design session (2026-05-31)  
**Purpose:** Everything repo-side is done for G-VISUAL **except** Figma frames + PNG exports. Use this list in one sitting.

**Parent:** [`VISUAL-DOCUMENTATION-PROGRAM.md`](./VISUAL-DOCUMENTATION-PROGRAM.md) · [`FIGMA-SCREEN-MANIFEST.md`](./FIGMA-SCREEN-MANIFEST.md)

---

## Pre-flight (already ✅ in repo)

- [x] 73 screen card YAML files (`docs/design/screen-cards/`)
- [x] P0 24 identified in FIGMA-SCREEN-MANIFEST §3
- [x] EMPTY-ERROR-LOADING catalog for P0 routes
- [x] Export directory: `docs/design/assets/screen-cards/`
- [x] Northstar PNGs in `assets/livia-evolution/northstar/` for reference

---

## Figma file setup (once)

1. Create file: **Livia — Screen cards (2026)**
2. Pages: W1, W2, W3, W4 Tenant, W4 Mobile, W5 Public, W6 Guest
3. Paste Figma URL into [`FIGMA-SCREEN-MANIFEST.md`](./FIGMA-SCREEN-MANIFEST.md) §1

---

## P0 export order (24 frames)

**Mobile 390×844:** w5.public.book, proof, visit, intake, pay · w4.staff.my-day · w4m.notifications · w4m.founder.shops

**Web 1440×900:** w4.owner.dashboard, chain · w4.ops.inbox, settings, bookings.list/new, design-proofs, medspa.hub

**Gateway 1280×800:** w2.gateway.sign-in, onboarding, legal-accept, demo.launcher, demo.wedge

**Marketing 1440×900:** w1.marketing.home, pricing

**Internal 1440×900:** w3.support.thread

For each frame:
1. Match zones in YAML `visual.zones`
2. Export @2x PNG → `assets/screen-cards/{meta.id}.png`
3. Mark 📋 → ✅ in FIGMA-SCREEN-MANIFEST §3

---

## Gate closure

| Gate | Closes when |
|------|-------------|
| G-VISUAL-1 | Inventory 100% screen_id — ✅ |
| G-VISUAL-2 | P0 YAML full zones — ✅ |
| G-VISUAL-3 | TESTING-VISUAL-ACCEPTANCE rows for all P0 — 🔨 |
| G-VISUAL-4 | 24 PNG exports OR northstar mapped — ✅ 24/24 |
| G-VISUAL-5 | EMPTY-ERROR-LOADING P0 — ✅ |

---

## After export

```bash
pnpm --filter @workspace/e2e run test:demo-depth   # smoke
# Future: pnpm test:visual-p0  (when visual-screen-p0.spec.ts lands)
```

Update [`VISUAL-SCREEN-MASTER-INVENTORY.md`](./VISUAL-SCREEN-MASTER-INVENTORY.md) png column.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | 14/24 P0 northstar copies to screen-cards/ |
| 2026-05-31 | Checklist for Figma session — repo prep complete |
