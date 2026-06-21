# Livia — top-level status

**Updated:** 2026-06-15 (Era 1 D0–D4 engineering wave)  
**Readiness scores:** `pnpm readiness:score` · [`REPO-VS-BLUEPRINT-GAP-MATRIX.md`](product/REPO-VS-BLUEPRINT-GAP-MATRIX.md)  
**Read this first** for “are we finished?” — execution sequencing: [`product/LIVIA-MASTER-EXECUTION-PLAN-V3.md`](product/LIVIA-MASTER-EXECUTION-PLAN-V3.md).  
**GTM + vertical parity:** [`product/GTM-VERTICAL-DEPTH-PROGRAM.md`](product/GTM-VERTICAL-DEPTH-PROGRAM.md) · [`product/COMPETITIVE-PARITY-PROGRAM.md`](product/COMPETITIVE-PARITY-PROGRAM.md)  
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
| **C — Visual & founder acceptance** | **In progress (80%)** | UAT specs + staging checks green — **your walkthrough** closes this bucket |
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

## Active work (now) — **Era 1 Q1** (Activation Year)

**Hat:** `cpo` + `cto` · **Spine:** GTM Wave 1 depth waves **D0–D4** · [`LIVIA-MASTER-EXECUTION-PLAN-V3.md`](product/LIVIA-MASTER-EXECUTION-PLAN-V3.md) § Era 1

| Wave | Focus | Status |
|------|-------|--------|
| **D0** (wk 1–4) | Wildcard subdomain book; subvertical profiles; `/my` visit shell v1; owner book-link parity | **Done (engineering)** — staging DNS flag pending |
| **D1** (wk 5–10) | `/my/{slug}` vertical morph; guest thread read API; vault module grid | **Done (engineering)** |
| **D2–D4** | Mary demo artifacts; pack/credit on `/my`; `BookingRescheduled`; activation funnel | **Done (engineering)** — D2 relationship table still derived |

| Item | Notes |
|------|-------|
| **Guest book URLs (D0)** | Policy helpers end-to-end; legacy `/b` redirects remain for bookmarks |
| **Guest thread (D1)** | `GET …/visits/:id/messages` + thread history on `/my` visit |
| **`/my` vault modules** | `GuestMyVaultModules` wired on shop + visit with scroll targets |
| **Mary demo breadth (D3)** | `seedDemoGuestHub` + `ensureMaryGuestHubArtifacts` — pets, vehicle, beauty, medspa, physio plan, fitness class |
| **Fitness pack (D3)** | `peak-fitness-dublin` in Mary's `packageCreditSlugs` |
| **BookingRescheduled (Q3)** | `EVENT_CATALOG` + domain bus + analytics emit on reschedule |
| **Activation funnel (Q4)** | Owner `/lifecycle` sacred-metric checklist panel |
| **Subdomain live** | Enable `VITE_GUEST_SUBDOMAIN_LIVE` + API `GUEST_BOOK_HOST_SUFFIX` when DNS ready |

---

## Prior active work (closed or absorbed into Era 1)

| Item | Notes |
|------|-------|
| **Guest placement P0–P3** | Shipped 2026-06-15 — [`GUEST-SURFACE-PLACEMENT-CONTRACT.md`](design/GUEST-SURFACE-PLACEMENT-CONTRACT.md) |
| **Liv Era 1 mandate** | Policy OS + bounded agent — [`LIV-OPERATING-SYSTEM.md`](product/LIV-OPERATING-SYSTEM.md) §16 |
| **Production readiness rubric** | `pnpm readiness:score` — evidence-backed gap matrix figures |

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
| 2026-06-16 | **Era 2 engineering complete (Q1–Q3)** — Twin hub API, `/me/capabilities`, advisor Liv mode, Twin-only briefing/presence, recommendation confidence; V1 activation proof (Bucket C) still open |
| 2026-06-15 | Era 1 D0–D4 engineering wave — guest thread GET, vault modules, Mary artifacts, BookingRescheduled, activation funnel |
| 2026-06-15 | Era 1 Q1 kickoff — D0 owner book-link parity; readiness rubric; Bucket C 80% |
| 2026-06-15 | Guest placement contract + Liv Era 1 doc (§16); `/book` deposit in summary, silent hub autofill, universal deposits |
| 2026-06-05 | GTM Wave 1 lock — nine verticals, one bar; subdomain + `/my`; innovation program; retire `/b` UX |
| 2026-06-05 | Master Blueprint Volumes 0–H; V3 execution plan; Era 1 focus replaces open-ended wellness wave 7 |
| 2026-06-02 | R∞: Liv setup copilot spec + Track I in evolution program |
| 2026-06-01 | All nine vertical program docs + VERTICALS build plan + `vertical:doc-check` for every enum |
| 2026-06-01 | Beauty program + Bloom UAT; mobile preset tint; doc propagation cascade |
| 2026-05-31 | Screen-card P0 registry + `screen-cards:status` / `screen-cards:update` (PNG = per-screen northstar) |
| 2026-05-31 | Bucket C: founder UAT checklist, E2E, screen-card pixel gate |
| 2026-05-31 | Bucket B complete |
