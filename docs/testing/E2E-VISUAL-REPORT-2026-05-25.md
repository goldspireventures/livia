# E2E & visual audit report — 2026-05-25

## Automated (ran in CI-local)

| Suite | Result | Notes |
|-------|--------|-------|
| `pnpm e2e:prep --skip-browsers` | ✅ | Migrations 016–018 applied; API unit tests pass |
| `pnpm demo:provision` (CLI) | ✅ | **18 businesses**, 72 memory rows, 36 Liv signals |
| `pnpm test:e2e:api` | ✅ (6 pass, 4 skip) | Country field test skips until API restart |

## Requires your machine (visual)

Start stack, restart API after pull, then:

```bash
pnpm dev:api          # restart so public API returns country/locale
pnpm dev:dashboard
pnpm demo:provision   # idempotent CLI
pnpm e2e:founder-checklist
pnpm e2e:visual-capture
pnpm e2e:contextual-web
```

Or one shot: `pnpm test:e2e:full` (long; needs Clerk + Playwright auth).

## Demo world inventory (18 shops)

| Region | Slugs |
|--------|-------|
| IE chain | `aurora-studio`, `aurora-mews`, `aurora-galway`, `conors-cut-co` |
| IE verticals | `bloom-beauty-dublin`, `harbour-wellness-cork`, `ink-anchor-galway`, `paws-parlour-dublin`, `clarity-medspa-dublin`, `motion-physio-cork`, `peak-fitness-dublin` |
| EU markets | `london-rose-spa` (GB), `berlin-studio-neun` (DE), `paris-belle-vue` (FR) |
| Real-world | `stoneybatter-cuts`, `dublin-barber-collective`, `dundrum-hair-studio`, `dundrum-serenity-spa` |
| Premises | `dundrum-house` (picker `/p/dundrum-house`) |
| E2E legacy | `luxe-salon-spa` (`pnpm db:seed`) |

## Manual walkthrough

See [`MANUAL-WALKTHROUGH-DEMO.md`](./MANUAL-WALKTHROUGH-DEMO.md).

## Known visual/UX watch list (review screenshots)

- Settings tabs: long legal/billing on small viewports — scroll OK?
- Public booking medspa consent step — form density on mobile width
- Chain view with 10+ founder-owned shops — switcher discoverability
- Liv moments strip empty vs populated — dashboard should show moments after provision
- Inbox HANDED_OFF card contrast (amber/destructive tiers)

## Repo structure (phase 1)

- [`../engineering/REPO-LAYOUT.md`](../engineering/REPO-LAYOUT.md)
- [`../engineering/PRODUCTION-REPO-STRUCTURE.md`](../engineering/PRODUCTION-REPO-STRUCTURE.md)
- Phase 2 (`artifacts/` → `apps/`) deferred — RFC required
