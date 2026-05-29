# Livia Internal

Company operator UI for **Livia Inc** (cross-tenant). Not for salon owners.

- **Spec:** [`docs/company/livia-internal-portal-spec.md`](../../docs/company/livia-internal-portal-spec.md)
- **Run:** `pnpm install` from repo root, then `pnpm --filter @workspace/livia-internal dev`

**Phase 8 (P0):** tenant directory UI wired to `GET /internal/ops/tenants` and `GET /internal/ops/tenants/:id`.

1. Set `INTERNAL_OPS_SECRET` (or `INTERNAL_CRON_SECRET`) on api-server.
2. `pnpm dev:api` (default port **3001** — see repo-root `.env.example`).
3. Copy [`artifacts/livia-internal/.env.example`](./.env.example) → `.env` if you need a non-default API proxy.
4. `pnpm dev:internal` → open http://localhost:5175, paste **`INTERNAL_OPS_SECRET`** from repo-root `.env` (not Clerk).
5. Search by slug (e.g. `aurora-studio`) — health card shows last booking + Stripe/Clerk links.

Optional env (`artifacts/livia-internal/.env`): `VITE_DASHBOARD_URL` for founder cockpit links (matches API `DASHBOARD_URL`).
