# Scripts index

| Script | Command | Purpose |
|--------|---------|---------|
| `e2e-prep.mjs` | `pnpm e2e:prep` | Migrations, typecheck, API tests, Playwright browser |
| `provision-demo-world.mjs` | `pnpm demo:provision` | POST `/api/demo/provision` (API must be running) |
| `apply-sql-migrations.mjs` | `pnpm db:migrate:sql` | Apply `lib/db/migrations/sql/*.sql` |
| `with-db-target.mjs` | `pnpm db:sync:staging` / `db:sync:prod` | Run push+migrate against staging or `DATABASE_URL_PROD` |
| `show-db-targets.mjs` | `pnpm db:targets` | Print configured DB host hints |
| `seed-demo.mjs` | `pnpm db:seed` | Legacy luxe-salon-spa seed |
| `reset-demo-for-test.mjs` | `pnpm reset:demo` | Wipe selected demo slugs before re-provision |
| `repo-health-audit.mjs` | `pnpm repo:health` | Doc + dist + naming foot-guns |
| `demo-smoke.mjs` | `pnpm smoke:demo` | Quick API health |
| `gate3-smoke.mjs` | `pnpm smoke:gate3` | Gate 3 checklist |

**Full demo walkthrough:** start API + dashboard, then `pnpm demo:provision`, open `/demo`.
