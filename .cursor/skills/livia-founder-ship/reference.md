# Founder ship — commands

| Command | Purpose |
|---------|---------|
| `pnpm run typecheck` | Pre-push |
| `pnpm staging:readiness` | Staging config + API leak checks (PLAN_CATALOGUE pricing needles) |
| `pnpm smoke:staging` | Staging HTTP smoke |
| `pnpm prod:smoke` | Production smoke |
| `pnpm founder:uat-preflight` | Local UAT preflight |
| `pnpm founder:release-gate` | Local gate file |
| `pnpm gate:production-ready` | Production readiness script |
| `pnpm clerk:check-keys` | Clerk alignment |
| `pnpm deploy:migrate` | DB migrate deploy path (see runbook) |

**Domains:** `app.livia-hq.com` · `api.livia-hq.com` · staging `*.staging.livia-hq.com`
