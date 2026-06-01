# Founder UAT checklist (Bucket C)

**Updated:** 2026-05-31  
**Use after** Bucket B deploy on staging (`app.staging.livia-hq.com` or local).

**Not production:** Vercel project `livia-stg` may email “Production Deployment” — that is Vercel’s label for `main` on the **staging** project, not `app.livia-hq.com`. See [`VERCEL-DEPLOY-ENVIRONMENTS.md`](./VERCEL-DEPLOY-ENVIRONMENTS.md).

Automated prelude:

```bash
pnpm northstar:check
pnpm founder:uat-preflight
pnpm --filter @workspace/e2e run test:p0-visual
pnpm --filter @workspace/e2e run test:founder-uat    # needs Clerk + API + dashboard
```

---

## Medspa owner — Clarity Medspa (`clarity-medspa-dublin`)

| # | Path | Pass? | Notes |
|---|------|-------|-------|
| 1 | `/dashboard` | | Ritual home only — **no** “public link” mega-card; briefing + pending/inbox modules contextual |
| 2 | `/medspa` | | Consents/intakes/waitlist — busiest tab opens first |
| 3 | `/inbox` | | Three-pane; context rail **only** when a thread is selected |
| 4 | `/customers` | | Compact roster; merge panel only when suggestions exist |
| 5 | `/services` | | Compact list (not card grid) |
| 6 | `/bookings` | | Compact list; open one row → detail merged client/service card |
| 7 | Open any client | | Profile compact; book from footer |
| 8 | `/settings?tab=shop` | | Booking link strip at top; contact fields collapsed |
| 9 | `/settings?tab=appearance` | | Preset + `/b` preview updates when accent changes |
| 10 | `/b/clarity-medspa-dublin` | | Mobile 390px — medspa skin, consent step if applicable |

---

## Beauty owner — Bloom (`bloom-beauty-dublin`)

**Canonical beauty UAT tenant** — see [`BEAUTY-VERTICAL-PROGRAM.md`](../product/BEAUTY-VERTICAL-PROGRAM.md).

| # | Path | Pass? | Notes |
|---|------|-------|-------|
| 1 | `/dashboard` | | Noir Dusk (or chosen preset); briefing + inbox/pending modules contextual |
| 2 | `/inbox` | | Patch-test / lash context in threads if seeded |
| 3 | `/services` | | Compact list; Lashes / Nails / Brows categories |
| 4 | `/customers` | | Compact roster |
| 5 | `/bookings` | | Confirm flow; patch-test notes on guest book if tested |
| 6 | `/settings?tab=appearance` | | All four beauty presets; iframe `/b` tracks accent |
| 7 | `/b/bloom-beauty-dublin` | | Mobile 390px — preset matches settings; patch-test guard on book |
| 8 | Mobile app (Bloom owner) | | Today + Inbox; tab accent matches preset tint |
| 9 | `/demo/wedge/beauty` | | Gateway story — inbox → book → SMS → today |

---

## Salon owner — Luxe (`luxe-salon-spa`) — hair reference

| # | Path | Pass? | Notes |
|---|------|-------|-------|
| 1 | `/dashboard` | | Same density rules as medspa |
| 2 | `/inbox` | | |
| 3 | `/toolkit` | | Focused Liv hub — no stuck/drift/moments strips |
| 4 | `/customers` | | Compact roster |
| 5 | `/services` | | Compact list (not card grid) |
| 6 | `/staff` | | |
| 7 | `/bookings` | | |
| 8 | `/settings?tab=appearance` | | Live preview iframe |
| 9 | `/b/luxe-salon-spa` | | Public book flow ≤90s on phone |

---

## Beta-full verticals — 5-path smoke

Use each program doc § **L8 — Completion** for slug + owner login. Index: [`VERTICAL-PROGRAMS-INDEX.md`](../product/VERTICAL-PROGRAMS-INDEX.md).

| Vertical | Demo slug | Program |
|----------|-----------|---------|
| Wellness | `harbour-wellness-cork` | [WELLNESS](../product/WELLNESS-VERTICAL-PROGRAM.md) |
| Body art | `ink-anchor-galway` | [BODY-ART](../product/BODY-ART-VERTICAL-PROGRAM.md) |
| Fitness | `peak-fitness-dublin` | [FITNESS](../product/FITNESS-VERTICAL-PROGRAM.md) |
| Pet grooming | `paws-parlour-dublin` | [PET-GROOMING](../product/PET-GROOMING-VERTICAL-PROGRAM.md) |
| Allied health | `motion-physio-cork` | [ALLIED-HEALTH](../product/ALLIED-HEALTH-VERTICAL-PROGRAM.md) |
| Automotive | `shine-studio-belfast` | [AUTOMOTIVE](../product/AUTOMOTIVE-DETAILING-VERTICAL-PROGRAM.md) |

---

## Sign-off

| Item | Founder | Date |
|------|---------|------|
| Medspa paths 1–10 feel “finished” for R1 demo | | |
| Beauty (Bloom) paths 1–9 feel “finished” for R1 demo | | |
| Salon (hair Luxe) paths 1–9 feel “finished” for R1 demo | | |
| Bucket C → production preset flag OK | | |

When both vertical rows are checked, reply **“Bucket C UAT passed”** (with exceptions listed).
