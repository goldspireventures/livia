# Event vendors — Atelier wedge crops (G2)

**Preset:** `event-atelier` (default event-vendor presentation — gallery enquire-first, warm decor studio)  
**Demo tenant:** `atelier-decor-dublin`

## Beats

| File | Surface |
|------|---------|
| `inbox.png` | Unified consult inbox (`/inbox`) |
| `quote-gen.png` | Quotes & invoices (`/quotes`) |
| `catalogue.png` | Public services catalogue (`/e/atelier-decor-dublin/services`) |
| `milestone-pay.png` | Guest quote accept (`/e/…/q/{token}`) |

Runtime copies: `artifacts/livia-dashboard/public/w2-gateway/beats/event-vendors/atelier/`

## Regenerate

```bash
node scripts/start-platform-for-test.mjs
pnpm capture:event-vendor-wedge
```

Requires demo world provisioned (Atelier depth seed with sent quote).
