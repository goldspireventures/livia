# Livia — top-level status

**Updated:** 2026-05-31  
**Read this first** for “are we finished?” — not the phase checklists in build-plan v2.

---

## One sentence

**Core platform engineering (R1–R3 + build-plan v2 phases 0–6) is done in the repo; launch-quality feel** still needs founder Bucket C sign-off on staging.

---

## Four buckets (flat)

| Bucket | Status | What it means for you |
|--------|--------|------------------------|
| **A — Platform engineering** | **Done** | APIs, policy hub, 9 verticals, guest `/b`, presets matrix, CI, demo seeds, support registry, mobile parity hooks |
| **B — Screen implementation** | **Done** | Density + northstar gate — see **Bucket B checklist** below |
| **C — Visual & founder acceptance** | **In progress (~65%)** | UAT specs + staging checks — **your walkthrough** closes this bucket |
| **D — Launch & field** | **Not done** | Gate 2 (10 Dublin shops), prod preset flag, App Store / Stripe prod evidence |

**You are right to UAT now for feel and layout** — that is bucket **B + C**. There is no R4; only **R∞** (incremental polish toward north-star screens).

---

## Bucket B checklist (engineering — done)

| Surface / item | Status |
|----------------|--------|
| Policy: `tenant-surface-density.ts` | Done |
| Spec: `docs/design/SURFACE-DENSITY.md` | Done |
| Owner/manager `/dashboard` | Done |
| `/inbox`, `/my-day`, `/settings`, `/toolkit`, `/chain`, `/medspa`, `/design-proofs`, `/lifecycle`, `/customers` | Done |
| `/bookings` list + detail + new | Done |
| P0 E2E density smoke | Done |
| Northstar asset sync CI (`pnpm northstar:check`) | Done |
| Northstar pixel diff E2E | Done |

---

## Bucket C checklist (founder — your pass)

| Item | Status |
|------|--------|
| Founder UAT doc | Done — [`docs/operations/FOUNDER-UAT-CHECKLIST.md`](operations/FOUNDER-UAT-CHECKLIST.md) |
| `pnpm founder:uat-preflight` | Done |
| E2E `founder-uat-p0.spec.ts` (medspa + luxe, axe) | Done |
| Screen-card pixel diff (`screen-card-p0-pixel.spec.ts`) | Done |
| `preset-public-parity` in dashboard CI project | Done |
| G-VISUAL: settings / bookings / medspa PNG mapped | Done |
| Staging readiness: dashboard bundle API leak check | Done |
| `/customers` + `/staff` + `/services` + client detail density | Done |
| **Founder staging walkthrough signed** | **Not done** — you |
| Tighten northstar `maxDiffPixelRatio` after sign-off | Not started |

**Bucket C is complete** when you reply **“Bucket C UAT passed”** (with any exceptions) after staging checklist.

---

## Active work (now)

| Item | Notes |
|------|-------|
| **Vertical programs (all 9)** | [`VERTICAL-PROGRAMS-INDEX.md`](product/VERTICAL-PROGRAMS-INDEX.md) · build [`LIVIA-VERTICALS-BUILD-PLAN.md`](product/LIVIA-VERTICALS-BUILD-PLAN.md) |
| **Execution focus** | Phase V1: **beauty** + **hair** UAT; Phase V2: beta-full parity |
| **Your UAT** | Medspa + Bloom + Luxe in [`FOUNDER-UAT-CHECKLIST.md`](operations/FOUNDER-UAT-CHECKLIST.md); beta smokes in each program doc |
| Staging | **`livia-stg`** only — [`VERCEL-DEPLOY-ENVIRONMENTS.md`](operations/VERCEL-DEPLOY-ENVIRONMENTS.md) |
| Local automation | `pnpm founder:uat-preflight` then `test:founder-uat` |

---

## Not started / R∞ (after C)

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
| R∞ | Ongoing | **Bucket C closes “feels finished” for R1 demo** |

Detail logs: `docs/operations/R1-BUILD-STATUS.md`, `PROGRAM-ENGINEERING-EXIT.md`.

---

## Authority map (when docs disagree)

| Question | Doc |
|----------|-----|
| **“Where are we?”** | **This file** |
| Scope locks | `docs/product/LIVIA-FINAL-BUILD-PLAN.md` |
| Screen truth | `docs/design/screen-cards/*.yaml` + PNG baselines `docs/design/assets/screen-cards/` (`pnpm screen-cards:status`) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | All nine vertical program docs + VERTICALS build plan + `vertical:doc-check` for every enum |
| 2026-06-01 | Beauty program + Bloom UAT; mobile preset tint; doc propagation cascade |
| 2026-05-31 | Screen-card P0 registry + `screen-cards:status` / `screen-cards:update` (PNG = per-screen northstar) |
| 2026-05-31 | Bucket C: founder UAT checklist, E2E, screen-card pixel gate |
| 2026-05-31 | Bucket B complete |
