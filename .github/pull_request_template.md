## Release sweep (7 surfaces)

Before merge, confirm each applies to this change:

- [ ] **API + DB** — routes, services, migrations applied in staging
- [ ] **Dashboard** — owner/staff UX, persona nav, settings if policy changed
- [ ] **Mobile** — parity for new owner flows (or N/A documented)
- [ ] **livia.io / marketing** — copy, vertical pages, locale if DACH
- [ ] **Public `/b`** — booking, guards, continuity, medspa consent if relevant
- [ ] **Internal portal** (`livia-internal`) — ops metrics / tenant tools if platform-wide
- [ ] **Policy / Liv packs** — verticals, entitlements, continuity templates

## Summary



## Test plan

- [ ] `pnpm typecheck` (or scoped packages touched)
- [ ] Migration SQL run on staging DB
- [ ] Manual smoke on dashboard + public book path

## Migrations

List new files under `lib/db/migrations/sql/`:

- 
