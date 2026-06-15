# Livia — top-level status

**Updated:** 2026-06-15 (guest placement + Liv Era 1 lock)  
**Read this first** for “are we finished?” — execution sequencing: [`product/LIVIA-MASTER-EXECUTION-PLAN-V3.md`](product/LIVIA-MASTER-EXECUTION-PLAN-V3.md).  
**GTM + vertical parity:** [`product/GTM-VERTICAL-DEPTH-PROGRAM.md`](product/GTM-VERTICAL-DEPTH-PROGRAM.md).  
**Liv today → JARVIS:** [`product/LIV-OPERATING-SYSTEM.md`](product/LIV-OPERATING-SYSTEM.md) §16.  
**Guest placement rules:** [`design/GUEST-SURFACE-PLACEMENT-CONTRACT.md`](design/GUEST-SURFACE-PLACEMENT-CONTRACT.md).

---

## One sentence

**Core platform engineering (R1–R3) is done in the repo; V1 market proof (activation, retention, MRR) is not.** Architecture is ahead of proof — see [`product/REPO-VS-BLUEPRINT-GAP-MATRIX.md`](product/REPO-VS-BLUEPRINT-GAP-MATRIX.md).

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
| **Guest placement P0** | `/book` hotfix shipped — registry sweep [`GUEST-SURFACE-PLACEMENT-CONTRACT.md`](design/GUEST-SURFACE-PLACEMENT-CONTRACT.md) §6 (P0b–P3 queued) |
| **Liv Era 1** | Policy OS + bounded agent; mandate ladder locked — no auto deposit waive — [`LIV-OPERATING-SYSTEM.md`](product/LIV-OPERATING-SYSTEM.md) §16 |
| **GTM Wave 1 (founder lock)** | **All 9 code verticals** at one creative parity bar — [`GTM-VERTICAL-DEPTH-PROGRAM.md`](product/GTM-VERTICAL-DEPTH-PROGRAM.md) · innovation [`VERTICAL-INNOVATION-PROGRAM.md`](product/VERTICAL-INNOVATION-PROGRAM.md) |
| **Guest surfaces** | Retire user-facing `/b` → **`{slug}.livia-hq.com`** book + **`/my`** relationship (vertical morph) |
| **Sub-segment onboarding** | Org shape + category profile at create — full beauty aisle + all vertical sub-segments |
| **Vertical programs (all 9)** | [`VERTICAL-PROGRAMS-INDEX.md`](product/VERTICAL-PROGRAMS-INDEX.md) · build [`LIVIA-VERTICALS-BUILD-PLAN.md`](product/LIVIA-VERTICALS-BUILD-PLAN.md) |
| **Execution focus** | Era 1 **depth waves D0–D4** (subdomain, `/my`, relationship, demo seed) in parallel with capability instances |
| **Your UAT** | Nine-slug showcase + guest hub — [`FOUNDER-UAT-CHECKLIST.md`](operations/FOUNDER-UAT-CHECKLIST.md) |
| **Ring 2 — event vendors (V12)** | Program + consult-first spec complete — [`EVENT-VENDORS-VERTICAL-PROGRAM.md`](product/EVENT-VENDORS-VERTICAL-PROGRAM.md); design-partner decor operator queued for P1 build |
| Staging | **`livia-stg`** only — [`VERCEL-DEPLOY-ENVIRONMENTS.md`](operations/VERCEL-DEPLOY-ENVIRONMENTS.md) |
| Local automation | `pnpm founder:uat-preflight` then `test:founder-uat` |

---

## Not started / R∞ (after C)

- North-star density on all 11 screen families (`now/` → `v3/` → `northstar/`)
- Mobile full preset morph (phone/tablet)
- WhatsApp Liv Personal pilot
- Custom domain on book subdomain (Wave 1b)
- Gate 2 field evidence (`pnpm smoke:gate2`)
- Event coverage sweep on remaining mutation paths (notifications, incidents — lower priority)

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
| **Architecture / V1 vs V2** | `docs/product/MASTER-BLUEPRINT-INDEX.md` |
| **What to build when** | `docs/product/LIVIA-MASTER-EXECUTION-PLAN-V3.md` |
| **V1 scope only** | `docs/product/V1-PRODUCT-DEFINITION.md` |
| **Repo gaps** | `docs/product/REPO-VS-BLUEPRINT-GAP-MATRIX.md` |
| Scope locks (R1–R3) | `docs/product/LIVIA-FINAL-BUILD-PLAN.md` |
| Screen truth | `docs/design/screen-cards/*.yaml` + PNG baselines (`pnpm screen-cards:status`) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-15 | Guest placement contract + Liv Era 1 doc (§16); `/book` deposit in summary, silent hub autofill, universal deposits |
| 2026-06-05 | GTM Wave 1 lock — nine verticals, one bar; subdomain + `/my`; innovation program; retire `/b` UX |
| 2026-06-05 | Master Blueprint Volumes 0–H; V3 execution plan; Era 1 focus replaces open-ended wellness wave 7 |
| 2026-06-02 | R∞: Liv setup copilot spec + Track I in evolution program |
| 2026-06-01 | All nine vertical program docs + VERTICALS build plan + `vertical:doc-check` for every enum |
| 2026-06-01 | Beauty program + Bloom UAT; mobile preset tint; doc propagation cascade |
| 2026-05-31 | Screen-card P0 registry + `screen-cards:status` / `screen-cards:update` (PNG = per-screen northstar) |
| 2026-05-31 | Bucket C: founder UAT checklist, E2E, screen-card pixel gate |
| 2026-05-31 | Bucket B complete |
