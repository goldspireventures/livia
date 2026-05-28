# v3 engineering closure (in-repo)

**Date:** 2026-05-22  
**Program:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md)  
**Matrix:** [`V3-SURFACE-MATRIX.md`](./V3-SURFACE-MATRIX.md)

## Status

Engineering has delivered the **in-repo v3 scope** as a whole product across seven surfaces. Items marked ⏸ require founder/counsel/eval gates before **marketing** claims.

## Migrations to apply (required)

1. `lib/db/migrations/sql/011-v3-pet-grooming-continuity.sql`
2. `lib/db/migrations/sql/012-v3-medspa-waitlist.sql`
3. `lib/db/migrations/sql/013-v3-enterprise-sso.sql`

## Delivered by block

| Block | Delivered |
|-------|-----------|
| **R** Release rule | PR template + `scripts/v3-release-check.sh` + CI reminder |
| **M** Experience | Motion tokens, vertical tone CSS, public next steps, continuity panel + timeline |
| **N** Continuity | Bridge workflow, templates (DE formal), guards, MMS media, stuck queue, IG hint |
| **P** Pet / detailing | Packs, pets API, customer pets panel, marketing verticals |
| **A** Payroll | CSV export + preflight (toolkit) |
| **B** Internal | Platform v3 metrics, continuity traces tab, Liv assist |
| **F** Workflows | Waitlist offer, design-proof approve, no-show SMS, running-late broadcast |
| **G** Public API | Partner v1 read + write booking, docs |
| **I** DACH/FR | DE jurisdiction, `de-DE` continuity, `/de` marketing, FR pack, regulatory overlay |
| **J** Medspa | Procedures, consent, intake, clinical hub, public consent step |
| **L** Enterprise | Audit export CSV, SSO config stub (schema) |

## ⏸ Not claimed in marketing (gates)

- Medspa counsel-signed consent per market
- SOC2 Type 2 enterprise tier marketing
- German voice live without eval pass
- Meta IG API (deep-link + SMS thread is the product path)
- BYOK rotation (ADR/schema only)

## Verify locally

```bash
pnpm exec tsc -b lib/policy lib/db lib/entitlements lib/event-bus
pnpm run typecheck
pnpm --filter @workspace/api-server run test
```

## Founder lane (out of repo)

Commercial ship, counsel, SOC2 audit, voice DE eval — [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md).
