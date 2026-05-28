# E2E / Gate 3 smoke (`@workspace/e2e`)

Playwright tests for launch-plan **E1** + Phase 10 API gates.

**Full instructions:** [`docs/testing/E2E-TESTING-GUIDE.md`](../docs/testing/E2E-TESTING-GUIDE.md)

## Quick start

```bash
pnpm e2e:prep
pnpm dev:api          # :3000
pnpm dev:dashboard    # :5173

pnpm smoke:gate3
pnpm test:e2e:api     # API + Phase 10 (no browser UI auth)
pnpm test:e2e         # + dashboard shells
```

## Specs

| File | Project |
|------|---------|
| `tests/api-gate.spec.ts` | api |
| `tests/phase10-gate.spec.ts` | api |
| `tests/dashboard-gate.spec.ts` | dashboard |

## Env

Copy [`.env.example`](../.env.example) → repo `.env`.

- `E2E_API_BASE` (default `http://127.0.0.1:3000`)
- `E2E_DASHBOARD_BASE` (default `http://127.0.0.1:5173`)
- `E2E_DEMO_SLUG` (default `luxe-salon-spa`)
- `PARTNER_API_KEY` / `E2E_PARTNER_API_KEY` — enables partner bookings test

Authenticated flows (inbox, billing checkout, chain rollup UI) are **manual** — see the testing guide §4.
