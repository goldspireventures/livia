# Livia — full surface map (v2 “entire product”)

**Purpose:** One checklist so no release ships half a product.  
**v2:** [`V2-ENGINEERING-CLOSED.md`](./V2-ENGINEERING-CLOSED.md) (wrapped).  
**v3 active:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) · [`V3-SURFACE-MATRIX.md`](./V3-SURFACE-MATRIX.md).  
**Every release:** all rows below get **changed or N/A** — [`../engineering/release-pipeline.md`](../engineering/release-pipeline.md).

---

## Surfaces that must move together for “entire Livia v2”

| # | Surface | Artifact / URL | Audience | v2 program block |
|---|---------|----------------|----------|------------------|
| 1 | **Public marketing** | `artifacts/livia-marketing` → **livia.io** `:5174` | Prospects, waitlist | **Block J** |
| 2 | **Tenant web** | `artifacts/livia-dashboard` `:5173` | Owners, managers | A, B–G |
| 3 | **Tenant mobile** | `artifacts/livia-mobile` Expo | Staff, owners | A, B–G (parity gaps) |
| 4 | **Customer booking** | `/b/{slug}` on dashboard | End customers | A + public API |
| 5 | **API** | `artifacts/api-server` `:3001` | All clients | A–G |
| 6 | **Internal ops** | `artifacts/livia-internal` `:5175` | Livia Inc | Block I |
| 7 | **Policy & DB** | `lib/policy`, `lib/db` | Kernel | B–D |

**Not product surfaces (do not gate v2):** `artifacts/mockup-sandbox` (brand experiments), `dist/` build output, founder-only Notion.

---

## Block J — livia.io (public marketing)

| ID | Work | Exit |
|----|------|------|
| J1.1 | `pnpm dev:marketing` (PORT 5174) | Local parity with E2E |
| J1.2 | Hero + pillars ⊆ `marketing-vs-reality.md` | No dental; no WA/IG as live |
| J1.3 | Vertical landings: hair, beauty, barber, tattoo, wellness, **fitness**, **body-art** | `/verticals/:slug` |
| J1.4 | Chair-rental host story | `/for/chair-rental` |
| J1.5 | Pricing: Solo/Studio/Chain/Host + **mid-chain / franchise** callouts | `/pricing` |
| J1.6 | UK + Nordics wedge copy (honest: policy packs, not full voice in prod) | Home + how-it-works |
| J1.7 | Footer: changelog, status; legal stubs or “at public launch” | No `#` dead links |
| J1.8 | Demo CTA → dashboard `/demo` via `VITE_DASHBOARD_DEMO_URL` | Works in dev |
| J1.9 | `POST /api/public/marketing/leads` | Waitlist form |
| J1.10 | E2E `marketing-gate` + gate3 smoke | CI / local with marketing up |

---

## Known gaps after engineering pass (honest)

| Surface | Gap |
|---------|-----|
| Marketing | Legal pages full content at GA; Liv public chat on marketing if claimed |
| Mobile | Rota, hiring, classes vs web |
| Internal | Feature flags, incidents, impersonation per portal spec |
| Dashboard | C8/C11 tier UI, package credits on customer |
| API | Live OAuth brokers; public API alpha |

---

## Dev stack (four terminals)

```powershell
pnpm dev:api          # :3001
pnpm dev:dashboard    # :5173
pnpm dev:internal     # :5175
pnpm dev:marketing    # :5174  ← livia.io
```

Or document in [`../testing/V2-FULL-E2E-INSTRUCTIONS.md`](../testing/V2-FULL-E2E-INSTRUCTIONS.md).

---

## Verification

```powershell
pnpm smoke:gate3
$env:E2E_MARKETING_URL="http://127.0.0.1:5174"
pnpm test:e2e:marketing
pnpm test:e2e:platform
```

**v3 engineering:** Active — [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) (platform + DACH + medspa, whole-product releases). **Founder:** [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md).
