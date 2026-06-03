---
name: livia-founder-ship
description: >-
  Deploy and verify Livia staging or production (Vercel dashboard/marketing,
  Railway API) with pre-ship gates and post-deploy readiness. Use when the user
  says deploy, staging, prod, ship, monitor vercel railway, or ready to deploy.
---

# Livia founder ship

## Never commit

- `founder-gate.json` (local gate artifact — exclude from git add)
- Secrets, `.env`, credentials

## Staging GO workflow

1. **Pre-push:** `pnpm run typecheck`
2. **Commit/push** only when user explicitly asked (see user git rules).
3. **Trigger:** push to `main` → Vercel (`livia-stg`) + Railway API (GitHub deploy).
4. **Post-deploy:** `pnpm staging:readiness`
5. **Smoke:** `pnpm smoke:staging` if needed
6. **Human:** incognito sign-in on staging app URL

### Vercel nuance

- **`livia-stg`** = staging project (dashboard root `artifacts/livia-dashboard`)
- **`livia-app`** = production — do not confuse "Production Deployment" email with prod customers
- Docs: [`VERCEL-DEPLOY-ENVIRONMENTS.md`](../../docs/operations/VERCEL-DEPLOY-ENVIRONMENTS.md)

## Production NO-GO until

- Bucket **C** founder staging walkthrough signed ([`LIVIA-STATUS.md`](../../docs/LIVIA-STATUS.md))
- [`docs/ops/GO-LIVE-CHECKLIST.md`](../../docs/ops/GO-LIVE-CHECKLIST.md) green
- `pnpm gate:production-ready` / [`production-readiness-gate.mjs`](../../scripts/production-readiness-gate.mjs) as appropriate

Brief answer if user asks "deploy prod now" but gates open: **staging yes, prod not yet** + one reason.

## Local founder gates (before push)

```bash
pnpm founder:uat-preflight
pnpm founder:release-gate    # writes founder-gate.json locally
pnpm founder:pre-ship        # prod smoke + reminder
```

## Runbooks

- [`FOUNDER-RELEASE-RUNBOOK.md`](../../docs/operations/FOUNDER-RELEASE-RUNBOOK.md)
- [`STAGING-SETUP.md`](../../docs/operations/STAGING-SETUP.md)
- [`RAILWAY-DEPLOY.md`](../../docs/operations/RAILWAY-DEPLOY.md)

## Reference

[`reference.md`](reference.md) — command cheat sheet.
