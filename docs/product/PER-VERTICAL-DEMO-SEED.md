# Per-vertical demo seed spec (EU v1)

**Status:** L2 — index only; **experience depth** in [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md)  
**Code:** `artifacts/api-server/src/services/demo-vertical-shops.seed.ts`, `demo-showcase-depth.ts`, `demo-vertical-extras.seed.ts`, `demo-portal.service.ts`

| Vertical | Slug (showcase) | Services (min) | Staff (min) | Hero artifact |
|----------|-----------------|----------------|-------------|---------------|
| hair | `luxe-salon-spa` | 5 | 3 | colour + regulars inbox |
| beauty | `bloom-beauty-dublin` | 5 | 3 | lash cycle threads |
| wellness | `harbour-wellness-cork` | 5 | 3 | packages / calm copy |
| body-art | `ink-anchor-galway` | 5 | 3 | **guest proof token** |
| pet-grooming | `paws-parlour-dublin` | 5 | 3 | **2 pets** on demo customers |
| medspa | `clarity-medspa-dublin` | 5 | 3 | consent pending |
| allied-health | `motion-physio-cork` | 5 | 3 | plan rebook |
| fitness | `peak-fitness-dublin` | 5 | 3 | class + waitlist |
| automotive-detailing | `shine-studio-belfast` | 5 | 3 | long bay packages |

**Market shops (locale):** `demo-market-shops.seed.ts` — `copenhagen-havn-wellness`, `london-rose-spa`, `berlin-studio-neun`, `paris-belle-vue` (≥5 services, ≥3 staff, ≥20 customers each).

**Sync (idempotent):** `POST /api/demo/sync-vertical-showcase` — backfills staff/services/customers, live day, vertical extras. Does **not** re-sync Clerk unless new shops added.

**Rule:** Seeds only change **data + copy packs** — never route graph.

**E2E:** `demo-live-day.spec.ts`, `demo-proof-token.spec.ts`, `public-booking-quality.spec.ts`

**Exit:** `pnpm e2e:prep` + demo provision + sync → all slugs in [`DEMO-FULL-SHOWCASE.md`](../testing/DEMO-FULL-SHOWCASE.md) load with depth.
