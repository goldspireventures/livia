# Contributing to Livia

Thanks for helping build Livia. Start here, then follow the linked docs — do not read every file under `docs/` on day one.

## Day 1

1. Read [`docs/LIVIA-ALIGNMENT.md`](docs/LIVIA-ALIGNMENT.md) (what we are building).
2. Read [`docs/START-HERE.md`](docs/START-HERE.md) (where code and docs live).
3. Copy [`.env.example`](.env.example) → `.env` and per-app `artifacts/*/.env.example` → `.env`.
4. Run locally: [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md).

## Before every PR

```bash
pnpm install
pnpm run typecheck
```

For API or cross-surface changes, also run `pnpm test:e2e:preflight` when the stack is up (see [`docs/testing/E2E-RUNBOOK.md`](docs/testing/E2E-RUNBOOK.md)).

## Rules (short)

- **Monorepo:** `artifacts/*` = apps, `lib/*` = shared packages. `lib` must not import from `artifacts`.
- **Schema:** `lib/db` changes need migrations; see [`scripts/deploy-migrate.sh`](scripts/deploy-migrate.sh).
- **API contract:** edit `lib/api-spec/openapi.yaml`, then `pnpm codegen`.
- **Policy / copy:** use `@workspace/policy` and `GET /me/tenant-experience` — no hardcoded salon-only strings on owner paths.
- **Secrets:** never commit `.env` or API keys.
- **ADRs:** load-bearing changes get a new file in [`docs/adr/`](docs/adr/).

Full process: [`docs/engineering/contributing.md`](docs/engineering/contributing.md).

## Production domain

Public beta uses **`livia-hq.com`** (`app.`, `api.`, etc.). See [`docs/operations/APP-STORE-PRODUCTION-CHECKLIST.md`](docs/operations/APP-STORE-PRODUCTION-CHECKLIST.md).
