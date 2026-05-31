# Livia — top-level status

**Updated:** 2026-05-31  
**Read this first** for “are we finished?” — not the phase checklists in build-plan v2.

---

## One sentence

**Core platform engineering (R1–R3 + build-plan v2 phases 0–6) is done in the repo; the product is not finished** — tenant UX polish, visual QA, and founder/production gates are still open.

---

## Four buckets (flat)

| Bucket | Status | What it means for you |
|--------|--------|------------------------|
| **A — Platform engineering** | **Done** | APIs, policy hub, 9 verticals, guest `/b`, presets matrix, CI, demo seeds, support registry, mobile parity hooks |
| **B — Screen implementation** | **In progress (~55%)** | Density program — see **Bucket B checklist** below |
| **C — Visual & founder acceptance** | **Not done** | No full P0 screenshot gate in CI; Figma frames incomplete; founder field UAT not signed off for production presets |
| **D — Launch & field** | **Not done** | Gate 2 (10 Dublin shops), prod preset flag, App Store / Stripe prod evidence |

**You are right to UAT now for feel and layout** — that is bucket **B + C**, not “future R4.” There is no R4; only **R∞** (incremental polish toward north-star screens).

---

## Bucket B checklist (done = you can UAT tenant UX confidently)

| Surface / item | Status |
|----------------|--------|
| Policy: `tenant-surface-density.ts` | Done |
| Spec: `docs/design/SURFACE-DENSITY.md` | Done |
| Owner/manager `/dashboard` | Done (ritual, contextual modules, disclosures) |
| `/inbox` three-pane density | Done (context rail only when thread selected; shorter viewport) |
| Staff `/my-day` | Done (timeline only when 2+ bookings; tighter spacing) |
| `/settings` shop + tabs | Done (compact booking link strip; contact fields collapsed) |
| Other P0 tenant routes (bookings list, toolkit, etc.) | Not started |
| P0 visual regression CI (`visual-screen-p0`) | Not started |
| Founder compare to northstar PNGs | Not started |

**Bucket B is complete** when every row above is **Done** and staging deploy includes the changes.

---

## Active work (now)

| Item | Notes |
|------|-------|
| My-day + settings density | Next engineering slice |
| P0 visual regression | After density pass |
| Railway deploy | Use GitHub or `railway up` with `.railwayignore` — [`docs/operations/RAILWAY-DEPLOY.md`](operations/RAILWAY-DEPLOY.md) |
| Env sync | `pnpm railway:build-prod-env --write` then `pnpm railway:sync-env` |

---

## Not started / R∞ (after B+C good enough)

- North-star density on all 11 screen families (`now/` → `v3/` → `northstar/`)
- Mobile full preset morph (phone/tablet)
- WhatsApp Liv Personal pilot
- Custom domain on `/b`
- Gate 2 field evidence (`pnpm smoke:gate2`)

---

## Releases (no nesting required)

| Release | Engineering in repo | Product “feels finished” |
|---------|---------------------|---------------------------|
| R1 | Closed | Partial |
| R2 | Closed | Partial |
| R3 | Closed | Partial |
| R∞ | Ongoing | **This is where UX polish lives** |

Detail logs (only if you need receipts): `docs/operations/R1-BUILD-STATUS.md`, `R2-…`, `R3-…`, `PROGRAM-ENGINEERING-EXIT.md`.

---

## Authority map (when docs disagree)

| Question | Doc |
|----------|-----|
| **“Where are we?”** | **This file** |
| Scope locks | `docs/product/LIVIA-FINAL-BUILD-PLAN.md` |
| Phase checklists (historical) | `docs/product/LIVIA-BUILD-PLAN-V2.md` |
| What to build next (wide queue) | `docs/product/LIVIA-WIDE-BUILD-PLAN.md` |
| Screen truth | `docs/design/screen-cards/*.yaml` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Created top-level status; clarified engineering done ≠ product finished; active UX pass on owner dashboard |
