# Staging prep — livia-hq.com (Option A, deferred)

**Status:** Not provisioned yet — use [`STAGING-SETUP.md`](./STAGING-SETUP.md) when ready to turn staging on.

**Cost when you turn it on:** roughly a second Supabase project + second Railway service + extra Vercel projects (order of tens of €/month, not hundreds).

**Zero-cost prep now:** use the checklist in Founder cockpit (**Staging prep** section) and keep env names ready in `railway.env.example`.

---

## Target topology

| | Staging | Production (today) |
|--|---------|-------------------|
| API | `https://api.staging.livia-hq.com` | `https://api.livia-hq.com` |
| Dashboard | `https://app.staging.livia-hq.com` | `https://app.livia-hq.com` |
| Marketing | `https://staging.livia-hq.com` or `www.staging…` | `https://livia-hq.com` |
| Database | Supabase **staging** project | Supabase **prod** |
| Clerk | Staging Clerk app (`pk_test_` / `sk_test_` OK) | Live app |
| Demo | `LIVIA_DEMO_ENABLED=true` allowed | **Unset** |

---

## Provision order (when ready)

1. Create Supabase staging → `DATABASE_URL` on staging Railway only.
2. Create Clerk staging app → keys on staging only.
3. Duplicate Railway service from prod template → `railway.env.example` values with staging URLs.
4. Vercel: duplicate dashboard + marketing projects; point DNS at Cloudflare (grey cloud).
5. Railway `CORS_ALLOWED_ORIGINS` includes staging app + marketing origins.
6. Clerk staging: add `app.staging.livia-hq.com`, CNAME `clerk.staging…` if using CNAME pattern.
7. Run `pnpm prod:smoke --app https://app.staging.livia-hq.com --api https://api.staging.livia-hq.com`.
8. Update [`FOUNDER-RELEASE-RUNBOOK.md`](./FOUNDER-RELEASE-RUNBOOK.md) to staging-first promote.

---

## Env flags for “staging exists”

When partially live, set on API:

- `API_STAGING_URL=https://api.staging.livia-hq.com`

Cockpit **staging prep** status flips to `partial`.
