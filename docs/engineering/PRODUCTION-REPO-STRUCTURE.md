# Production-grade repo structure

**Status:** Phase 1 implemented (2026-05-25) — layout docs, script contracts, health audit.  
**Phase 2 (deferred):** Rename `artifacts/` → `apps/` — requires CI + import path RFC.

## What “production grade” means here

| Layer | Bar |
|-------|-----|
| **Monorepo** | pnpm workspace, shared `lib/*` packages, one version of React for mobile |
| **Build** | `pnpm typecheck` + per-artifact build; no committed `dist/` |
| **Data** | SQL migrations applied before Drizzle push; demo provision idempotent |
| **Test** | API unit tests + Playwright gates + visual capture suite |
| **Ops** | `.github/workflows/ci.yml`, `scripts/deploy-migrate.sh`, env via `.env` only |
| **Docs** | Canonical index, parity matrix, E2E runbook, this layout map |

## Current layout (canonical)

See [`REPO-LAYOUT.md`](./REPO-LAYOUT.md).

## Phase 1 — done in repo

- `docs/engineering/REPO-LAYOUT.md` — where every surface lives
- `scripts/README.md` — script index (demo, e2e, migrate, health)
- `pnpm demo:provision` — full demo world via API
- `pnpm test:e2e:full` — prep + API + visual + contextual audit
- `pnpm repo:health` — structure/doc foot-gun audit
- Demo world: IE chain + verticals + **GB/DE/FR markets** + real-world premises + Liv signals

## Phase 2 — optional RFC (`rfc-apps-folder`)

1. Rename `artifacts/api-server` → `apps/api` (or keep name, move folder only)
2. Update `pnpm-workspace.yaml`, Docker, CI paths
3. Add path aliases in tsconfig roots
4. One release PR; no half-migrated state

**Why deferred:** 200+ import paths and deploy scripts; zero user value until deploy pipeline moves.

## Phase 3 — production deploy bundle

- Single `docker-compose.prod.yml` (api + dashboard static + marketing static)
- Secrets only via host env / Supabase / Clerk dashboards
- `pnpm deploy:migrate` in release job before traffic shift

## Manual walkthrough checklist (founder)

After `pnpm demo:provision`:

1. `/demo` → **Set up full demo world** (or CLI above)
2. **Founder** → `/chain` — 3 Aurora shops + pulse
3. Switch shop → **GB** `london-rose-spa`, **DE** `berlin-studio-neun`, **FR** `paris-belle-vue`
4. **Inbox** — OPEN + HANDED_OFF; **Liv moments** strip on dashboard
5. **Settings → Liv** — tool catalog toggles
6. **Customer detail** — Liv memory panel
7. Public `/b/aurora-studio`, `/b/london-rose-spa`
8. **Owner** persona → `conors-cut-co` single-shop path

Visual artifacts: `e2e/visual-captures/` after `pnpm test:e2e:full`.
