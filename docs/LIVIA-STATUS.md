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
| **B — Screen implementation** | **Done** | Density + northstar gate — see **Bucket B checklist** below |
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
| Staff `/my-day` | Done |
| `/settings` shop + tabs | Done |
| `/toolkit` | Done (focused Liv hub; deferred exports/settings) |
| `/chain` | Done (collapsed shop grid; alerts only when present) |
| `/medspa` clinical hub | Done (signal-first tab; compact rows) |
| `/design-proofs` | Done (queue first; submit collapsed when busy) |
| `/lifecycle` | Done (programs disclosure; empty state) |
| `/customers` | Done (merge panel hidden when empty) |
| `/bookings` list + detail + new | Done (compact list; merged detail card; wizard test id) |
| P0 E2E density smoke (`e2e/tests/visual-screen-p0.spec.ts`) | Done |
| Northstar asset sync CI (`pnpm northstar:check`) | Done |
| Northstar pixel diff E2E (`e2e/tests/northstar-p0-pixel.spec.ts`) | Done (lenient vs design PNG; needs Clerk locally) |

**Bucket B is complete** — staging deploy should include latest `main` for UAT.

---

## Active work (now)

| Item | Notes |
|------|-------|
| **Bucket C** | Founder field UAT vs northstar feel; tighten `maxDiffPixelRatio` over time |
| Staging deploy | Pull `main` — Vercel app + Railway GitHub |
| Run locally | `pnpm northstar:check` · `pnpm --filter @workspace/e2e run test:p0-visual` · `test:northstar-p0` (Clerk) |

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
