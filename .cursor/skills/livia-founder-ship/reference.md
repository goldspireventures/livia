# Founder ship — commands

| Command | Purpose |
|---------|---------|
| `pnpm run typecheck` | Pre-push |
| `node scripts/staging-readiness.mjs --strict` | Staging config + API leak checks |
| `pnpm smoke:staging` | Staging HTTP smoke |
| `pnpm prod:smoke` | Production smoke |
| `pnpm founder:uat-preflight` | Local UAT preflight |
| `pnpm founder:release-gate` | Local gate file |
| `pnpm gate:production-ready` | Production readiness script |
| `pnpm clerk:check-keys` | Clerk alignment |
| `pnpm deploy:migrate` | DB migrate deploy path (see runbook) |

**Domains:** `app.livia-hq.com` · `api.livia-hq.com` · staging `*.staging.livia-hq.com`
